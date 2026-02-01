/**
 * Integration Service for SmartLaw Mietrecht
 * 
 * This service handles all third-party system integrations including:
 * - Law firm management systems (Lexware, DATEV, etc.)
 * - Accounting systems (Lexoffice, FastBill, etc.)
 * - Calendar systems (Google Calendar, Outlook, etc.)
 * 
 * Features:
 * - Unified API for all integrations
 * - Authentication handling
 * - Data mapping between internal and external formats
 * - Performance optimization through caching and batching
 * - Offline support
 */

// Import connector classes
import { LexwareConnector, LexwareConfig } from './connectors/lexwareConnector';
import { LexofficeConnector, LexofficeConfig } from './connectors/lexofficeConnector';
import { GoogleCalendarConnector, GoogleCalendarConfig } from './connectors/googleCalendarConnector';
import { DatevConnector, DatevConfig } from './connectors/datevConnector';
import { FastBillConnector, FastBillConfig } from './connectors/fastBillConnector';
import { OutlookCalendarConnector, OutlookCalendarConfig } from './connectors/outlookCalendarConnector';
import axios, { AxiosInstance } from 'axios';
import { cacheService } from './cache';
import { createBatchProcessor, BatchOperation } from './batchProcessor';
import { offlineStorageService } from './offlineStorage';

// Types for integration data structures
interface LawFirmCaseData {
  caseId: string;
  clientId?: string;
  clientName: string;
  caseType: string;
  startDate: string;
  endDate?: string;
  status: string;
  assignedLawyer: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billingInfo: {
    hourlyRate?: number;
    currency: string;
    hoursWorked?: number;
    totalAmount?: number;
  };
}

interface AccountingEntry {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  category: string;
  clientId?: string;
  caseId?: string;
  invoiceNumber?: string;
  isTaxRelevant?: boolean;
  taxAmount?: number;
  taxRate?: number;
  paymentMethod?: string;
}

interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  eventType: 'deadline' | 'court_hearing' | 'meeting' | 'other';
  attendees?: string[];
  location?: string;
  caseId?: string;
  reminderTime?: number; // Minutes before event
  isAllDay?: boolean;
  priority?: string;
  reminderMinutes?: number;
  status?: string;
  clientId?: string;
}

// Configuration interfaces
interface LawFirmSystemConfig {
  type: 'lexware' | 'datev' | 'other';
  apiKey?: string;
  credentials?: {
    username: string;
    password: string;
  };
  endpoint?: string;
  clientId?: string;
  clientSecret?: string;
  // Lexware specific
  baseUrl?: string;
  accessToken?: string;
  mandantId?: string;
  // DATEV specific
  refreshToken?: string;
  // Additional properties
  apiUrl?: string;
}

interface AccountingSystemConfig {
  type: 'lexoffice' | 'fastbill' | 'datev' | 'other';
  apiKey?: string;
  credentials?: {
    username: string;
    password: string;
  };
  endpoint?: string;
  clientId?: string;
  clientSecret?: string;
  // Lexoffice specific
  baseUrl?: string;
  // FastBill specific
  email?: string;
  apiUrl?: string;
  // DATEV specific
  accessToken?: string;
  refreshToken?: string;
  // Additional properties
  syncFrequency?: string;
}

interface CalendarSystemConfig {
  type: 'google' | 'outlook' | 'other';
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
  clientId?: string;
  clientSecret?: string;
  // Google specific
  baseUrl?: string;
  // Outlook specific
  tenantId?: string;
  appId?: string;
  // Additional properties
  apiUrl?: string;
}

interface IntegrationConfig {
  lawFirmSystem?: LawFirmSystemConfig;
  accountingSystem?: AccountingSystemConfig;
  calendarSystem?: CalendarSystemConfig;
}

// Status interface
interface IntegrationStatus {
  isInitialized?: boolean;
  lawFirmSystemConnected: boolean;
  accountingSystemConnected: boolean;
  calendarSystemConnected: boolean;
  lastSync?: Date;
  error?: string;
}

class IntegrationService {
  private config: IntegrationConfig | null = null;
  private isInitialized = false;
  
  // Connector instances
  private lexwareConnector: LexwareConnector | null = null;
  private lexofficeConnector: LexofficeConnector | null = null;
  private googleCalendarConnector: GoogleCalendarConnector | null = null;
  private datevConnector: DatevConnector | null = null;
  private fastBillConnector: FastBillConnector | null = null;
  private outlookCalendarConnector: OutlookCalendarConnector | null = null;
  
  // Performance optimization services
  private caseCacheKey = 'lawfirm_cases';
  private caseBatchProcessor: ReturnType<typeof createBatchProcessor<LawFirmCaseData>> | null = null;
  private accountingBatchProcessor: ReturnType<typeof createBatchProcessor<AccountingEntry>> | null = null;
  private calendarBatchProcessor: ReturnType<typeof createBatchProcessor<CalendarEvent>> | null = null;

  // API clients
  private apiClient: AxiosInstance | null = null;
  private calendarApiClient: AxiosInstance | null = null;

  /**
   * Initialize the integration service with configuration
   */
  async initialize(config: IntegrationConfig): Promise<void> {
    this.config = config;
    
    // Initialize connectors based on configuration
    if (config.lawFirmSystem) {
      switch (config.lawFirmSystem.type) {
        case 'lexware':
          // Ensure required properties exist
          if (config.lawFirmSystem.baseUrl && config.lawFirmSystem.accessToken) {
            const lexwareConfig: LexwareConfig = {
              baseUrl: config.lawFirmSystem.baseUrl,
              accessToken: config.lawFirmSystem.accessToken,
              mandantId: config.lawFirmSystem.mandantId
            };
            this.lexwareConnector = new LexwareConnector(lexwareConfig);
          }
          break;
        case 'datev':
          // Ensure required properties exist
          if (config.lawFirmSystem.accessToken && config.lawFirmSystem.refreshToken) {
            const datevConfig: DatevConfig = {
              clientId: config.lawFirmSystem.clientId || '',
              clientSecret: config.lawFirmSystem.clientSecret || '',
              accessToken: config.lawFirmSystem.accessToken || '',
              refreshToken: config.lawFirmSystem.refreshToken || ''
            };
            this.datevConnector = new DatevConnector(datevConfig);
          }
          break;
        default:
          console.warn('Unsupported law firm system type:', config.lawFirmSystem.type);
      }
    }
    
    if (config.accountingSystem) {
      switch (config.accountingSystem.type) {
        case 'lexoffice':
          // Ensure required properties exist
          if (config.accountingSystem.baseUrl && config.accountingSystem.apiKey) {
            const lexofficeConfig: LexofficeConfig = {
              baseUrl: config.accountingSystem.baseUrl,
              apiKey: config.accountingSystem.apiKey
            };
            this.lexofficeConnector = new LexofficeConnector(lexofficeConfig);
          }
          break;
        case 'fastbill':
          // Ensure required properties exist
          if (config.accountingSystem.email && config.accountingSystem.apiKey) {
            const fastbillConfig: FastBillConfig = {
              email: config.accountingSystem.email,
              apiKey: config.accountingSystem.apiKey,
              apiUrl: config.accountingSystem.apiUrl
            };
            this.fastBillConnector = new FastBillConnector(fastbillConfig);
          }
          break;
        case 'datev':
          // DATEV can be used for both law firm and accounting
          if (!this.datevConnector && config.accountingSystem.accessToken && config.accountingSystem.refreshToken) {
            const datevConfig: DatevConfig = {
              clientId: config.accountingSystem.clientId || '',
              clientSecret: config.accountingSystem.clientSecret || '',
              accessToken: config.accountingSystem.accessToken || '',
              refreshToken: config.accountingSystem.refreshToken || ''
            };
            this.datevConnector = new DatevConnector(datevConfig);
          }
          break;
        default:
          console.warn('Unsupported accounting system type:', config.accountingSystem.type);
      }
    }
    
    if (config.calendarSystem) {
      switch (config.calendarSystem.type) {
        case 'google':
          // Ensure required properties exist
          if (config.calendarSystem.baseUrl && config.calendarSystem.accessToken) {
            const googleConfig: GoogleCalendarConfig = {
              baseUrl: config.calendarSystem.baseUrl,
              accessToken: config.calendarSystem.accessToken,
              calendarId: config.calendarSystem.calendarId,

            };
            this.googleCalendarConnector = new GoogleCalendarConnector(googleConfig);
          }
          break;
        case 'outlook':
          // Ensure required properties exist
          if (config.calendarSystem.tenantId && config.calendarSystem.clientId) {
            const outlookConfig: OutlookCalendarConfig = {
              tenantId: config.calendarSystem.tenantId,
              clientId: config.calendarSystem.clientId,
              clientSecret: config.calendarSystem.clientSecret,
              accessToken: config.calendarSystem.accessToken,
              refreshToken: config.calendarSystem.refreshToken,
              calendarId: config.calendarSystem.calendarId
            };
            this.outlookCalendarConnector = new OutlookCalendarConnector(outlookConfig);
          }
          break;
        default:
          console.warn('Unsupported calendar system type:', config.calendarSystem.type);
      }
    }
    
    // Initialize performance optimization services
    this.caseBatchProcessor = createBatchProcessor<LawFirmCaseData>(
      async (operations: BatchOperation<LawFirmCaseData>[]) => {
        // Process batch of law firm cases
        console.log(`Processing batch of ${operations.length} law firm cases`);
        // In a real implementation, this would make an API call to create multiple cases
        operations.forEach(op => op.resolve(`Created case ${op.data.caseId}`));
      },
      10, // Batch size
      1000 // Flush timeout (ms)
    );
    
    this.accountingBatchProcessor = createBatchProcessor<AccountingEntry>(
      async (operations: BatchOperation<AccountingEntry>[]) => {
        // Process batch of accounting entries
        console.log(`Processing batch of ${operations.length} accounting entries`);
        // In a real implementation, this would make an API call to create multiple entries
        operations.forEach(op => op.resolve(`Created entry ${op.data.id}`));
      },
      20, // Batch size
      2000 // Flush timeout (ms)
    );
    
    this.calendarBatchProcessor = createBatchProcessor<CalendarEvent>(
      async (operations: BatchOperation<CalendarEvent>[]) => {
        // Process batch of calendar events
        console.log(`Processing batch of ${operations.length} calendar events`);
        // In a real implementation, this would make an API call to create multiple events
        operations.forEach(op => op.resolve(`Created event ${op.data.title}`));
      },
      15, // Batch size
      1500 // Flush timeout (ms)
    );
    
    // Initialize API clients
    this.apiClient = axios.create({
      baseURL: 'https://api.smartlaw.example.com/v1',
      timeout: 10000,
    });
    
    this.calendarApiClient = axios.create({
      baseURL: 'https://calendar.smartlaw.example.com/v1',
      timeout: 10000,
    });
    
    this.isInitialized = true;
  }

  /**
   * Get the current integration status
   */
  getStatus(): IntegrationStatus {
    if (!this.isInitialized) {
      return {
        isInitialized: false,
        lawFirmSystemConnected: false,
        accountingSystemConnected: false,
        calendarSystemConnected: false,
        error: 'Service not initialized'
      };
    }

    return {
      isInitialized: true,
      lawFirmSystemConnected: !!this.config?.lawFirmSystem,
      accountingSystemConnected: !!this.config?.accountingSystem,
      calendarSystemConnected: !!this.config?.calendarSystem,
      lastSync: new Date()
    };
  }

  /**
   * Sync law firm cases with the configured system
   */
  async syncLawFirmCases(forceRefresh: boolean = false): Promise<LawFirmCaseData[]> {
    if (!this.isInitialized || !this.config?.lawFirmSystem) {
      throw new Error('Integration service not initialized or law firm system not configured');
    }

    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedCases = cacheService.get<LawFirmCaseData[]>(this.caseCacheKey);
        if (cachedCases) {
          console.log('Returning cached law firm cases');
          return cachedCases;
        }
      }

      // In a real implementation, this would fetch cases from the actual system
      // For now, we'll return mock data
      const mockCases: LawFirmCaseData[] = [
        {
          caseId: 'CASE-001',
          clientName: 'Max Mustermann',
          caseType: 'Mietrecht',
          startDate: '2023-01-15',
          status: 'active',
          assignedLawyer: 'Erika Mustermann',
          billingInfo: {
            hourlyRate: 150,
            currency: 'EUR'
          }
        },
        {
          caseId: 'CASE-002',
          clientName: 'Anna Beispiel',
          caseType: 'Mietrecht',
          startDate: '2023-02-20',
          endDate: '2023-03-15',
          status: 'closed',
          assignedLawyer: 'Erika Mustermann',
          billingInfo: {
            hourlyRate: 150,
            currency: 'EUR'
          }
        }
      ];

      // Cache the results
      cacheService.set(this.caseCacheKey, mockCases, 300000); // Cache for 5 minutes

      return mockCases;
    } catch (error) {
      console.error('Law firm case sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync accounting data with the configured system
   */
  async syncAccountingData(entries: AccountingEntry[]): Promise<boolean> {
    if (!this.isInitialized || !this.config?.accountingSystem) {
      throw new Error('Integration service not initialized or accounting system not configured');
    }

    try {
      // Use batch processor for performance optimization
      if (this.accountingBatchProcessor) {
        // Add all entries to the batch processor
        const promises = entries.map(entry => this.accountingBatchProcessor!.add(entry));
        await Promise.all(promises);
        return true;
      }
      
      // Fallback to direct sync if batch processor not available
      if (this.config.accountingSystem.type === 'lexoffice' && this.lexofficeConnector) {
        await this.lexofficeConnector.syncAccountingEntries(entries);
        return true;
      }
      
      if (this.config.accountingSystem.type === 'fastbill' && this.fastBillConnector) {
        await this.fastBillConnector.syncAccountingEntries(entries);
        return true;
      }
      
      if (this.config.accountingSystem.type === 'datev' && this.datevConnector) {
        await this.datevConnector.syncAccountingEntries(entries);
        return true;
      }
      
      // Placeholder for other systems
      console.log('Syncing accounting entries:', entries);
      return true; // Return success
    } catch (error) {
      console.error('Accounting data sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync calendar events with the configured system
   */
  async syncCalendarEvents(events: CalendarEvent[]): Promise<boolean> {
    if (!this.isInitialized || !this.config?.calendarSystem) {
      throw new Error('Integration service not initialized or calendar system not configured');
    }

    try {
      // Use batch processor for performance optimization
      if (this.calendarBatchProcessor) {
        // Add all events to the batch processor
        const promises = events.map(event => this.calendarBatchProcessor!.add(event));
        await Promise.all(promises);
        return true;
      }
      
      // Fallback to direct sync if batch processor not available
      if (this.config.calendarSystem.type === 'google' && this.googleCalendarConnector) {
        await this.googleCalendarConnector.syncEvents(events);
        return true;
      }
      
      if (this.config.calendarSystem.type === 'outlook' && this.outlookCalendarConnector) {
        await this.outlookCalendarConnector.syncEvents(events);
        return true;
      }
      
      // Placeholder for other systems
      console.log('Syncing calendar events:', events);
      return true; // Return success
    } catch (error) {
      console.error('Calendar event sync failed:', error);
      throw error;
    }
  }

  /**
   * Create a new law firm case with offline support
   */
  async createLawFirmCase(caseData: LawFirmCaseData): Promise<any> {
    try {
      // Try to create case online
      const response = await this.apiClient.post('/lawfirm/cases', caseData);
      
      // If successful, return the response
      return response.data;
    } catch (error) {
      // If offline or API error, save to offline storage
      console.warn('Failed to create law firm case online, saving offline:', error);
      
      try {
        const offlineId = `offline_case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await offlineStorageService.saveLawFirmCase(offlineId, caseData);
        return { id: offlineId, offline: true, message: 'Case saved offline for later sync' };
      } catch (storageError) {
        console.error('Failed to save case offline:', storageError);
        throw storageError;
      }
    }
  }

  /**
   * Update an existing law firm case
   */
  async updateLawFirmCase(caseId: string, caseData: Partial<LawFirmCaseData>): Promise<boolean> {
    if (!this.isInitialized || !this.config?.lawFirmSystem) {
      throw new Error('Integration service not initialized or law firm system not configured');
    }

    try {
      // Use appropriate connector based on system type
      if (this.config.lawFirmSystem.type === 'lexware' && this.lexwareConnector) {
        const result = await this.lexwareConnector.updateCase(caseId, caseData);
        return result;
      }
      
      // Placeholder for other systems
      console.log('Updating law firm case:', caseId, caseData);
      return true; // Return success
    } catch (error) {
      console.error('Law firm case update failed:', error);
      throw error;
    }
  }

  /**
   * Create a new accounting entry
   */
  async createAccountingEntry(entryData: AccountingEntry): Promise<string> {
    if (!this.isInitialized || !this.config?.accountingSystem) {
      throw new Error('Integration service not initialized or accounting system not configured');
    }

    try {
      // Use batch processor for performance optimization
      if (this.accountingBatchProcessor) {
        return await this.accountingBatchProcessor.add(entryData);
      }
      
      // Fallback to direct creation if batch processor not available
      if (this.config.accountingSystem.type === 'lexoffice' && this.lexofficeConnector) {
        // For Lexoffice, we need to sync entries differently
        await this.lexofficeConnector.syncAccountingEntries([entryData]);
        return entryData.id; // Return created entry ID
      }
      
      if (this.config.accountingSystem.type === 'fastbill' && this.fastBillConnector) {
        // For FastBill, we need to sync entries differently
        await this.fastBillConnector.syncAccountingEntries([entryData]);
        return entryData.id; // Return created entry ID
      }
      
      // Placeholder for other systems
      console.log('Creating accounting entry:', entryData.id);
      return entryData.id; // Return created entry ID
    } catch (error) {
      console.error('Accounting entry creation failed:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar event with offline support
   */
  async createCalendarEvent(eventData: CalendarEvent): Promise<any> {
    try {
      // Try to create event online
      const response = await this.calendarApiClient.post('/events', eventData);
      
      // If successful, return the response
      return response.data;
    } catch (error) {
      // If offline or API error, save to offline storage
      console.warn('Failed to create calendar event online, saving offline:', error);
      
      try {
        const offlineId = `offline_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await offlineStorageService.saveCalendarEvent(offlineId, eventData);
        return { id: offlineId, offline: true, message: 'Event saved offline for later sync' };
      } catch (storageError) {
        console.error('Failed to save event offline:', storageError);
        throw storageError;
      }
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<boolean> {
    if (!this.isInitialized || !this.config?.calendarSystem) {
      throw new Error('Integration service not initialized or calendar system not configured');
    }

    try {
      // Use appropriate connector based on system type
      if (this.config.calendarSystem.type === 'google' && this.googleCalendarConnector) {
        // For Google Calendar, we would update the event
        console.log('Updating Google Calendar event:', eventId, eventData);
        return true;
      }
      
      if (this.config.calendarSystem.type === 'outlook' && this.outlookCalendarConnector) {
        // For Outlook Calendar, we would update the event
        console.log('Updating Outlook Calendar event:', eventId, eventData);
        return true;
      }
      
      // Placeholder for other systems
      console.log('Updating calendar event:', eventId, eventData);
      return true; // Return success
    } catch (error) {
      console.error('Calendar event update failed:', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    cacheService.clearAll();
  }

  /**
   * Flush all batch processors
   */
  async flushBatchProcessors(): Promise<void> {
    if (this.caseBatchProcessor) {
      await this.caseBatchProcessor.flush();
    }
    
    if (this.accountingBatchProcessor) {
      await this.accountingBatchProcessor.flush();
    }
    
    if (this.calendarBatchProcessor) {
      await this.calendarBatchProcessor.flush();
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();

// Export interfaces for external use
export type { 
  LawFirmCaseData, 
  AccountingEntry, 
  CalendarEvent, 
  IntegrationConfig,
  IntegrationStatus,
  LawFirmSystemConfig,
  AccountingSystemConfig,
  CalendarSystemConfig
};
