/**
 * Calendar Integration Tests
 * 
 * This file contains comprehensive tests for all calendar system integrations
 * including Google Calendar, Outlook Calendar, and Exchange connectors.
 */

import { integrationService } from '../integrations';
import { CalendarEvent } from '../integrations';

// Mock data for testing
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
    caseId: 'case-456',
    clientId: 'client-123',
    eventType: 'court_hearing',
    priority: 'high',
    status: 'confirmed'
  },
  {
    id: 'event-2',
    title: 'Frist: Schriftsatz einreichen',
    description: 'Einreichung des Schriftsatzes beim Gericht',
    startTime: '2025-12-20T17:00:00Z',
    endTime: '2025-12-20T17:00:00Z',
    startDate: '2025-12-20T17:00:00Z',
    endDate: '2025-12-20T17:00:00Z',
    location: 'Online',
    attendees: ['anwalt@kanzlei.de'],
    reminderMinutes: 2880, // 48 hours
    isAllDay: false,
    caseId: 'case-457',
    clientId: 'client-124',
    eventType: 'deadline',
    priority: 'urgent',
    status: 'confirmed'
  }
];

describe('Calendar Integration Tests', () => {
  beforeEach(() => {
    // Reset the integration service before each test
    (integrationService as any).isInitialized = false;
    (integrationService as any).config = null;
    (integrationService as any).googleCalendarConnector = null;
    (integrationService as any).outlookCalendarConnector = null;
  });

  describe('Google Calendar Integration', () => {
    test('should initialize with Google Calendar configuration', async () => {
      const config = {
        calendarSystem: {
          type: 'google' as const,
          apiKey: 'test-access-token',
          calendarId: 'primary'
        }
      };

      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.calendarSystemConnected).toBe(true);
    });

    test('should sync calendar events to Google Calendar', async () => {
      const config = {
        calendarSystem: {
          type: 'google' as const,
          apiKey: 'test-access-token',
          calendarId: 'primary'
        }
      };

      await integrationService.initialize(config);
      const result = await integrationService.syncCalendarEvents(mockCalendarEvents);
      
      expect(result).toBe(true);
    });

    test('should create a deadline event in Google Calendar', async () => {
      const config = {
        calendarSystem: {
          type: 'google' as const,
          apiKey: 'test-access-token',
          calendarId: 'primary'
        }
      };

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
        caseId: 'case-458',
        clientId: 'client-125',
        eventType: 'deadline',
        priority: 'urgent',
        status: 'confirmed'
      };

      await integrationService.initialize(config);
      const eventId = await integrationService.createCalendarEvent(deadlineEvent);
      
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });
  });

  describe('Outlook Calendar Integration', () => {
    test('should initialize with Outlook Calendar configuration', async () => {
      const config = {
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

      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.calendarSystemConnected).toBe(true);
    });

    test('should sync calendar events to Outlook Calendar', async () => {
      const config = {
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

      await integrationService.initialize(config);
      const result = await integrationService.syncCalendarEvents(mockCalendarEvents);
      
      expect(result).toBe(true);
    });
  });

  describe('Event Update Functionality', () => {
    test('should update an existing calendar event', async () => {
      const config = {
        calendarSystem: {
          type: 'google' as const,
          apiKey: 'test-access-token',
          calendarId: 'primary'
        }
      };

      await integrationService.initialize(config);
      
      // First create an event
      const eventId = await integrationService.createCalendarEvent(mockCalendarEvents[0]);
      
      // Then update it
      const result = await integrationService.updateCalendarEvent(eventId, {
        title: 'Aktualisierter Verhandlungstermin',
        description: 'Verschobener Verhandlungstermin im Mietrechtstreit'
      });
      
      expect(result).toBe(true);
    });
  });
});