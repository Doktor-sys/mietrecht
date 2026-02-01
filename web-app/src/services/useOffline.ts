/**
 * React Hook for Offline Functionality
 * 
 * This hook provides easy access to offline functionality in React components
 * with proper state management and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorageService } from './offlineStorage';
import { integrationService } from './integrations';

// Type definitions for hook state
interface OfflineState {
  isSupported: boolean;
  isInitialized: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  error?: string;
  unsyncedItemCount: number;
}

// Initial state
const INITIAL_STATE: OfflineState = {
  isSupported: false,
  isInitialized: false,
  isOffline: false,
  isSyncing: false,
  unsyncedItemCount: 0
};

/**
 * Custom React hook for offline functionality
 */
export const useOffline = () => {
  const [state, setState] = useState<OfflineState>(INITIAL_STATE);

  /**
   * Initialize offline functionality
   */
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      // Check if offline storage is supported
      const isSupported = offlineStorageService.isSupported();
      
      if (isSupported) {
        // Initialize offline storage
        await offlineStorageService.initialize();
        
        // Get unsynced item count
        const unsyncedCases = await offlineStorageService.getUnsyncedItems('lawFirmCases');
        const unsyncedAccounting = await offlineStorageService.getUnsyncedItems('accountingEntries');
        const unsyncedEvents = await offlineStorageService.getUnsyncedItems('calendarEvents');
        const unsyncedDocuments = await offlineStorageService.getUnsyncedItems('documents');
        
        const unsyncedItemCount = 
          unsyncedCases.length + 
          unsyncedAccounting.length + 
          unsyncedEvents.length + 
          unsyncedDocuments.length;
        
        setState({
          isSupported,
          isInitialized: true,
          isOffline: !navigator.onLine,
          isSyncing: false,
          unsyncedItemCount
        });
      } else {
        setState({
          isSupported: false,
          isInitialized: false,
          isOffline: false,
          isSyncing: false,
          unsyncedItemCount: 0
        });
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Offline initialization failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Sync offline data with online services
   */
  const syncOfflineData = useCallback(async () => {
    if (!state.isInitialized) {
      throw new Error('Offline functionality not initialized');
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      // Sync law firm cases
      const unsyncedCases = await offlineStorageService.getUnsyncedItems('lawFirmCases');
      for (const caseData of unsyncedCases) {
        try {
          // In a real implementation, this would sync with the actual service
          await integrationService.createLawFirmCase(caseData.data);
          await offlineStorageService.markAsSynced('lawFirmCases', caseData.id);
        } catch (error) {
          console.error(`Failed to sync case ${caseData.id}:`, error);
        }
      }
      
      // Sync accounting entries
      const unsyncedAccounting = await offlineStorageService.getUnsyncedItems('accountingEntries');
      for (const entryData of unsyncedAccounting) {
        try {
          // In a real implementation, this would sync with the actual service
          // We'd need to collect entries and sync them in batches
          console.log(`Would sync accounting entry ${entryData.id}`);
          await offlineStorageService.markAsSynced('accountingEntries', entryData.id);
        } catch (error) {
          console.error(`Failed to sync accounting entry ${entryData.id}:`, error);
        }
      }
      
      // Sync calendar events
      const unsyncedEvents = await offlineStorageService.getUnsyncedItems('calendarEvents');
      for (const eventData of unsyncedEvents) {
        try {
          // In a real implementation, this would sync with the actual service
          await integrationService.createCalendarEvent(eventData.data);
          await offlineStorageService.markAsSynced('calendarEvents', eventData.id);
        } catch (error) {
          console.error(`Failed to sync event ${eventData.id}:`, error);
        }
      }
      
      // Sync documents
      const unsyncedDocuments = await offlineStorageService.getUnsyncedItems('documents');
      for (const docData of unsyncedDocuments) {
        try {
          // In a real implementation, this would sync with the actual service
          console.log(`Would sync document ${docData.id}`);
          await offlineStorageService.markAsSynced('documents', docData.id);
        } catch (error) {
          console.error(`Failed to sync document ${docData.id}:`, error);
        }
      }
      
      // Update state after sync
      const updatedUnsyncedCases = await offlineStorageService.getUnsyncedItems('lawFirmCases');
      const updatedUnsyncedAccounting = await offlineStorageService.getUnsyncedItems('accountingEntries');
      const updatedUnsyncedEvents = await offlineStorageService.getUnsyncedItems('calendarEvents');
      const updatedUnsyncedDocuments = await offlineStorageService.getUnsyncedItems('documents');
      
      const unsyncedItemCount = 
        updatedUnsyncedCases.length + 
        updatedUnsyncedAccounting.length + 
        updatedUnsyncedEvents.length + 
        updatedUnsyncedDocuments.length;
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        unsyncedItemCount
      }));
      
      return unsyncedItemCount === 0;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Offline data sync failed'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Save a law firm case for offline use
   */
  const saveLawFirmCaseOffline = useCallback(async (id: string, data: any) => {
    if (!state.isInitialized) {
      throw new Error('Offline functionality not initialized');
    }

    try {
      await offlineStorageService.saveLawFirmCase(id, data);
      
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
      throw new Error('Offline functionality not initialized');
    }

    try {
      await offlineStorageService.saveAccountingEntry(id, data);
      
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
      throw new Error('Offline functionality not initialized');
    }

    try {
      await offlineStorageService.saveCalendarEvent(id, data);
      
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
  const saveDocumentOffline = useCallback(async (id: string, data: any) => {
    if (!state.isInitialized) {
      throw new Error('Offline functionality not initialized');
    }

    try {
      await offlineStorageService.saveDocument(id, data);
      
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
   * Get offline status
   */
  const getOfflineStatus = useCallback(() => {
    return {
      isSupported: state.isSupported,
      isInitialized: state.isInitialized,
      isOffline: !navigator.onLine,
      unsyncedItemCount: state.unsyncedItemCount
    };
  }, [state]);

  /**
   * Clear all offline data
   */
  const clearOfflineData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      await offlineStorageService.clearStore('lawFirmCases');
      await offlineStorageService.clearStore('accountingEntries');
      await offlineStorageService.clearStore('calendarEvents');
      await offlineStorageService.clearStore('documents');
      
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

  // Effect to initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Effect to handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      // Attempt to sync when coming back online
      syncOfflineData();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

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
    getOfflineStatus,
    clearOfflineData
  };
};