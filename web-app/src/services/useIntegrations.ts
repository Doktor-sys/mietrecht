/**
 * React Hook for Integration Service
 * 
 * This hook provides easy access to the integration service functionality
 * in React components with proper state management and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { integrationService } from './integrations';
import { 
  LawFirmCaseData, 
  AccountingEntry, 
  CalendarEvent,
  IntegrationConfig
} from './integrations';

// Type definitions for hook state
interface IntegrationState {
  isInitialized: boolean;
  lawFirmSystemConnected: boolean;
  accountingSystemConnected: boolean;
  calendarSystemConnected: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  error?: string;
}

// Initial state
const INITIAL_STATE: IntegrationState = {
  isInitialized: false,
  lawFirmSystemConnected: false,
  accountingSystemConnected: false,
  calendarSystemConnected: false,
  isSyncing: false
};

/**
 * Custom React hook for integration service
 */
export const useIntegrations = () => {
  const [state, setState] = useState<IntegrationState>(INITIAL_STATE);
  const [cases, setCases] = useState<LawFirmCaseData[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  /**
   * Initialize the integration service
   */
  const initialize = useCallback(async (config: IntegrationConfig) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      await integrationService.initialize(config);
      
      const status = integrationService.getStatus();
      setState({
        isInitialized: status.isInitialized,
        lawFirmSystemConnected: status.lawFirmSystemConnected,
        accountingSystemConnected: status.accountingSystemConnected,
        calendarSystemConnected: status.calendarSystemConnected,
        isSyncing: false,
        lastSync: new Date()
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Sync law firm cases with optional cache bypass
   */
  const syncLawFirmCases = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      const syncedCases = await integrationService.syncLawFirmCases(forceRefresh);
      setCases(syncedCases);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      return syncedCases;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Law firm case sync failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Sync accounting data with performance optimizations
   */
  const syncAccountingData = useCallback(async (entries: AccountingEntry[], useBatching: boolean = true) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      // For large datasets, use batching
      const result = await integrationService.syncAccountingData(entries);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Accounting data sync failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Sync calendar events with performance optimizations
   */
  const syncCalendarEvents = useCallback(async (events: CalendarEvent[], useBatching: boolean = true) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      
      // For large datasets, use batching
      const result = await integrationService.syncCalendarEvents(events);
      setEvents(events);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Calendar event sync failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Create a new law firm case
   */
  const createLawFirmCase = useCallback(async (caseData: LawFirmCaseData) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      const caseId = await integrationService.createLawFirmCase(caseData);
      
      // Refresh cases after creation
      await syncLawFirmCases(true);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      return caseId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Law firm case creation failed'
      }));
      throw error;
    }
  }, [syncLawFirmCases]);

  /**
   * Update an existing law firm case
   */
  const updateLawFirmCase = useCallback(async (caseId: string, caseData: Partial<LawFirmCaseData>) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      const result = await integrationService.updateLawFirmCase(caseId, caseData);
      
      // Refresh cases after update
      await syncLawFirmCases(true);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Law firm case update failed'
      }));
      throw error;
    }
  }, [syncLawFirmCases]);

  /**
   * Create a new calendar event
   */
  const createCalendarEvent = useCallback(async (event: CalendarEvent) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      const eventId = await integrationService.createCalendarEvent(event);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      return eventId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Calendar event creation failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Update an existing calendar event
   */
  const updateCalendarEvent = useCallback(async (eventId: string, eventData: Partial<CalendarEvent>) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
      const result = await integrationService.updateCalendarEvent(eventId, eventData);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date()
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Calendar event update failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Clear all caches
   */
  const clearCaches = useCallback(async () => {
    try {
      integrationService.clearCaches();
      setState(prev => ({ ...prev, lastSync: new Date() }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Clear caches failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Flush all batch processors
   */
  const flushBatchProcessors = useCallback(async () => {
    try {
      await integrationService.flushBatchProcessors();
      setState(prev => ({ ...prev, lastSync: new Date() }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Flush batch processors failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Get current integration status
   */
  const getStatus = useCallback(() => {
    const status = integrationService.getStatus();
    return {
      initialized: status.isInitialized,
      lawFirmSystemConnected: status.lawFirmSystemConnected,
      accountingSystemConnected: status.accountingSystemConnected,
      calendarSystemConnected: status.calendarSystemConnected
    };
  }, []);

  // Effect to initialize status on mount
  useEffect(() => {
    const status = integrationService.getStatus();
    setState(prev => ({
      ...prev,
      isInitialized: status.isInitialized,
      lawFirmSystemConnected: status.lawFirmSystemConnected,
      accountingSystemConnected: status.accountingSystemConnected,
      calendarSystemConnected: status.calendarSystemConnected
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Cases and events data
    cases,
    events,
    
    // Functions
    initialize,
    syncLawFirmCases,
    syncAccountingData,
    syncCalendarEvents,
    createLawFirmCase,
    updateLawFirmCase,
    createCalendarEvent,
    updateCalendarEvent,
    getStatus,
    clearCaches,
    flushBatchProcessors
  };
};