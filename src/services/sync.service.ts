import { Injectable, inject, effect, untracked, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { StorageService } from './storage.service';
import { UtilityService } from './utility.service';
import { AppData } from '../models/app-data.model';

export interface DailyBackupRecord {
  date: string;
  timestamp: string;
  totalUsers: number;
  totalBills: number;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private http: HttpClient = inject(HttpClient);
  private storageService: StorageService = inject(StorageService);
  private utilityService: UtilityService = inject(UtilityService);

  private autoSyncIntervalId: any = null;
  private debounceTimer: any = null;
  private isInitialDataLoad = true;
  private isRestoring = false;

  private readonly AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes fallback
  private readonly DEBOUNCE_TIME = 1500; // 1.5 seconds for rapid auto-sync on any change
  private readonly DAILY_BACKUPS_KEY = 'netpay_daily_backup_records';
  private readonly PENDING_SYNC_KEY = 'netpay_pending_offline_sync';

  // Reactive state signals
  isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  isSyncing = signal(false);
  hasPendingOfflineChanges = signal(typeof localStorage !== 'undefined' && localStorage.getItem(this.PENDING_SYNC_KEY) === 'true');
  dailyBackupRecords = signal<DailyBackupRecord[]>(this.loadDailyBackupRecords());

  constructor() {
    // Setup online/offline network listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('App is back online');
        this.isOnline.set(true);
        const settings = this.storageService.settings();
        if (settings.autoSyncEnabled && settings.userEmail) {
          this.utilityService.showNotification('Connected to Internet. Backing up data...', 'info');
          this.backupData(undefined, true);
        }
      });

      window.addEventListener('offline', () => {
        console.log('App went offline');
        this.isOnline.set(false);
        this.utilityService.showNotification('Offline mode. Changes are saved locally and will auto-sync when online.', 'info');
      });
    }

    // Effect for periodic 5-minute interval timer (fallback safety)
    effect(() => {
      const settings = this.storageService.settings();
      if (settings.autoSyncEnabled && settings.userEmail) {
        this.startAutoSyncTimer();
      } else {
        this.stopAutoSyncTimer();
      }
    });

    // Effect for instant sync whenever user or billing data changes
    effect(() => {
      // Subscribe to users and billEntries signals
      this.storageService.users();
      this.storageService.billEntries();

      if (this.isInitialDataLoad) {
        // App just launched
        Promise.resolve().then(() => {
          this.isInitialDataLoad = false;
          // Trigger automatic recovery check or backup on app startup after 2 seconds
          setTimeout(async () => {
            const currentSettings = this.storageService.settings();
            const currentData = this.storageService.getCompleteData();

            // SAFEGUARD: If local data is completely empty (e.g., Chrome history / site data was cleared)
            if (currentData.users.length === 0 && currentData.billEntries.length === 0) {
              if (currentSettings.userEmail && this.isOnline() && currentSettings.appsScriptUrl) {
                console.log('[SyncService] Local dataset empty on launch. Checking for cloud backup to auto-recover...');
                await this.silentCheckAndRestoreCloud(currentSettings.userEmail);
              }
              return;
            }

            if (currentSettings.autoSyncEnabled && currentSettings.userEmail && this.isOnline()) {
              console.log('App startup automatic cloud sync running...');
              this.backupData(undefined, true);
            }
          }, 2000);
        });
        return;
      }
      
      if (this.isRestoring) {
        return;
      }

      const settings = untracked(this.storageService.settings);
      if (settings.autoSyncEnabled && settings.userEmail) {
        if (!this.isOnline()) {
          console.log('Offline change detected. Queued for auto-sync on reconnect.');
          this.hasPendingOfflineChanges.set(true);
          try {
            localStorage.setItem(this.PENDING_SYNC_KEY, 'true');
          } catch (e) {}
        } else {
          this.debounceBackup();
        }
      }
    });
  }

  private loadDailyBackupRecords(): DailyBackupRecord[] {
    try {
      const raw = localStorage.getItem(this.DAILY_BACKUPS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveDailyBackupRecord(record: DailyBackupRecord) {
    try {
      const current = this.loadDailyBackupRecords();
      // Keep unique by date, up to last 30 daily backups
      const filtered = current.filter(r => r.date !== record.date);
      const updated = [record, ...filtered].slice(0, 30);
      localStorage.setItem(this.DAILY_BACKUPS_KEY, JSON.stringify(updated));
      this.dailyBackupRecords.set(updated);
    } catch (e) {
      console.error('Error saving daily backup record', e);
    }
  }

  private debounceBackup() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      console.log('Data change detected. Performing automatic instant backup...');
      this.backupData(undefined, true);
    }, this.DEBOUNCE_TIME);
  }

  private startAutoSyncTimer() {
    if (this.autoSyncIntervalId) {
      return;
    }
    this.autoSyncIntervalId = setInterval(() => {
      if (this.isOnline()) {
        console.log('Performing scheduled 5-minute interval sync...');
        this.backupData(undefined, true);
      }
    }, this.AUTO_SYNC_INTERVAL);
  }

  private stopAutoSyncTimer() {
    if (this.autoSyncIntervalId) {
      clearInterval(this.autoSyncIntervalId);
      this.autoSyncIntervalId = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  async backupData(email?: string, isAuto: boolean = false) {
    const settings = this.storageService.settings();
    const backupEmail = (email || settings.userEmail || '').trim();
    
    if (!settings.appsScriptUrl) {
      if (!isAuto) this.utilityService.showNotification('Apps Script URL is not configured.', 'error');
      return;
    }
    
    if (!backupEmail) {
      if (!isAuto) this.utilityService.showNotification('Please configure your backup email in Settings first.', 'info');
      return;
    }

    const appData = this.storageService.getCompleteData();

    // CRITICAL ANTI-WIPE SHIELD:
    // If local dataset has zero users and zero bills, do NOT silently overwrite cloud backups!
    if (appData.users.length === 0 && appData.billEntries.length === 0) {
      if (isAuto) {
        console.warn('[SyncService] Auto-backup skipped: Local database is empty. Preserving cloud backup.');
        return;
      }
      if (!confirm('Warning: Local database contains 0 users. Are you sure you want to back up an empty dataset?')) {
        return;
      }
    }

    if (!this.isOnline()) {
      this.hasPendingOfflineChanges.set(true);
      try {
        localStorage.setItem(this.PENDING_SYNC_KEY, 'true');
      } catch (e) {}
      if (!isAuto) {
        this.utilityService.showNotification('You are currently offline. Backup will sync as soon as you reconnect.', 'info');
      }
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isNewDay = settings.lastDailyBackupDate !== todayStr;

    const payload = {
      action: 'sync',
      email: backupEmail,
      appData: appData,
      backupDate: todayStr,
      backupTimestamp: new Date().toISOString(),
      isDailyBackup: isNewDay
    };

    const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });

    try {
      this.isSyncing.set(true);
      if (!isAuto) this.utilityService.showNotification('Starting backup...', 'info');
      
      const response: any = await firstValueFrom(
        this.http.post(settings.appsScriptUrl, JSON.stringify(payload), { headers })
      );

      if (response && response.status === 'success') {
        const nowIso = new Date().toISOString();
        this.storageService.updateSettings({ 
          lastSyncTimestamp: nowIso,
          lastDailyBackupDate: todayStr
        });

        // Record daily backup snapshot
        this.saveDailyBackupRecord({
          date: todayStr,
          timestamp: nowIso,
          totalUsers: appData.users.length,
          totalBills: appData.billEntries.length
        });

        // Clear offline pending flag
        this.hasPendingOfflineChanges.set(false);
        try {
          localStorage.removeItem(this.PENDING_SYNC_KEY);
        } catch (e) {}

        if (!isAuto) {
          this.utilityService.showNotification('Backup successful to Google Drive!', 'success');
        }
      } else {
        throw new Error(response?.message || 'Server error during backup');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      if (!isAuto) {
        this.utilityService.showNotification(`Backup failed: ${(error as Error).message}`, 'error');
      }
    } finally {
      this.isSyncing.set(false);
    }
  }

  async restoreData(email: string) {
    const settings = this.storageService.settings();
    if (!settings.appsScriptUrl) {
      this.utilityService.showNotification('Apps Script URL is not configured.', 'error');
      return;
    }
    
    if(!confirm('This will overwrite all current local data. Are you sure you want to restore?')) {
      return;
    }

    const payload = {
      action: 'load',
      email: email
    };

    const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });
    
    this.isRestoring = true;

    try {
      this.isSyncing.set(true);
      this.utilityService.showNotification('Restoring data...', 'info');
      const response: any = await firstValueFrom(
        this.http.post(settings.appsScriptUrl, JSON.stringify(payload), { headers })
      );
      if (response.status === 'success' && response.data) {
        this.storageService.loadCompleteData(response.data as Partial<AppData>);
        this.storageService.updateSettings({ userEmail: email, lastSyncTimestamp: new Date().toISOString() });
        this.utilityService.showNotification('Data restored successfully!', 'success');
      } else {
        throw new Error(response.message || 'No data found in backup.');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      this.utilityService.showNotification(`Restore failed: ${(error as Error).message}`, 'error');
    } finally {
      this.isRestoring = false;
      this.isSyncing.set(false);
    }
  }

  /**
   * Automatically checks if a cloud backup exists and restores it silently if local data was wiped
   */
  async silentCheckAndRestoreCloud(email: string): Promise<boolean> {
    const settings = this.storageService.settings();
    if (!settings.appsScriptUrl || !this.isOnline()) {
      return false;
    }

    const payload = {
      action: 'load',
      email: email
    };

    const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });

    try {
      this.isSyncing.set(true);
      const response: any = await firstValueFrom(
        this.http.post(settings.appsScriptUrl, JSON.stringify(payload), { headers })
      );

      if (response && response.status === 'success' && response.data) {
        const cloudData = response.data as Partial<AppData>;
        if ((cloudData.users && cloudData.users.length > 0) || (cloudData.billEntries && cloudData.billEntries.length > 0)) {
          console.log('[SyncService] Successfully auto-recovered cloud backup on launch!');
          this.storageService.loadCompleteData(cloudData);
          this.storageService.updateSettings({ userEmail: email, lastSyncTimestamp: new Date().toISOString() });
          this.utilityService.showNotification(
            `Browser data was cleared, but ${cloudData.users?.length || 0} users have been automatically restored from Google Drive!`,
            'success'
          );
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log('[SyncService] Silent cloud recovery check completed without restore:', error);
      return false;
    } finally {
      this.isSyncing.set(false);
    }
  }
}