// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for storage keys
const STORAGE_KEYS = {
  CHAT_MESSAGES: 'chat_messages',
  DOCUMENTS: 'documents',
  LAWYER_SEARCHES: 'lawyer_searches',
  USER_PREFERENCES: 'user_preferences',
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync'
};

class OfflineStorageService {
  // Store chat messages locally
  async storeChatMessages(conversationId: string, messages: any[]) {
    try {
      const key = `${STORAGE_KEYS.CHAT_MESSAGES}_${conversationId}`;
      const data = {
        messages,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error storing chat messages:', error);
      return false;
    }
  }

  // Retrieve chat messages locally
  async getChatMessages(conversationId: string) {
    try {
      const key = `${STORAGE_KEYS.CHAT_MESSAGES}_${conversationId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.messages;
      }
      return [];
    } catch (error) {
      console.error('Error retrieving chat messages:', error);
      return [];
    }
  }

  // Store documents locally
  async storeDocument(documentId: string, document: any) {
    try {
      const key = `${STORAGE_KEYS.DOCUMENTS}_${documentId}`;
      const data = {
        document,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error storing document:', error);
      return false;
    }
  }

  // Retrieve document locally
  async getDocument(documentId: string) {
    try {
      const key = `${STORAGE_KEYS.DOCUMENTS}_${documentId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.document;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving document:', error);
      return null;
    }
  }

  // Store lawyer search results locally
  async storeLawyerSearch(query: string, results: any[]) {
    try {
      const key = `${STORAGE_KEYS.LAWYER_SEARCHES}_${query}`;
      const data = {
        results,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error storing lawyer search:', error);
      return false;
    }
  }

  // Retrieve lawyer search results locally
  async getLawyerSearch(query: string) {
    try {
      const key = `${STORAGE_KEYS.LAWYER_SEARCHES}_${query}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Check if data is still valid (less than 1 hour old)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const storedTime = new Date(parsed.timestamp);
        if (storedTime > oneHourAgo) {
          return parsed.results;
        }
      }
      return null;
    } catch (error) {
      console.error('Error retrieving lawyer search:', error);
      return null;
    }
  }

  // Store user preferences locally
  async storeUserPreferences(preferences: any) {
    try {
      const data = {
        preferences,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error storing user preferences:', error);
      return false;
    }
  }

  // Retrieve user preferences locally
  async getUserPreferences() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.preferences;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user preferences:', error);
      return null;
    }
  }

  // Add request to offline queue
  async addToOfflineQueue(request: any) {
    try {
      const queue = await this.getOfflineQueue();
      queue.push({
        ...request,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('Error adding to offline queue:', error);
      return false;
    }
  }

  // Get offline queue
  async getOfflineQueue() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving offline queue:', error);
      return [];
    }
  }

  // Remove item from offline queue
  async removeFromOfflineQueue(itemId: string) {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter((item: any) => item.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filteredQueue));
      return true;
    } catch (error) {
      console.error('Error removing from offline queue:', error);
      return false;
    }
  }

  // Clear offline queue
  async clearOfflineQueue() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return true;
    } catch (error) {
      console.error('Error clearing offline queue:', error);
      return false;
    }
  }

  // Store last sync timestamp
  async storeLastSyncTimestamp() {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
      return true;
    } catch (error) {
      console.error('Error storing last sync timestamp:', error);
      return false;
    }
  }

  // Get last sync timestamp
  async getLastSyncTimestamp() {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Error retrieving last sync timestamp:', error);
      return null;
    }
  }

  // Clear all offline data
  async clearAllOfflineData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  }

  // Get storage usage statistics
  async getStorageStats(): Promise<{ totalSize: number; keySizes: { key: string; size: number }[]; keyCount: number } | null> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keyValuePairs = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      const keySizes: { key: string; size: number }[] = [];
      
      keyValuePairs.forEach((pair) => {
        const [key, value] = pair;
        if (value) {
          // Calculate size using a cross-platform approach
          // More accurate estimation of UTF-8 byte size
          const size = unescape(encodeURIComponent(value)).length;
          totalSize += size;
          keySizes.push({ key, size });
        }
      });
      
      return {
        totalSize,
        keySizes,
        keyCount: keys.length
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
}

export default new OfflineStorageService();