import { Injectable } from '@angular/core';
import { AppData } from '../models/app-data.model';

export interface StorageSnapshot {
  date: string;
  timestamp: string;
  userCount: number;
  billCount: number;
  data: AppData;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private readonly DB_NAME = 'NetPayPro_Database';
  private readonly DB_VERSION = 1;
  private readonly STORE_APP_DATA = 'app_data';
  private readonly STORE_SNAPSHOTS = 'snapshots';

  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_APP_DATA)) {
          db.createObjectStore(this.STORE_APP_DATA);
        }
        if (!db.objectStoreNames.contains(this.STORE_SNAPSHOTS)) {
          db.createObjectStore(this.STORE_SNAPSHOTS, { keyPath: 'date' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB open failed:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Requests persistent storage permission from Chrome / Browser.
   * Installed PWAs or frequently visited sites are granted this automatically.
   */
  async requestPersistentStorage(): Promise<{ granted: boolean; persisted: boolean }> {
    if (typeof navigator === 'undefined' || !navigator.storage) {
      return { granted: false, persisted: false };
    }

    try {
      let isPersisted = false;
      if (navigator.storage.persisted) {
        isPersisted = await navigator.storage.persisted();
      }

      let granted = isPersisted;
      if (!isPersisted && navigator.storage.persist) {
        granted = await navigator.storage.persist();
      }

      return { granted, persisted: isPersisted || granted };
    } catch (e) {
      console.warn('Storage persistence request error:', e);
      return { granted: false, persisted: false };
    }
  }

  /**
   * Save complete AppData to IndexedDB
   */
  async saveAppData(data: AppData): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_APP_DATA, 'readwrite');
        const store = tx.objectStore(this.STORE_APP_DATA);
        const req = store.put(data, 'current_state');

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB save error:', e);
    }
  }

  /**
   * Load complete AppData from IndexedDB
   */
  async loadAppData(): Promise<AppData | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_APP_DATA, 'readonly');
        const store = tx.objectStore(this.STORE_APP_DATA);
        const req = store.get('current_state');

        req.onsuccess = () => {
          resolve((req.result as AppData) || null);
        };
        req.onerror = () => {
          resolve(null);
        };
      });
    } catch (e) {
      console.warn('IndexedDB load error:', e);
      return null;
    }
  }

  /**
   * Save a daily rolling snapshot into IndexedDB
   */
  async saveDailySnapshot(date: string, data: AppData): Promise<void> {
    // Only save snapshot if there is meaningful data
    if (!data.users || data.users.length === 0) {
      return;
    }

    try {
      const db = await this.getDB();
      const snapshot: StorageSnapshot = {
        date,
        timestamp: new Date().toISOString(),
        userCount: data.users.length,
        billCount: data.billEntries.length,
        data: JSON.parse(JSON.stringify(data))
      };

      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_SNAPSHOTS, 'readwrite');
        const store = tx.objectStore(this.STORE_SNAPSHOTS);
        const req = store.put(snapshot);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('IndexedDB snapshot save error:', e);
    }
  }

  /**
   * Retrieve all saved snapshots ordered newest first
   */
  async getSnapshots(): Promise<StorageSnapshot[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_SNAPSHOTS, 'readonly');
        const store = tx.objectStore(this.STORE_SNAPSHOTS);
        const req = store.getAll();

        req.onsuccess = () => {
          const results = (req.result as StorageSnapshot[]) || [];
          // Sort descending by timestamp
          results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(results);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.warn('IndexedDB getSnapshots error:', e);
      return [];
    }
  }
}
