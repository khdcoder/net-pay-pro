import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SyncService } from '../../services/sync.service';
import { UtilityService } from '../../services/utility.service';
import { StorageService } from '../../services/storage.service';
import { LicenseService } from '../../services/license.service';
import { NotificationComponent } from '../shared/notification.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NotificationComponent, FormsModule]
})
export class SettingsComponent {
  syncService = inject(SyncService);
  utilityService = inject(UtilityService);
  storageService = inject(StorageService);
  licenseService = inject(LicenseService);

  settings = this.storageService.settings;
  isModalOpen = signal(false);
  isChromeGuideOpen = signal(false);
  actionType = signal<'backup' | 'restore' | null>(null);
  emailInput = signal('');
  isEditingEmail = signal(false);
  isEditingScriptUrl = signal(false);

  saveEmail(email: string) {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      this.storageService.updateSettings({ userEmail: null });
      this.isEditingEmail.set(false);
      this.utilityService.showNotification('Email removed. No default email is set.', 'info');
      return;
    }
    if (!/.+@.+\..+/.test(trimmed)) {
      this.utilityService.showNotification('Please provide a valid email address.', 'error');
      return;
    }
    this.storageService.updateSettings({ userEmail: trimmed });
    this.isEditingEmail.set(false);
    this.utilityService.showNotification('Backup email saved successfully!', 'success');
    if (this.settings().autoSyncEnabled) {
      this.syncService.backupData(trimmed, true);
    }
  }

  saveScriptUrl(url: string) {
    if (!url || !url.startsWith('http')) {
      this.utilityService.showNotification('Please provide a valid URL starting with http:// or https://', 'error');
      return;
    }
    this.storageService.updateSettings({ appsScriptUrl: url.trim() });
    this.isEditingScriptUrl.set(false);
    this.utilityService.showNotification('Google Apps Script URL updated successfully!', 'success');
  }

  async requestPersistentStorage() {
    const res = await this.storageService['indexedDbService'].requestPersistentStorage();
    this.storageService.isStoragePersisted.set(res.persisted);
    if (res.persisted) {
      this.utilityService.showNotification('Persistent Storage Protection is ACTIVE! Chrome will protect your app data.', 'success');
    } else {
      this.utilityService.showNotification('Chrome has not granted persistent storage yet. Install the app via Chrome menu for permanent disk persistence.', 'info');
    }
  }

  async restoreSnapshot(date: string) {
    if (confirm(`Do you want to restore all data from the ${date} snapshot? Current local data will be replaced.`)) {
      await this.storageService.restoreSnapshot(date);
    }
  }

  openChromeGuide() {
    this.isChromeGuideOpen.set(true);
  }

  closeChromeGuide() {
    this.isChromeGuideOpen.set(false);
  }

  private openModal(action: 'backup' | 'restore') {
    this.actionType.set(action);
    this.emailInput.set(this.settings().userEmail || '');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.actionType.set(null);
  }

  backup() {
    this.openModal('backup');
  }

  restore() {
    this.openModal('restore');
  }

  toggleAutoSync(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.storageService.updateSettings({ autoSyncEnabled: isChecked });
    if(isChecked && !this.settings().userEmail) {
        this.utilityService.showNotification('Please perform a manual backup once to set your email before auto-sync can start.', 'info');
    }
  }

  confirmAction() {
    const email = this.emailInput();
    if (!email) {
      this.utilityService.showNotification('Email address is required.', 'error');
      return;
    }
    // Simple validation
    if (!/.+@.+\..+/.test(email)) {
      this.utilityService.showNotification('Invalid email format provided.', 'error');
      return;
    }

    // Save email to settings for future use
    this.storageService.updateSettings({ userEmail: email });

    const currentAction = this.actionType();
    if (currentAction === 'backup') {
      this.syncService.backupData(email);
    } else if (currentAction === 'restore') {
      this.syncService.restoreData(email);
    }
    
    this.closeModal();
  }

  exportLocalData() {
    try {
      const data = this.storageService.getCompleteData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `netpay-pro-backup-${timestamp}.json`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      this.utilityService.showNotification('Data exported successfully to local file.', 'success');
    } catch (error) {
      console.error('Export failed', error);
      this.utilityService.showNotification('Failed to export data.', 'error');
    }
  }

  triggerImport() {
    const fileInput = document.getElementById('local-import-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  importLocalData(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation of the imported data structure
        if (data && (data.users || data.billEntries)) {
          if (confirm('This will overwrite your current local data. Are you sure you want to proceed?')) {
            this.storageService.loadCompleteData(data);
            this.utilityService.showNotification('Data restored successfully from local file.', 'success');
            // Reset the input so the same file can be selected again if needed
            input.value = '';
          }
        } else {
          this.utilityService.showNotification('Invalid backup file format.', 'error');
        }
      } catch (error) {
        console.error('Import failed', error);
        this.utilityService.showNotification('Failed to parse backup file.', 'error');
      }
    };

    reader.onerror = () => {
      this.utilityService.showNotification('Failed to read the file.', 'error');
    };

    reader.readAsText(file);
  }

  loadDemoData() {
    if (confirm('Load 50 realistic sample subscribers (Internet & Cable TV) and billing records? This will replace current data.')) {
      this.storageService.resetToDemoData();
    }
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all subscribers and billing records? This cannot be undone unless you have a backup.')) {
      this.storageService.clearAllData();
    }
  }
}
