import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AppData, AppSettings } from '../models/app-data.model';
import { User } from '../models/user.model';
import { BillEntry } from '../models/bill-entry.model';
import { IndexedDbService, StorageSnapshot } from './indexed-db.service';
import { UtilityService } from './utility.service';
import { MOCK_USERS, generateMockBillEntries } from '../models/mock-data';

const DEFAULT_DATA: AppData = {
  users: [],
  billEntries: [],
  settings: {
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzTt-uNDTUWBHEc2RykXsmSih1n9lnl7-etUnkC66J0w9vEjHsSm1FhbfYyudvA09rl/exec',
    userEmail: null,
    autoSyncEnabled: true,
    lastSyncTimestamp: null,
    lastDailyBackupDate: null,
    licenseInfo: {
      key: 'OPEN-SOURCE-COMMUNITY-EDITION',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString() // 10 years
    },
  }
};

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly STORAGE_KEY = 'netPayProData';
  private indexedDbService = inject(IndexedDbService);
  private utilityService = inject(UtilityService);
  
  private _appData = signal<AppData>(this.loadData());

  // Public signals
  users = computed(() => this._appData().users);
  billEntries = computed(() => this._appData().billEntries);
  settings = computed(() => this._appData().settings);

  // Storage persistence state
  isStoragePersisted = signal<boolean>(false);
  availableSnapshots = signal<StorageSnapshot[]>([]);
  lastSnapshotDate: string | null = null;

  constructor() {
    // 1. Persist changes automatically to both localStorage and IndexedDB
    effect(() => {
      const data = this._appData();
      this.saveData(data);
    });

    // 2. Initialize persistent storage and recover from IndexedDB if localStorage was cleared
    if (typeof window !== 'undefined') {
      this.initializeStorageProtection();
    }
  }

  private async initializeStorageProtection() {
    try {
      // Request Chrome Persistent Storage
      const { persisted } = await this.indexedDbService.requestPersistentStorage();
      this.isStoragePersisted.set(persisted);

      // Load available snapshots
      const snapshots = await this.indexedDbService.getSnapshots();
      this.availableSnapshots.set(snapshots);

      // Check if localStorage was completely empty (e.g. after clearing Chrome history/data)
      const current = this._appData();
      if (current.users.length === 0 && current.billEntries.length === 0) {
        const idbData = await this.indexedDbService.loadAppData();
        const hasMockData = idbData?.users?.some((u: any) => 
          u.phone === '00000000000' || 
          u.name === 'Arthur Pendelton' || 
          (u.name && u.name.startsWith('Demo User')) || 
          (u.name && u.name.startsWith('Demo Subscriber'))
        );
        if (hasMockData) {
          await this.indexedDbService.saveAppData(current);
          return;
        }

        if (idbData && (idbData.users?.length > 0 || idbData.billEntries?.length > 0)) {
          console.log('[StorageService] Recovered data from IndexedDB!', idbData.users.length, 'users');
          this.loadCompleteData(idbData);
          this.utilityService.showNotification('Data automatically recovered from secure persistent database!', 'success');
          return;
        }

        // If current state wasn't found in idb, check newest snapshot
        if (snapshots.length > 0 && snapshots[0].data) {
          const snapshotHasMock = snapshots[0].data.users?.some((u: any) => 
            u.phone === '00000000000' || (u.name && u.name.startsWith('Demo User'))
          );
          if (!snapshotHasMock && snapshots[0].data.users?.length > 0) {
            console.log('[StorageService] Recovered data from latest snapshot:', snapshots[0].date);
            this.loadCompleteData(snapshots[0].data);
            this.utilityService.showNotification(`Data restored from automatic snapshot (${snapshots[0].date})!`, 'success');
          }
        }
      } else {
        // We have active data, sync it to IndexedDB right away
        await this.indexedDbService.saveAppData(current);
      }
    } catch (err) {
      console.warn('Storage protection initialization warning:', err);
    }
  }

  private loadData(): AppData {
    try {
      if (typeof localStorage === 'undefined') {
        return DEFAULT_DATA;
      }
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        // Ensure settings are complete
        parsedData.settings = { ...DEFAULT_DATA.settings, ...parsedData.settings };
        if (parsedData.users && parsedData.users.some((u: any) => 
          u.phone === '00000000000' || 
          u.name === 'Arthur Pendelton' || 
          (u.name && u.name.startsWith('Demo User')) || 
          (u.name && u.name.startsWith('Demo Subscriber')) || 
          (u.phone && u.phone.includes('12345'))
        )) {
          parsedData.users = [];
          parsedData.billEntries = [];
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsedData));
          }
        }
        return parsedData;
      }
      return DEFAULT_DATA;
    } catch (e) {
      console.error('Error loading data from localStorage', e);
      return DEFAULT_DATA;
    }
  }

  private saveData(data: AppData) {
    try {
      // 1. Primary fast synchronous store: localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      }
      
      // 2. Secondary resilient store: IndexedDB
      this.indexedDbService.saveAppData(data).catch(e => console.warn('IDB save error:', e));

      // 3. Rolling daily snapshot if user has content
      if (data.users.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (this.lastSnapshotDate !== todayStr) {
          this.lastSnapshotDate = todayStr;
          this.indexedDbService.saveDailySnapshot(todayStr, data).then(() => {
            this.indexedDbService.getSnapshots().then(snaps => this.availableSnapshots.set(snaps));
          });
        }
      }
    } catch (e) {
      console.error('Error saving data to storage', e);
    }
  }
  
  // App Data management
  loadCompleteData(data: Partial<AppData>) {
    // Ensure that even if the backup data is partial/old, we have a valid structure.
    const completeData: AppData = {
      users: data.users || [],
      billEntries: data.billEntries || [],
      // Merge settings: start with default, layer current, then layer restored data.
      settings: { ...DEFAULT_DATA.settings, ...this.settings(), ...(data.settings || {}) }
    };
    this._appData.set(completeData);
    this.saveData(completeData);
  }

  getCompleteData(): AppData {
    return this._appData();
  }
  
  updateSettings(settingsUpdate: Partial<AppSettings>) {
    this._appData.update(data => {
      const updated = {
        ...data,
        settings: { ...data.settings, ...settingsUpdate }
      };
      this.saveData(updated);
      return updated;
    });
  }

  async restoreSnapshot(snapshotDate: string): Promise<boolean> {
    const snaps = this.availableSnapshots();
    const target = snaps.find(s => s.date === snapshotDate);
    if (target && target.data) {
      this.loadCompleteData(target.data);
      this.utilityService.showNotification(`Snapshot restored successfully from ${snapshotDate}!`, 'success');
      return true;
    }
    this.utilityService.showNotification('Snapshot not found.', 'error');
    return false;
  }

  exportJsonFile() {
    try {
      const data = this.getCompleteData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `NetPay_Pro_Backup_${today}.json`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      this.utilityService.showNotification('Backup downloaded to your device Downloads folder!', 'success');
    } catch (error) {
      console.error('Export failed', error);
      this.utilityService.showNotification('Failed to export backup file.', 'error');
    }
  }

  // User management
  addUser(user: Omit<User, 'id' | 'createdAt' | 'isActive' | 'dropoutDate'>) {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isActive: true,
      dropoutDate: null
    };
    this._appData.update(data => ({ ...data, users: [...data.users, newUser] }));

    // Automatically create a bill entry for the current month for the new user
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() is 0-indexed

    this.addBillEntry({
      userId: newUser.id,
      year: currentYear,
      month: currentMonth,
      billAmount: newUser.monthlyBill,
      paidAmount: 0,
      status: 'Not Paid',
      paymentDate: null,
    });
  }

  updateUser(updatedUser: User) {
    this._appData.update(data => ({
      ...data,
      users: data.users.map(u => u.id === updatedUser.id ? updatedUser : u),
    }));
  }
  
  // Bill Entry Management
  addBillEntry(entry: Omit<BillEntry, 'id'>) {
    const newEntry: BillEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
     this._appData.update(data => ({ ...data, billEntries: [...data.billEntries, newEntry] }));
  }

  updateBillEntry(updatedEntry: BillEntry) {
    this._appData.update(data => ({
      ...data,
      billEntries: data.billEntries.map(b => b.id === updatedEntry.id ? updatedEntry : b),
    }));
  }

  generateMonthlyBills(year: number, month: number) {
    const activeUsers = this.users().filter(u => u.isActive);
    const existingEntries = this.billEntries().filter(b => b.year === year && b.month === month);

    activeUsers.forEach(user => {
      const userHasBill = existingEntries.some(e => e.userId === user.id);
      if (!userHasBill) {
        this.addBillEntry({
          userId: user.id,
          year,
          month,
          billAmount: user.monthlyBill,
          paidAmount: 0,
          status: 'Not Paid',
          paymentDate: null
        });
      }
    });
  }

  resetToDemoData() {
    const demoData: AppData = {
      users: [...MOCK_USERS],
      billEntries: generateMockBillEntries(MOCK_USERS),
      settings: {
        ...this.settings(),
        licenseInfo: {
          key: 'OPEN-SOURCE-COMMUNITY-EDITION',
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString()
        }
      }
    };
    this.loadCompleteData(demoData);
    this.utilityService.showNotification('Loaded 50 realistic sample subscribers and billing history!', 'success');
  }

  clearAllData() {
    const emptyData: AppData = {
      users: [],
      billEntries: [],
      settings: this.settings()
    };
    this.loadCompleteData(emptyData);
    this.utilityService.showNotification('All subscriber and billing data has been cleared.', 'info');
  }
}