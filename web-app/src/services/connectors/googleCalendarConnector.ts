/**
 * Google Calendar API Connector
 * 
 * This connector implements the integration with Google Calendar.
 * It handles authentication, data mapping, and API communication.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CalendarEvent } from '../integrations';

// Google Calendar API types
interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  status?: string;
  transparency?: string;
  visibility?: string;
  colorId?: string; // Add colorId property
}

interface GoogleCalendarList {
  items: Array<{
    id: string;
    summary: string;
    description?: string;
    timeZone?: string;
  }>;
}

// Configuration interface
export interface GoogleCalendarConfig {
  baseUrl: string;
  accessToken: string;
  calendarId?: string;
}

/**
 * Google Calendar Connector Class
 */
export class GoogleCalendarConnector {
  private client: AxiosInstance;
  private config: GoogleCalendarConfig;
  private calendarId: string;

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
    this.calendarId = config.calendarId || 'primary';
    
    // Initialize Axios client with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('Google Calendar API authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch all calendars from Google Calendar
   */
  async getCalendars(): Promise<GoogleCalendarList> {
    try {
      const response: AxiosResponse<GoogleCalendarList> = await this.client.get('/users/me/calendarList');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch calendars from Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Fetch events from Google Calendar
   */
  async getEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    try {
      const params: any = {
        calendarId: this.calendarId
      };
      
      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;
      
      const response: AxiosResponse<{ items: GoogleCalendarEvent[] }> = await this.client.get(
        `/calendars/${this.calendarId}/events`,
        { params }
      );
      
      return response.data.items;
    } catch (error) {
      console.error('Failed to fetch events from Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Create a new event in Google Calendar
   */
  async createEvent(eventData: GoogleCalendarEvent): Promise<string> {
    try {
      const response: AxiosResponse<GoogleCalendarEvent> = await this.client.post(
        `/calendars/${this.calendarId}/events`,
        eventData
      );
      
      return response.data.id || '';
    } catch (error) {
      console.error('Failed to create event in Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Update an existing event in Google Calendar
   */
  async updateEvent(eventId: string, eventData: Partial<GoogleCalendarEvent>): Promise<boolean> {
    try {
      await this.client.put(
        `/calendars/${this.calendarId}/events/${eventId}`,
        eventData
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update event in Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await this.client.delete(`/calendars/${this.calendarId}/events/${eventId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete event from Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Map internal calendar event to Google Calendar event format
   */
  mapInternalEventToGoogle(event: CalendarEvent): GoogleCalendarEvent {
    return {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: event.attendees?.map(email => ({ email })) || [],
      reminders: event.reminderMinutes !== undefined ? {
        useDefault: false,
        overrides: [{
          method: 'popup',
          minutes: event.reminderMinutes
        }]
      } : {
        useDefault: true
      },
      status: event.status === 'cancelled' ? 'cancelled' : 'confirmed'
    };
  }

  /**
   * Map Google Calendar event to internal calendar event format
   */
  mapGoogleEventToInternal(googleEvent: GoogleCalendarEvent): CalendarEvent {
    return {
      id: googleEvent.id || '',
      title: googleEvent.summary || '',
      description: googleEvent.description,
      location: googleEvent.location,
      startTime: googleEvent.start?.dateTime || googleEvent.start?.date || '',
      endTime: googleEvent.end?.dateTime || googleEvent.end?.date || '',
      startDate: googleEvent.start?.dateTime || googleEvent.start?.date || '',
      endDate: googleEvent.end?.dateTime || googleEvent.end?.date || '',
      attendees: googleEvent.attendees?.map(a => a.email) || [],
      reminderMinutes: googleEvent.reminders?.overrides?.[0]?.minutes,
      isAllDay: !!googleEvent.start?.date && !googleEvent.start?.dateTime,
      eventType: 'other', // Would need more context to determine specific type
      priority: 'normal',
      status: googleEvent.status === 'cancelled' ? 'cancelled' : 'confirmed'
    };
  }

  /**
   * Sync calendar events to Google Calendar
   */
  async syncEvents(events: CalendarEvent[]): Promise<boolean> {
    try {
      for (const event of events) {
        // Map internal event to Google format
        const googleEvent = this.mapInternalEventToGoogle(event);
        
        // Create event in Google Calendar
        await this.createEvent(googleEvent);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to sync events to Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Fetch and convert events to internal calendar events
   */
  async getCalendarEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      const googleEvents = await this.getEvents(timeMin, timeMax);
      return googleEvents.map(event => this.mapGoogleEventToInternal(event));
    } catch (error) {
      console.error('Failed to fetch calendar events from Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Create a deadline event in Google Calendar
   */
  async createDeadlineEvent(event: CalendarEvent): Promise<string> {
    try {
      // Set event properties specific to deadlines
      const googleEvent: GoogleCalendarEvent = {
        summary: `[FRIST] ${event.title}`,
        description: event.description,
        start: {
          dateTime: event.startDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.endDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [
            {
              method: 'popup',
              minutes: event.reminderMinutes || 60 // Default 1 hour reminder
            },
            {
              method: 'email',
              minutes: 1440 // 24 hours reminder
            }
          ]
        },
        colorId: '11', // Red color for deadlines
        transparency: 'opaque',
        visibility: 'private'
      };
      
      return await this.createEvent(googleEvent);
    } catch (error) {
      console.error('Failed to create deadline event in Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Test connection to Google Calendar API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/users/me/calendarList');
      return true;
    } catch (error) {
      console.error('Google Calendar connection test failed:', error);
      return false;
    }
  }
}

export default GoogleCalendarConnector;