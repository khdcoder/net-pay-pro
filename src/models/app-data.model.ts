import { User } from './user.model';
import { BillEntry } from './bill-entry.model';

export interface LicenseInfo {
  key: string;
  activatedAt: string;
  expiresAt: string;
}

export interface AppSettings {
  appsScriptUrl: string;
  userEmail: string | null;
  autoSyncEnabled: boolean;
  lastSyncTimestamp: string | null;
  lastDailyBackupDate?: string | null;
  licenseInfo: LicenseInfo | null;
}

export interface AppData {
  users: User[];
  billEntries: BillEntry[];
  settings: AppSettings;
}