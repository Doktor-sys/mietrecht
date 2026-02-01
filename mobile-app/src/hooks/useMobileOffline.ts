/**
 * React Hook for Mobile Offline Functionality
 * 
 * This hook provides easy access to mobile offline functionality in React components
 * with proper state management and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
// import NetInfo from '@react-native-community/netinfo';
import { mobileOfflineStorageService } from '../services/mobileOfflineStorage';
import { smartSyncService } from '../services/smartSyncService';
import { offlineDocumentManager } from '../services/offlineDocumentManager';
// import { integrationService } from '../services/integrations';

// Type definitions for hook state
interface MobileOfflineState {
  isSupported: boolean;
  isInitialized: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  error?: string;
  unsyncedItemCount: number;
  storageInfo: {
    platform: string;
    documentStoragePath: string;
  } | null;
  syncStatus: {
    totalItems: number;
    pendingItems: number;
    completedItems: number;
    failedItems: number;
    inProgressItems: number;
  } | null;
}

// Initial state
const INITIAL_STATE: MobileOfflineState = {
  isSupported: true, // Mobile apps always support offline
  isInitialized: false,
  isOffline: false,
  isSyncing: false,
  unsyncedItemCount: 0,
  storageInfo: null,
  syncStatus: null
};

/**
 * Custom React hook for mobile offline functionality
 */
export const useMobileOffline = () => {
  const [state, setState] = useState<MobileOfflineState>(INITIAL_STATE);

  /**
   * Initialize mobile offline functionality
   */
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      // Initialize mobile offline storage
      await mobileOfflineStorageService.initialize();
      
      // Initialize smart sync service
      await smartSyncService.initialize();
      
      // Initialize offline document manager
      await offlineDocumentManager.initialize();
      
      // Get storage info
      const storageInfo = await mobileOfflineStorageService.getStorageInfo();
      
      // Get unsynced item count
      const unsyncedCases = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:lawFirmCases');
      const unsyncedAccounting = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:accountingEntries');
      const unsyncedEvents = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:calendarEvents');
      const unsyncedDocuments = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:documents');
      
      const unsyncedItemCount = 
        unsyncedCases.length + 
        unsyncedAccounting.length + 
        unsyncedEvents.length + 
        unsyncedDocuments.length;
      
      // Get sync status
      const syncStatus = smartSyncService.getSyncStatus();
      
      setState({
        isSupported: true,
        isInitialized: true,
        isOffline: false, //!(await NetInfo.fetch()).isConnected,
        isSyncing: false,
        unsyncedItemCount,
        storageInfo: {
          platform: storageInfo.platform,
          documentStoragePath: storageInfo.documentStoragePath
        },
        syncStatus
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Mobile offline initialization failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Sync offline data with online services using smart sync
   */
  const syncOfflineData = useCallback(async () => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      // Use smart sync service for intelligent synchronization
      const success = await smartSyncService.startSync();
      
      // Update state after sync
      const updatedUnsyncedCases = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:lawFirmCases');
      const updatedUnsyncedAccounting = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:accountingEntries');
      const updatedUnsyncedEvents = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:calendarEvents');
      const updatedUnsyncedDocuments = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:documents');
      
      const unsyncedItemCount = 
        updatedUnsyncedCases.length + 
        updatedUnsyncedAccounting.length + 
        updatedUnsyncedEvents.length + 
        updatedUnsyncedDocuments.length;
      
      // Get updated sync status
      const syncStatus = smartSyncService.getSyncStatus();
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        unsyncedItemCount,
        syncStatus
      }));
      
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Mobile offline data sync failed'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Save a law firm case for offline use
   */
  const saveLawFirmCaseOffline = useCallback(async (id: string, data: any) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      await mobileOfflineStorageService.saveLawFirmCase(id, data);
      
      // Track user behavior for smart sync
      await smartSyncService.trackUserBehavior(undefined, id, undefined);
      
      setState(prev => ({
        ...prev,
        unsyncedItemCount: prev.unsyncedItemCount + 1
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save case offline'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Save an accounting entry for offline use
   */
  const saveAccountingEntryOffline = useCallback(async (id: string, data: any) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      await mobileOfflineStorageService.saveAccountingEntry(id, data);
      
      // Track user behavior for smart sync
      await smartSyncService.trackUserBehavior(undefined, id, undefined);
      
      setState(prev => ({
        ...prev,
        unsyncedItemCount: prev.unsyncedItemCount + 1
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save accounting entry offline'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Save a calendar event for offline use
   */
  const saveCalendarEventOffline = useCallback(async (id: string, data: any) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      await mobileOfflineStorageService.saveCalendarEvent(id, data);
      
      // Track user behavior for smart sync
      await smartSyncService.trackUserBehavior(undefined, id, undefined);
      
      setState(prev => ({
        ...prev,
        unsyncedItemCount: prev.unsyncedItemCount + 1
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save calendar event offline'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Save a document for offline use
   */
  const saveDocumentOffline = useCallback(async (id: string, data: any, fileContent?: string) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      await mobileOfflineStorageService.saveDocument(id, data, fileContent);
      
      // Track user behavior for smart sync
      await smartSyncService.trackUserBehavior(undefined, id, undefined);
      
      setState(prev => ({
        ...prev,
        unsyncedItemCount: prev.unsyncedItemCount + 1
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save document offline'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Create a document using the offline document manager
   */
  const createOfflineDocument = useCallback(async (
    title: string,
    type: string,
    content: string,
    options?: {
      tags?: string[];
      associatedCaseId?: string;
      associatedClientId?: string;
      encrypt?: boolean;
      author?: string;
      description?: string;
    }
  ) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      const document = await offlineDocumentManager.createDocument(
        title,
        type as any, // Type assertion to match our DocumentType
        content,
        options
      );
      
      setState(prev => ({
        ...prev,
        unsyncedItemCount: prev.unsyncedItemCount + 1
      }));
      
      return document;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create offline document'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Get document metadata
   */
  const getDocumentMetadata = useCallback(async (documentId: string) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      return await offlineDocumentManager.getDocumentMetadata(documentId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get document metadata'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Get document content
   */
  const getDocumentContent = useCallback(async (documentId: string) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      return await offlineDocumentManager.getDocumentContent(documentId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get document content'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Update document content
   */
  const updateDocument = useCallback(async (
    documentId: string,
    content: string,
    changesSummary: string
  ) => {
    if (!state.isInitialized) {
      throw new Error('Mobile offline functionality not initialized');
    }

    try {
      const updatedDoc = await offlineDocumentManager.updateDocument(
        documentId,
        content,
        changesSummary
      );
      
      return updatedDoc;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update document'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Get offline status
   */
  const getOfflineStatus = useCallback(() => {
    return {
      isSupported: state.isSupported,
      isInitialized: state.isInitialized,
      isOffline: state.isOffline,
      unsyncedItemCount: state.unsyncedItemCount
    };
  }, [state]);

  /**
   * Clear all offline data
   */
  const clearOfflineData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      await mobileOfflineStorageService.clearStore('@SmartLaw:lawFirmCases');
      await mobileOfflineStorageService.clearStore('@SmartLaw:accountingEntries');
      await mobileOfflineStorageService.clearStore('@SmartLaw:calendarEvents');
      await mobileOfflineStorageService.clearStore('@SmartLaw:documents');
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        unsyncedItemCount: 0
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to clear offline data'
      }));
      throw error;
    }
  }, []);

  /**
   * Clean up old synced data
   */
  const cleanupOldSyncedData = useCallback(async (daysOld: number = 30) => {
    try {
      await mobileOfflineStorageService.cleanupOldSyncedData(daysOld);
      console.log(`Cleaned up data older than ${daysOld} days`);
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clean up old data'
      }));
      throw error;
    }
  }, []);

  /**
   * Track user behavior for smart sync
   */
  const trackUserBehavior = useCallback(async (
    accessedCaseId?: string,
    createdItemId?: string,
    favoritedDocumentId?: string
  ) => {
    try {
      await smartSyncService.trackUserBehavior(accessedCaseId, createdItemId, favoritedDocumentId);
      
      // Update sync status in state
      const syncStatus = smartSyncService.getSyncStatus();
      
      setState(prev => ({
        ...prev,
        syncStatus
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to track user behavior'
      }));
      throw error;
    }
  }, []);

  /**
   * Retry failed sync items
   */
  const retryFailedSyncItems = useCallback(async () => {
    try {
      await smartSyncService.retryFailedItems();
      
      // Update sync status in state
      const syncStatus = smartSyncService.getSyncStatus();
      
      setState(prev => ({
        ...prev,
        syncStatus
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to retry failed sync items'
      }));
      throw error;
    }
  }, []);

  // Effect to initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Effect to handle network state changes
  // useEffect(() => {
  //   const unsubscribe = NetInfo.addEventListener((netState: any) => {
  //     setState(prev => ({
  //       ...prev,
  //       isOffline: !netState.isConnected
  //     }));
      
  //     // Attempt to sync when coming back online
  //     if (netState.isConnected) {
  //       syncOfflineData();
  //     }
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [syncOfflineData]);

  return {
    // State
    ...state,
    
    // Functions
    initialize,
    syncOfflineData,
    saveLawFirmCaseOffline,
    saveAccountingEntryOffline,
    saveCalendarEventOffline,
    saveDocumentOffline,
    createOfflineDocument,
    getDocumentMetadata,
    getDocumentContent,
    updateDocument,
    getOfflineStatus,
    clearOfflineData,
    cleanupOldSyncedData,
    trackUserBehavior,
    retryFailedSyncItems
  };
};