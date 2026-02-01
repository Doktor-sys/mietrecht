import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  attendees: Attendee[];
  reminders: Reminder[];
  recurrence?: RecurrenceRule;
  createdAt: Date;
  updatedAt: Date;
}

interface Attendee {
  email: string;
  name?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
}

interface Reminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;
}

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
}

interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
}

export class CalendarIntegration {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Holt alle Kalender des Benutzers
   */
  async getCalendars(): Promise<Calendar[]> {
    try {
      const response = await this.apiClient.get('/calendars');
      return response.data.calendars;
    } catch (error) {
      logger.error('Error fetching calendars:', error);
      throw new Error('Failed to fetch calendars');
    }
  }

  /**
   * Holt einen bestimmten Kalender anhand seiner ID
   */
  async getCalendarById(calendarId: string): Promise<Calendar> {
    try {
      const response = await this.apiClient.get(`/calendars/${calendarId}`);
      return response.data.calendar;
    } catch (error) {
      logger.error(`Error fetching calendar ${calendarId}:`, error);
      throw new Error('Failed to fetch calendar');
    }
  }

  /**
   * Holt alle Ereignisse aus einem bestimmten Kalender
   */
  async getEvents(calendarId: string, timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
    try {
      const params: any = {};
      if (timeMin) params.timeMin = timeMin.toISOString();
      if (timeMax) params.timeMax = timeMax.toISOString();
      
      const response = await this.apiClient.get(`/calendars/${calendarId}/events`, { params });
      return response.data.events;
    } catch (error) {
      logger.error(`Error fetching events from calendar ${calendarId}:`, error);
      throw new Error('Failed to fetch events');
    }
  }

  /**
   * Holt ein bestimmtes Ereignis anhand seiner ID
   */
  async getEventById(calendarId: string, eventId: string): Promise<CalendarEvent> {
    try {
      const response = await this.apiClient.get(`/calendars/${calendarId}/events/${eventId}`);
      return response.data.event;
    } catch (error) {
      logger.error(`Error fetching event ${eventId} from calendar ${calendarId}:`, error);
      throw new Error('Failed to fetch event');
    }
  }

  /**
   * Erstellt ein neues Ereignis in einem Kalender
   */
  async createEvent(calendarId: string, eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    try {
      const response = await this.apiClient.post(`/calendars/${calendarId}/events`, { event: eventData });
      return response.data.event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  /**
   * Aktualisiert ein bestehendes Ereignis
   */
  async updateEvent(calendarId: string, eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const response = await this.apiClient.patch(`/calendars/${calendarId}/events/${eventId}`, { event: eventData });
      return response.data.event;
    } catch (error) {
      logger.error(`Error updating event ${eventId} in calendar ${calendarId}:`, error);
      throw new Error('Failed to update event');
    }
  }

  /**
   * Löscht ein Ereignis
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/calendars/${calendarId}/events/${eventId}`);
    } catch (error) {
      logger.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error);
      throw new Error('Failed to delete event');
    }
  }

  /**
   * Sucht nach Ereignissen basierend auf einem Suchbegriff
   */
  async searchEvents(query: string, calendarId?: string): Promise<CalendarEvent[]> {
    try {
      const params: any = { q: query };
      if (calendarId) params.calendarId = calendarId;
      
      const response = await this.apiClient.get('/events/search', { params });
      return response.data.events;
    } catch (error) {
      logger.error('Error searching events:', error);
      throw new Error('Failed to search events');
    }
  }

  /**
   * Erstellt eine wiederkehrende Erinnerung für Fristen
   */
  async createDeadlineReminder(deadline: Date, title: string, description: string): Promise<CalendarEvent> {
    try {
      // Berechne Erinnerungszeiten (1 Woche, 3 Tage, 1 Tag vorher)
      const reminders: Reminder[] = [
        { method: 'email', minutes: 7 * 24 * 60 }, // 1 Woche vorher
        { method: 'email', minutes: 3 * 24 * 60 }, // 3 Tage vorher
        { method: 'popup', minutes: 1 * 24 * 60 }  // 1 Tag vorher
      ];
      
      const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `[FRIST] ${title}`,
        description: description,
        start: deadline,
        end: new Date(deadline.getTime() + 60 * 60 * 1000), // 1 Stunde Ereignis
        attendees: [], // Leeres Array hinzugefügt
        reminders: reminders
      };
      
      // Verwende den primären Kalender des Benutzers
      const calendars = await this.getCalendars();
      const primaryCalendar = calendars.find(cal => cal.summary.toLowerCase().includes('primary')) || calendars[0];
      
      return await this.createEvent(primaryCalendar.id, eventData);
    } catch (error) {
      logger.error('Error creating deadline reminder:', error);
      throw new Error('Failed to create deadline reminder');
    }
  }

  /**
   * Synchronisiert Termine zwischen SmartLaw und dem Kalendersystem
   */
  async syncEvents(): Promise<void> {
    try {
      // In einer echten Implementierung würden wir hier die Termine synchronisieren
      logger.info('Event synchronization with calendar system initiated');
    } catch (error) {
      logger.error('Error synchronizing events with calendar system:', error);
      throw new Error('Failed to synchronize events');
    }
  }

  /**
   * Holt die nächsten Termine des Benutzers
   */
  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      // Holen Sie sich Ereignisse aus allen Kalendern
      const calendars = await this.getCalendars();
      let allEvents: CalendarEvent[] = [];
      
      for (const calendar of calendars) {
        const events = await this.getEvents(calendar.id, now, future);
        allEvents = [...allEvents, ...events];
      }
      
      // Sortieren nach Startzeit
      allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      
      return allEvents;
    } catch (error) {
      logger.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  }
}