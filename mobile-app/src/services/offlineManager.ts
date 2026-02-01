// @ts-ignore
import NetInfo from '@react-native-community/netinfo';
// @ts-ignore
import { AppState } from 'react-native';
import offlineStorage from './offlineStorage';
import apiClient, { chatAPI, documentAPI } from './api';

class OfflineManager {
  private isOnline: boolean = true;
  private appState: string = AppState.currentState;
  private connectionChangeCallback: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  // Initialize the offline manager
  async initialize() {
    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener((state: any) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came back online, process the offline queue
      if (wasOnline === false && this.isOnline === true) {
        this.processOfflineQueue();
      }

      // Notify callback if set
      if (this.connectionChangeCallback) {
        this.connectionChangeCallback();
      }
    });

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        this.appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, check network status
        this.checkNetworkStatus();
      }
      this.appState = nextAppState;
    });

    // Initial network status check
    this.checkNetworkStatus();

    // Return unsubscribe function for cleanup
    return () => {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      if (subscription) {
        subscription.remove();
      }
    };
  }

  // Check current network status
  async checkNetworkStatus() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  // Process the offline queue when coming back online
  async processOfflineQueue() {
    try {
      const queue = await offlineStorage.getOfflineQueue();

      if (queue.length === 0) {
        return;
      }

      console.log(`Processing ${queue.length} items from offline queue`);

      // Process each item in the queue
      for (const item of queue) {
        try {
          switch (item.type) {
            case 'chat_message':
              await this.processChatMessage(item);
              break;
            case 'document_upload':
              await this.processDocumentUpload(item);
              break;
            case 'feedback':
              await this.processFeedback(item);
              break;
            case 'lawyer_booking':
              await this.processLawyerBooking(item);
              break;
            default:
              console.warn('Unknown offline queue item type:', item.type);
          }

          // Remove successfully processed item from queue
          await offlineStorage.removeFromOfflineQueue(item.id);
        } catch (error) {
          console.error('Error processing offline queue item:', error);
          // Keep item in queue for retry
        }
      }

      // Update last sync timestamp
      await offlineStorage.storeLastSyncTimestamp();

      console.log('Finished processing offline queue');
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  }

  // Process chat message from offline queue
  async processChatMessage(item: any) {
    try {
      // Re-send the chat message
      const response = await chatAPI.sendMessage(item.conversationId, item.message);
      console.log('Successfully re-sent chat message:', response);
      return response;
    } catch (error) {
      console.error('Error re-sending chat message:', error);
      throw error;
    }
  }

  // Process document upload from offline queue
  async processDocumentUpload(item: any) {
    try {
      // Re-upload the document
      // Note: This assumes the file is still available, which may not always be the case
      // In a real implementation, you might need to store the file locally as well
      const response = await documentAPI.upload(item.file, item.documentType);
      console.log('Successfully re-uploaded document:', response);
      return response;
    } catch (error) {
      console.error('Error re-uploading document:', error);
      throw error;
    }
  }

  // Process feedback from offline queue
  async processFeedback(item: any) {
    try {
      // We import feedbackAPI here to avoid circular dependencies if possible, 
      // but if api.ts imports offlineManager, we might have a cycle.
      // Ideally, api.ts is the central point.
      // Let's use the underlying apiClient or the feedbackAPI if available.
      // To strictly follow the pattern, we should call the API endpoint directly here 
      // or refactor to avoid cyclic deps.
      const response = await apiClient.post('/feedback', item.data);
      console.log('Successfully re-sent feedback:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error re-sending feedback:', error);
      throw error;
    }
  }

  // Process lawyer booking from offline queue
  async processLawyerBooking(item: any) {
    try {
      // Re-book the lawyer consultation
      const response = await apiClient.post(`/lawyers/${item.lawyerId}/book`, {
        timeSlot: item.timeSlot
      });
      console.log('Successfully re-booked lawyer consultation:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error re-booking lawyer consultation:', error);
      throw error;
    }
  }

  // Add a chat message to offline queue
  async queueChatMessage(conversationId: string, message: string) {
    const item = {
      type: 'chat_message',
      conversationId,
      message
    };
    return await offlineStorage.addToOfflineQueue(item);
  }

  // Add feedback to offline queue
  async queueFeedback(data: { category: string; message: string; userId?: string }) {
    const item = {
      type: 'feedback',
      data
    };
    return await offlineStorage.addToOfflineQueue(item);
  }

  // Add a document upload to offline queue
  async queueDocumentUpload(file: any, documentType: string) {
    const item = {
      type: 'document_upload',
      file,
      documentType
    };
    return await offlineStorage.addToOfflineQueue(item);
  }

  // Add a lawyer booking to offline queue
  async queueLawyerBooking(lawyerId: string, timeSlot: string) {
    const item = {
      type: 'lawyer_booking',
      lawyerId,
      timeSlot
    };
    return await offlineStorage.addToOfflineQueue(item);
  }

  // Get current online status
  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Set callback for connection changes
  setConnectionChangeCallback(callback: () => void) {
    this.connectionChangeCallback = callback;
  }

  // Clear all offline data
  async clearOfflineData() {
    await offlineStorage.clearAllOfflineData();
  }

  // Cleanup function to unsubscribe from listeners
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export default new OfflineManager();