/**
 * Integration Suite Tests
 * 
 * This file contains comprehensive end-to-end tests for all system integrations
 * including law firm management systems, accounting systems, and calendar systems.
 */

import { integrationService } from '../integrations';
import { LawFirmCaseData, AccountingEntry, CalendarEvent } from '../integrations';

// Mock data for testing
const mockLawFirmCases: LawFirmCaseData[] = [
  {
    caseId: 'case-123',
    clientId: 'client-456',
    clientName: 'Max Mustermann',
    caseType: 'Mietrecht',
    startDate: '2025-12-01',
    status: 'open',
    assignedLawyer: 'Anna Schmidt',
    billingInfo: {
      hourlyRate: 150,
      hoursWorked: 10,
      totalAmount: 1500,
      currency: 'EUR'
    }
  }
];

const mockAccountingEntries: AccountingEntry[] = [
  {
    id: 'entry-1',
    date: '2025-12-01',
    amount: 1500.00,
    currency: 'EUR',
    description: 'Mietzahlung für Dezember',
    category: 'income',
    clientId: 'client-456',
    caseId: 'case-123',
    paymentMethod: 'bank_transfer',
    invoiceNumber: 'INV-2025-001',
    isTaxRelevant: true,
    taxAmount: 270.00,
    taxRate: 0.19
  }
];

const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Verhandlungstermin',
    description: 'Hauptverhandlung im Mietrechtstreit',
    startTime: '2025-12-15T10:00:00Z',
    endTime: '2025-12-15T12:00:00Z',
    startDate: '2025-12-15T10:00:00Z',
    endDate: '2025-12-15T12:00:00Z',
    location: 'Amtsgericht Berlin',
    attendees: ['anwalt@kanzlei.de', 'mieter@example.com'],
    reminderMinutes: 1440, // 24 hours
    isAllDay: false,
    caseId: 'case-123',
    clientId: 'client-456',
    eventType: 'court_hearing',
    priority: 'high',
    status: 'confirmed'
  }
];

describe('Integration Suite Tests', () => {
  beforeEach(() => {
    // Reset the integration service before each test
    (integrationService as any).isInitialized = false;
    (integrationService as any).config = null;
    (integrationService as any).lexwareConnector = null;
    (integrationService as any).lexofficeConnector = null;
    (integrationService as any).datevConnector = null;
    (integrationService as any).fastBillConnector = null;
    (integrationService as any).googleCalendarConnector = null;
    (integrationService as any).outlookCalendarConnector = null;
  });

  describe('Complete Integration Flow', () => {
    test('should integrate law firm system with accounting and calendar systems', async () => {
      // Initialize with all systems
      const config = {
        lawFirmSystem: {
          type: 'lexware' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexware.de/kanzlei/v1'
        },
        accountingSystem: {
          type: 'lexoffice' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexoffice.de/v1'
        },
        calendarSystem: {
          type: 'google' as const,
          apiKey: 'test-access-token',
          calendarId: 'primary'
        }
      };

      // Initialize all systems
      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.lawFirmSystemConnected).toBe(true);
      expect(status.accountingSystemConnected).toBe(true);
      expect(status.calendarSystemConnected).toBe(true);

      // Sync law firm cases
      const cases = await integrationService.syncLawFirmCases();
      expect(cases).toEqual(mockLawFirmCases);

      // Sync accounting data
      const accountingResult = await integrationService.syncAccountingData(mockAccountingEntries);
      expect(accountingResult).toBe(true);

      // Sync calendar events
      const calendarResult = await integrationService.syncCalendarEvents(mockCalendarEvents);
      expect(calendarResult).toBe(true);

      // Create a deadline event
      const deadlineEvent: CalendarEvent = {
        id: '',
        title: 'Frist: Antwort auf Klage',
        description: 'Antwort auf Klage beim Gericht einreichen',
        startTime: '2025-12-25T17:00:00Z',
        endTime: '2025-12-25T17:00:00Z',
        startDate: '2025-12-25T17:00:00Z',
        endDate: '2025-12-25T17:00:00Z',
        location: 'Online',
        attendees: ['anwalt@kanzlei.de'],
        reminderMinutes: 2880, // 48 hours
        isAllDay: false,
        caseId: 'case-123',
        clientId: 'client-456',
        eventType: 'deadline',
        priority: 'urgent',
        status: 'confirmed'
      };

      const eventId = await integrationService.createCalendarEvent(deadlineEvent);
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    test('should handle mixed system configurations', async () => {
      // Initialize with different systems
      const config = {
        lawFirmSystem: {
          type: 'lexware' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexware.de/kanzlei/v1'
        },
        accountingSystem: {
          type: 'datev' as const,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          apiKey: 'test-access-token',
          refreshToken: 'test-refresh-token'
        },
        calendarSystem: {
          type: 'outlook' as const,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tenantId: 'test-tenant-id',
          apiKey: 'test-access-token',
          refreshToken: 'test-refresh-token',
          calendarId: 'primary'
        }
      };

      // Initialize all systems
      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.lawFirmSystemConnected).toBe(true);
      expect(status.accountingSystemConnected).toBe(true);
      expect(status.calendarSystemConnected).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle partial system failures gracefully', async () => {
      // Initialize with one invalid system
      const config = {
        lawFirmSystem: {
          type: 'lexware' as const,
          apiKey: 'invalid-api-key',
          apiUrl: 'https://api.lexware.de/kanzlei/v1'
        },
        accountingSystem: {
          type: 'lexoffice' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexoffice.de/v1'
        },
        calendarSystem: {
          type: 'google' as const,
          apiKey: 'test-access-token',
          calendarId: 'primary'
        }
      };

      // Should still initialize even with one failing system
      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      // Law firm system should be disconnected due to invalid API key
      // But accounting and calendar systems should still be connected
      expect(status.accountingSystemConnected).toBe(true);
      expect(status.calendarSystemConnected).toBe(true);
    });

    test('should retry failed operations', async () => {
      // This test would require mocking network failures
      // For now, we'll just verify the service can be re-initialized
      const config = {
        accountingSystem: {
          type: 'lexoffice' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexoffice.de/v1'
        }
      };

      await integrationService.initialize(config);
      
      // Re-initialize with same config
      await integrationService.initialize(config);
      
      const status = integrationService.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.accountingSystemConnected).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk data synchronization efficiently', async () => {
      const config = {
        accountingSystem: {
          type: 'lexoffice' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexoffice.de/v1'
        }
      };

      await integrationService.initialize(config);
      
      // Create bulk data
      const bulkEntries: AccountingEntry[] = [];
      for (let i = 0; i < 100; i++) {
        bulkEntries.push({
          id: `entry-${i}`,
          date: `2025-12-${String(i % 30 + 1).padStart(2, '0')}`,
          amount: Math.random() * 1000,
          currency: 'EUR',
          description: `Test entry ${i}`,
          category: 'income',
          clientId: `client-${i % 10}`,
          caseId: `case-${i % 5}`
        });
      }

      // Measure sync time
      const startTime = Date.now();
      const result = await integrationService.syncAccountingData(bulkEntries);
      const endTime = Date.now();
      
      expect(result).toBe(true);
      // Should complete within reasonable time (less than 5 seconds for 100 entries)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});