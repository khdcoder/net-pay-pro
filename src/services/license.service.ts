import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { UtilityService } from './utility.service';

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  private storageService = inject(StorageService);
  private utilityService = inject(UtilityService);

  private readonly CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTri6C8R0VDia7aQ1rFqCgquWlHOwvOXRm_z9FigRpofHkaDiC6D9Y518j0HEX8WcclJG6vZo7237Sh/pub?output=csv';

  licenseInfo = this.storageService.settings().licenseInfo;
  
  // Open Source Community Edition - Always fully activated without requiring a serial key
  isActivated = computed(() => true);

  isExpired = computed(() => false);

  getRemainingTime() {
    return 'Lifetime (Open Source)';
  }

  async activate(key: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.CSV_URL);
      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => row.split(','));
      
      // Find the key in the CSV
      // Assuming CSV format: key,status
      const keyIndex = rows.findIndex(row => row[0]?.trim() === key.trim());
      
      if (keyIndex === -1) {
        return { success: false, message: 'Invalid Serial Key. Please check and try again.' };
      }

      const status = rows[keyIndex][1]?.trim().toLowerCase();
      
      if (status === 'used') {
        return { success: false, message: 'This Serial Key has already been used.' };
      }

      if (status === 'unused') {
        // In a real app, we would update the status in the Google Sheet via an API.
        // Since we only have a public CSV link, we can't update it directly here.
        // However, for this requirement, we'll proceed with activation.
        
        const activatedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 2); // 2 months duration

        this.storageService.updateSettings({
          licenseInfo: {
            key: key.trim(),
            activatedAt: activatedAt.toISOString(),
            expiresAt: expiresAt.toISOString()
          }
        });

        return { success: true, message: 'App activated successfully for 2 months!' };
      }

      return { success: false, message: 'Invalid key status.' };
    } catch (error) {
      console.error('Activation error:', error);
      return { success: false, message: 'Could not connect to activation server. Please check your internet.' };
    }
  }
}
