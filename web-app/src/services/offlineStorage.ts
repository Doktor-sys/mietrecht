/**
 * Offline Storage Service
 * 
 * This service provides offline storage capabilities for the web application
 * using IndexedDB for persistent storage and localStorage for temporary caching.
 */

// Define data types for offline storage
export interface OfflineLawFirmCase {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface OfflineAccountingEntry {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface OfflineCalendarEvent {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface OfflineDocument {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

// Database configuration
const DB_NAME = 'SmartLawOfflineDB';
const DB_VERSION = 1;
const STORE_NAMES = {
  CASES: 'lawFirmCases',
  ACCOUNTING: 'accountingEntries',
  EVENTS: 'calendarEvents',
  DOCUMENTS: 'documents',
  SETTINGS: 'settings'
};

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize the offline storage database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized && this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open offline storage database');
        reject(new Error('Failed to open offline storage database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('Offline storage database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(STORE_NAMES.CASES)) {
          const caseStore = db.createObjectStore(STORE_NAMES.CASES, { keyPath: 'id' });
          caseStore.createIndex('timestamp', 'timestamp', { unique: false });
          caseStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.ACCOUNTING)) {
          const accountingStore = db.createObjectStore(STORE_NAMES.ACCOUNTING, { keyPath: 'id' });
          accountingStore.createIndex('timestamp', 'timestamp', { unique: false });
          accountingStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.EVENTS)) {
          const eventStore = db.createObjectStore(STORE_NAMES.EVENTS, { keyPath: 'id' });
          eventStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.DOCUMENTS)) {
          const documentStore = db.createObjectStore(STORE_NAMES.DOCUMENTS, { keyPath: 'id' });
          documentStore.createIndex('timestamp', 'timestamp', { unique: false });
          documentStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
          db.createObjectStore(STORE_NAMES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Save a law firm case to offline storage
   */
  async saveLawFirmCase(id: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAMES.CASES], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.CASES);
      
      const caseData: OfflineLawFirmCase = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      const request = store.put(caseData);

      request.onsuccess = () => {
        console.log(`Law firm case ${id} saved to offline storage`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to save law firm case ${id} to offline storage`);
        reject(new Error(`Failed to save law firm case ${id}`));
      };
    });
  }

  /**
   * Get a law firm case from offline storage
   */
  async getLawFirmCase(id: string): Promise<OfflineLawFirmCase | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAMES.CASES], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.CASES);
      
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error(`Failed to get law firm case ${id} from offline storage`);
        reject(new Error(`Failed to get law firm case ${id}`));
      };
    });
  }

  /**
   * Save an accounting entry to offline storage
   */
  async saveAccountingEntry(id: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAMES.ACCOUNTING], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.ACCOUNTING);
      
      const entryData: OfflineAccountingEntry = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      const request = store.put(entryData);

      request.onsuccess = () => {
        console.log(`Accounting entry ${id} saved to offline storage`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to save accounting entry ${id} to offline storage`);
        reject(new Error(`Failed to save accounting entry ${id}`));
      };
    });
  }

  /**
   * Save a calendar event to offline storage
   */
  async saveCalendarEvent(id: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAMES.EVENTS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.EVENTS);
      
      const eventData: OfflineCalendarEvent = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      const request = store.put(eventData);

      request.onsuccess = () => {
        console.log(`Calendar event ${id} saved to offline storage`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to save calendar event ${id} to offline storage`);
        reject(new Error(`Failed to save calendar event ${id}`));
      };
    });
  }

  /**
   * Save a document to offline storage
   */
  async saveDocument(id: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAMES.DOCUMENTS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.DOCUMENTS);
      
      const documentData: OfflineDocument = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      const request = store.put(documentData);

      request.onsuccess = () => {
        console.log(`Document ${id} saved to offline storage`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to save document ${id} to offline storage`);
        reject(new Error(`Failed to save document ${id}`));
      };
    });
  }

  /**
   * Mark an item as synced
   */
  async markAsSynced(storeName: string, id: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          data.timestamp = Date.now();
          
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => {
            console.log(`${storeName} item ${id} marked as synced`);
            resolve();
          };
          updateRequest.onerror = () => {
            console.error(`Failed to mark ${storeName} item ${id} as synced`);
            reject(new Error(`Failed to mark ${storeName} item ${id} as synced`));
          };
        } else {
          reject(new Error(`${storeName} item ${id} not found`));
        }
      };

      request.onerror = () => {
        console.error(`Failed to get ${storeName} item ${id}`);
        reject(new Error(`Failed to get ${storeName} item ${id}`));
      };
    });
  }

  /**
   * Get all unsynced items from a store
   */
  async getUnsyncedItems(storeName: string): Promise<any[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('synced');
      
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error(`Failed to get unsynced items from ${storeName}`);
        reject(new Error(`Failed to get unsynced items from ${storeName}`));
      };
    });
  }

  /**
   * Clear all data from a store
   */
  async clearStore(storeName: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`Store ${storeName} cleared`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to clear store ${storeName}`);
        reject(new Error(`Failed to clear store ${storeName}`));
      };
    });
  }

  /**
   * Save a setting to offline storage
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAMES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.SETTINGS);
      
      const setting = { key, value };

      const request = store.put(setting);

      request.onsuccess = () => {
        console.log(`Setting ${key} saved to offline storage`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to save setting ${key} to offline storage`);
        reject(new Error(`Failed to save setting ${key}`));
      };
    });
  }

  /**
   * Get a setting from offline storage
   */
  async getSetting(key: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAMES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.SETTINGS);
      
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        console.error(`Failed to get setting ${key} from offline storage`);
        reject(new Error(`Failed to get setting ${key}`));
      };
    });
  }

  /**
   * Check if offline storage is supported
   */
  isSupported(): boolean {
    return 'indexedDB' in window;
  }

  /**
   * Get database info
   */
  async getDatabaseInfo(): Promise<{ 
    name: string; 
    version: number; 
    stores: string[]; 
    isInitialized: boolean 
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      name: DB_NAME,
      version: DB_VERSION,
      stores: Object.values(STORE_NAMES),
      isInitialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();