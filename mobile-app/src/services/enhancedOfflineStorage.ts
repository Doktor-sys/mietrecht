// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { AppState } from 'react-native';

// Constants
const OFFLINE_QUEUE_KEY = 'offline_queue';
const LAST_SYNC_TIMESTAMP_KEY = 'last_sync_timestamp';
const OFFLINE_DATA_KEY = 'offline_data';
const MAX_QUEUE_SIZE = 100; // Maximum number of items in the offline queue

class EnhancedOfflineStorage {
  private isSyncing: boolean = false;
  private syncCallbacks: Array<() => void> = [];

  /**
   * Add an item to the offline queue
   * @param item - The item to add to the queue
   * @returns Promise resolving to the updated queue length
   */
  async addToOfflineQueue(item: any): Promise<number> {
    try {
      // Validate item
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid item: must be an object');
      }

      // Add timestamp and unique ID if not present
      const itemWithMetadata = {
        ...item,
        id: item.id || this.generateUniqueId(),
        timestamp: item.timestamp || Date.now(),
      };

      // Get current queue
      const queue = await this.getOfflineQueue();
      
      // Check queue size
      if (queue.length >= MAX_QUEUE_SIZE) {
        // Remove oldest item if queue is full
        queue.shift();
      }

      // Add new item
      queue.push(itemWithMetadata);

      // Save updated queue
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

      // @ts-ignore
      console.log('Added item to offline queue:', itemWithMetadata);
      
      return queue.length;
    } catch (error) {
      // @ts-ignore
      console.error('Error adding to offline queue:', error);
      throw error;
    }
  }

  /**
   * Get the offline queue
   * @returns Promise resolving to the offline queue array
   */
  async getOfflineQueue(): Promise<Array<any>> {
    try {
      const queueString = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueString ? JSON.parse(queueString) : [];
    } catch (error) {
      // @ts-ignore
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  /**
   * Remove an item from the offline queue
   * @param itemId - The ID of the item to remove
   * @returns Promise resolving to the updated queue
   */
  async removeFromOfflineQueue(itemId: string): Promise<Array<any>> {
    try {
      const queue = await this.getOfflineQueue();
      const updatedQueue = queue.filter((item: any) => item.id !== itemId);
      
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      
      // @ts-ignore
      console.log('Removed item from offline queue:', itemId);
      
      return updatedQueue;
    } catch (error) {
      // @ts-ignore
      console.error('Error removing from offline queue:', error);
      throw error;
    }
  }

  /**
   * Clear the entire offline queue
   * @returns Promise resolving when the queue is cleared
   */
  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      // @ts-ignore
      console.log('Cleared offline queue');
    } catch (error) {
      // @ts-ignore
      console.error('Error clearing offline queue:', error);
      throw error;
    }
  }

  /**
   * Store last sync timestamp
   * @param timestamp - The timestamp to store (defaults to current time)
   * @returns Promise resolving when the timestamp is stored
   */
  async storeLastSyncTimestamp(timestamp?: number): Promise<void> {
    try {
      const timestampToStore = timestamp || Date.now();
      await AsyncStorage.setItem(LAST_SYNC_TIMESTAMP_KEY, timestampToStore.toString());
      // @ts-ignore
      console.log('Stored last sync timestamp:', timestampToStore);
    } catch (error) {
      // @ts-ignore
      console.error('Error storing last sync timestamp:', error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp
   * @returns Promise resolving to the last sync timestamp or null
   */
  async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const timestampString = await AsyncStorage.getItem(LAST_SYNC_TIMESTAMP_KEY);
      return timestampString ? parseInt(timestampString, 10) : null;
    } catch (error) {
      // @ts-ignore
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Store offline data
   * @param key - The key to store the data under
   * @param data - The data to store
   * @returns Promise resolving when the data is stored
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string');
      }

      // Get current offline data
      const offlineData = await this.getAllOfflineData();
      
      // Update with new data
      offlineData[key] = {
        data,
        timestamp: Date.now(),
      };

      // Save updated offline data
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      
      // @ts-ignore
      console.log('Stored offline data for key:', key);
    } catch (error) {
      // @ts-ignore
      console.error('Error storing offline data:', error);
      throw error;
    }
  }

  /**
   * Get offline data by key
   * @param key - The key of the data to retrieve
   * @returns Promise resolving to the data or null
   */
  async getOfflineData(key: string): Promise<any | null> {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string');
      }

      const offlineData = await this.getAllOfflineData();
      return offlineData[key] ? offlineData[key].data : null;
    } catch (error) {
      // @ts-ignore
      console.error('Error getting offline data for key:', key, error);
      return null;
    }
  }

  /**
   * Get all offline data
   * @returns Promise resolving to all offline data
   */
  async getAllOfflineData(): Promise<any> {
    try {
      const dataString = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
      return dataString ? JSON.parse(dataString) : {};
    } catch (error) {
      // @ts-ignore
      console.error('Error getting all offline data:', error);
      return {};
    }
  }

  /**
   * Remove offline data by key
   * @param key - The key of the data to remove
   * @returns Promise resolving when the data is removed
   */
  async removeOfflineData(key: string): Promise<void> {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string');
      }

      const offlineData = await this.getAllOfflineData();
      
      if (offlineData[key]) {
        delete offlineData[key];
        await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
        // @ts-ignore
        console.log('Removed offline data for key:', key);
      }
    } catch (error) {
      // @ts-ignore
      console.error('Error removing offline data for key:', key, error);
      throw error;
    }
  }

  /**
   * Clear all offline data
   * @returns Promise resolving when all offline data is cleared
   */
  async clearAllOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      await AsyncStorage.removeItem(LAST_SYNC_TIMESTAMP_KEY);
      // @ts-ignore
      console.log('Cleared all offline data');
    } catch (error) {
      // @ts-ignore
      console.error('Error clearing all offline data:', error);
      throw error;
    }
  }

  /**
   * Sync offline data with server
   * @param syncFunction - Function to handle the synchronization
   * @returns Promise resolving when sync is complete
   */
  async syncWithServer(syncFunction: (queue: Array<any>) => Promise<void>): Promise<void> {
    // Prevent concurrent sync operations
    if (this.isSyncing) {
      // @ts-ignore
      console.log('Sync already in progress, waiting...');
      return new Promise((resolve) => {
        this.syncCallbacks.push(resolve);
      });
    }

    this.isSyncing = true;
    
    try {
      // @ts-ignore
      console.log('Starting offline data sync...');
      
      // Get offline queue
      const queue = await this.getOfflineQueue();
      
      if (queue.length === 0) {
        // @ts-ignore
        console.log('No items in offline queue to sync');
        return;
      }

      // Call sync function with queue
      await syncFunction(queue);
      
      // Update last sync timestamp
      await this.storeLastSyncTimestamp();
      
      // @ts-ignore
      console.log('Offline data sync completed successfully');
    } catch (error) {
      // @ts-ignore
      console.error('Error during offline data sync:', error);
      throw error;
    } finally {
      this.isSyncing = false;
      
      // Resolve any pending callbacks
      while (this.syncCallbacks.length > 0) {
        const callback = this.syncCallbacks.pop();
        if (callback) {
          callback();
        }
      }
    }
  }

  /**
   * Get offline data statistics
   * @returns Promise resolving to statistics about offline data
   */
  async getOfflineStatistics(): Promise<any> {
    try {
      const queue = await this.getOfflineQueue();
      const offlineData = await this.getAllOfflineData();
      const lastSync = await this.getLastSyncTimestamp();
      
      return {
        queueSize: queue.length,
        dataSize: Object.keys(offlineData).length,
        lastSyncTimestamp: lastSync,
        estimatedStorageSize: JSON.stringify({ ...offlineData, ...queue }).length,
      };
    } catch (error) {
      // @ts-ignore
      console.error('Error getting offline statistics:', error);
      return {
        queueSize: 0,
        dataSize: 0,
        lastSyncTimestamp: null,
        estimatedStorageSize: 0,
      };
    }
  }

  /**
   * Generate a unique ID
   * @returns A unique ID string
   */
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Clean up old offline data
   * @param maxAgeHours - Maximum age of data in hours (default: 168 hours = 1 week)
   * @returns Promise resolving when cleanup is complete
   */
  async cleanupOldData(maxAgeHours: number = 168): Promise<void> {
    try {
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      // Clean up offline data
      const offlineData = await this.getAllOfflineData();
      let updated = false;
      
      for (const [key, value] of Object.entries(offlineData)) {
        // @ts-ignore
        if (value.timestamp < cutoffTime) {
          delete offlineData[key];
          updated = true;
          // @ts-ignore
          console.log('Removed old offline data for key:', key);
        }
      }
      
      if (updated) {
        await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      }
      
      // Clean up offline queue
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter((item: any) => item.timestamp >= cutoffTime);
      
      if (queue.length !== filteredQueue.length) {
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
        // @ts-ignore
        console.log('Cleaned up old items from offline queue');
      }
    } catch (error) {
      // @ts-ignore
      console.error('Error cleaning up old offline data:', error);
      throw error;
    }
  }
}

export default new EnhancedOfflineStorage();