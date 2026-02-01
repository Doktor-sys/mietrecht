/**
 * Mobile Offline Storage Service
 * 
 * This service provides enhanced offline storage capabilities specifically for mobile applications.
 * It extends the web offline storage with mobile-specific optimizations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { 
  OfflineLawFirmCase, 
  OfflineAccountingEntry, 
  OfflineCalendarEvent, 
  OfflineDocument 
} from './offlineStorage';

// Database configuration
const STORE_KEYS = {
  CASES: '@SmartLaw:lawFirmCases',
  ACCOUNTING: '@SmartLaw:accountingEntries',
  EVENTS: '@SmartLaw:calendarEvents',
  DOCUMENTS: '@SmartLaw:documents',
  SETTINGS: '@SmartLaw:settings'
};

// File storage paths
const DOCUMENT_STORAGE_PATH = `${RNFS.DocumentDirectoryPath}/offline_documents`;

class MobileOfflineStorageService {
  private isInitialized = false;

  /**
   * Initialize the mobile offline storage
   */
  async initialize(): Promise<void> {
    try {
      // Create document storage directory if it doesn't exist
      const exists = await RNFS.exists(DOCUMENT_STORAGE_PATH);
      if (!exists) {
        await RNFS.mkdir(DOCUMENT_STORAGE_PATH);
      }

      this.isInitialized = true;
      console.log('Mobile offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize mobile offline storage:', error);
      throw error;
    }
  }

  /**
   * Save a law firm case to offline storage
   */
  async saveLawFirmCase(id: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const cases = await this.getLawFirmCases();
      cases[id] = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      await AsyncStorage.setItem(STORE_KEYS.CASES, JSON.stringify(cases));
      console.log(`Law firm case ${id} saved to mobile offline storage`);
    } catch (error) {
      console.error(`Failed to save law firm case ${id} to mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Get a law firm case from offline storage
   */
  async getLawFirmCase(id: string): Promise<OfflineLawFirmCase | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const cases = await this.getLawFirmCases();
      return cases[id] || null;
    } catch (error) {
      console.error(`Failed to get law firm case ${id} from mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Get all law firm cases from offline storage
   */
  async getLawFirmCases(): Promise<{[key: string]: OfflineLawFirmCase}> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const casesStr = await AsyncStorage.getItem(STORE_KEYS.CASES);
      return casesStr ? JSON.parse(casesStr) : {};
    } catch (error) {
      console.error('Failed to get law firm cases from mobile offline storage:', error);
      return {};
    }
  }

  /**
   * Save an accounting entry to offline storage
   */
  async saveAccountingEntry(id: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const entries = await this.getAccountingEntries();
      entries[id] = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      await AsyncStorage.setItem(STORE_KEYS.ACCOUNTING, JSON.stringify(entries));
      console.log(`Accounting entry ${id} saved to mobile offline storage`);
    } catch (error) {
      console.error(`Failed to save accounting entry ${id} to mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Save a calendar event to offline storage
   */
  async saveCalendarEvent(id: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const events = await this.getCalendarEvents();
      events[id] = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      await AsyncStorage.setItem(STORE_KEYS.EVENTS, JSON.stringify(events));
      console.log(`Calendar event ${id} saved to mobile offline storage`);
    } catch (error) {
      console.error(`Failed to save calendar event ${id} to mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Get all calendar events from offline storage
   */
  async getCalendarEvents(): Promise<{[key: string]: OfflineCalendarEvent}> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const eventsStr = await AsyncStorage.getItem(STORE_KEYS.EVENTS);
      return eventsStr ? JSON.parse(eventsStr) : {};
    } catch (error) {
      console.error('Failed to get calendar events from mobile offline storage:', error);
      return {};
    }
  }

  /**
   * Get all accounting entries from offline storage
   */
  async getAccountingEntries(): Promise<{[key: string]: OfflineAccountingEntry}> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const entriesStr = await AsyncStorage.getItem(STORE_KEYS.ACCOUNTING);
      return entriesStr ? JSON.parse(entriesStr) : {};
    } catch (error) {
      console.error('Failed to get accounting entries from mobile offline storage:', error);
      return {};
    }
  }

  /**
   * Save a document to offline storage
   */
  async saveDocument(id: string, data: any, fileContent?: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Save document metadata
      const documents = await this.getDocuments();
      documents[id] = {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      };

      await AsyncStorage.setItem(STORE_KEYS.DOCUMENTS, JSON.stringify(documents));

      // Save document content to file system if provided
      if (fileContent) {
        const filePath = `${DOCUMENT_STORAGE_PATH}/${id}`;
        await RNFS.writeFile(filePath, fileContent, 'utf8');
      }

      console.log(`Document ${id} saved to mobile offline storage`);
    } catch (error) {
      console.error(`Failed to save document ${id} to mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Get a document from offline storage
   */
  async getDocument(id: string): Promise<{metadata: OfflineDocument | null, content: string | null}> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const documents = await this.getDocuments();
      const metadata = documents[id] || null;

      // Try to read document content from file system
      let content: string | null = null;
      if (metadata) {
        const filePath = `${DOCUMENT_STORAGE_PATH}/${id}`;
        const fileExists = await RNFS.exists(filePath);
        if (fileExists) {
          content = await RNFS.readFile(filePath, 'utf8');
        }
      }

      return { metadata, content };
    } catch (error) {
      console.error(`Failed to get document ${id} from mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Get all documents from offline storage
   */
  async getDocuments(): Promise<{[key: string]: OfflineDocument}> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const documentsStr = await AsyncStorage.getItem(STORE_KEYS.DOCUMENTS);
      return documentsStr ? JSON.parse(documentsStr) : {};
    } catch (error) {
      console.error('Failed to get documents from mobile offline storage:', error);
      return {};
    }
  }

  /**
   * Mark an item as synced
   */
  async markAsSynced(storeKey: string, id: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let items: any = {};
      
      switch (storeKey) {
        case STORE_KEYS.CASES:
          items = await this.getLawFirmCases();
          break;
        case STORE_KEYS.ACCOUNTING:
          items = await this.getAccountingEntries();
          break;
        case STORE_KEYS.EVENTS:
          items = await this.getCalendarEvents();
          break;
        case STORE_KEYS.DOCUMENTS:
          items = await this.getDocuments();
          break;
        default:
          throw new Error(`Unknown store key: ${storeKey}`);
      }

      if (items[id]) {
        items[id].synced = true;
        items[id].timestamp = Date.now();

        await AsyncStorage.setItem(storeKey, JSON.stringify(items));
        console.log(`${storeKey} item ${id} marked as synced`);
      } else {
        throw new Error(`${storeKey} item ${id} not found`);
      }
    } catch (error) {
      console.error(`Failed to mark ${storeKey} item ${id} as synced:`, error);
      throw error;
    }
  }

  /**
   * Get all unsynced items from a store
   */
  async getUnsyncedItems(storeKey: string): Promise<any[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let items: any = {};
      
      switch (storeKey) {
        case STORE_KEYS.CASES:
          items = await this.getLawFirmCases();
          break;
        case STORE_KEYS.ACCOUNTING:
          items = await this.getAccountingEntries();
          break;
        case STORE_KEYS.EVENTS:
          items = await this.getCalendarEvents();
          break;
        case STORE_KEYS.DOCUMENTS:
          items = await this.getDocuments();
          break;
        default:
          throw new Error(`Unknown store key: ${storeKey}`);
      }

      return Object.values(items).filter((item: any) => !item.synced);
    } catch (error) {
      console.error(`Failed to get unsynced items from ${storeKey}:`, error);
      throw error;
    }
  }

  /**
   * Clear all data from a store
   */
  async clearStore(storeKey: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await AsyncStorage.removeItem(storeKey);
      
      // For documents, also clear the file system storage
      if (storeKey === STORE_KEYS.DOCUMENTS) {
        const files = await RNFS.readDir(DOCUMENT_STORAGE_PATH);
        for (const file of files) {
          await RNFS.unlink(file.path);
        }
      }

      console.log(`Store ${storeKey} cleared`);
    } catch (error) {
      console.error(`Failed to clear store ${storeKey}:`, error);
      throw error;
    }
  }

  /**
   * Save a setting to offline storage
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const settings = await this.getSettings();
      settings[key] = value;

      await AsyncStorage.setItem(STORE_KEYS.SETTINGS, JSON.stringify(settings));
      console.log(`Setting ${key} saved to mobile offline storage`);
    } catch (error) {
      console.error(`Failed to save setting ${key} to mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Get a setting from offline storage
   */
  async getSetting(key: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const settings = await this.getSettings();
      return settings[key];
    } catch (error) {
      console.error(`Failed to get setting ${key} from mobile offline storage:`, error);
      throw error;
    }
  }

  /**
   * Get all settings from offline storage
   */
  async getSettings(): Promise<{[key: string]: any}> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const settingsStr = await AsyncStorage.getItem(STORE_KEYS.SETTINGS);
      return settingsStr ? JSON.parse(settingsStr) : {};
    } catch (error) {
      console.error('Failed to get settings from mobile offline storage:', error);
      return {};
    }
  }

  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<{ 
    isInitialized: boolean;
    platform: string;
    documentStoragePath: string;
    availableStores: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      isInitialized: this.isInitialized,
      platform: Platform.OS,
      documentStoragePath: DOCUMENT_STORAGE_PATH,
      availableStores: Object.values(STORE_KEYS)
    };
  }

  /**
   * Clean up old synced data to free space
   */
  async cleanupOldSyncedData(daysOld: number = 30): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      // Clean up old synced cases
      const cases = await this.getLawFirmCases();
      for (const [id, caseData] of Object.entries(cases)) {
        if (caseData.synced && caseData.timestamp < cutoffTime) {
          delete cases[id];
        }
      }
      await AsyncStorage.setItem(STORE_KEYS.CASES, JSON.stringify(cases));

      // Clean up old synced accounting entries
      const entries = await this.getAccountingEntries();
      for (const [id, entryData] of Object.entries(entries)) {
        if (entryData.synced && entryData.timestamp < cutoffTime) {
          delete entries[id];
        }
      }
      await AsyncStorage.setItem(STORE_KEYS.ACCOUNTING, JSON.stringify(entries));

      // Clean up old synced events
      const events = await this.getCalendarEvents();
      for (const [id, eventData] of Object.entries(events)) {
        if (eventData.synced && eventData.timestamp < cutoffTime) {
          delete events[id];
        }
      }
      await AsyncStorage.setItem(STORE_KEYS.EVENTS, JSON.stringify(events));

      // Clean up old synced documents
      const documents = await this.getDocuments();
      for (const [id, docData] of Object.entries(documents)) {
        if (docData.synced && docData.timestamp < cutoffTime) {
          delete documents[id];
          // Also delete the file
          const filePath = `${DOCUMENT_STORAGE_PATH}/${id}`;
          const fileExists = await RNFS.exists(filePath);
          if (fileExists) {
            await RNFS.unlink(filePath);
          }
        }
      }
      await AsyncStorage.setItem(STORE_KEYS.DOCUMENTS, JSON.stringify(documents));

      console.log(`Cleaned up data older than ${daysOld} days`);
    } catch (error) {
      console.error('Failed to clean up old synced data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mobileOfflineStorageService = new MobileOfflineStorageService();