/**
 * Outlook Calendar Connector
 * 
 * This connector handles integration with Microsoft Outlook Calendar through the Microsoft Graph API.
 * It provides methods for syncing deadlines and events to Outlook Calendar.
 */

import axios, { AxiosInstance } from 'axios';
import { CalendarEvent } from '../integrations';

// Outlook Calendar API configuration
export interface OutlookCalendarConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  calendarId?: string;
  apiUrl?: string;
}

// Microsoft Graph API response types
interface OutlookApiResponse {
  value?: any[];
  error?: {
    code: string;
    message: string;
  };
}

interface OutlookEvent {
  id: string;
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
    type: string;
  }>;
  isAllDay: boolean;
  categories?: string[];
}

/**
 * Outlook Calendar Connector Class
 */
export class OutlookCalendarConnector {
  private client: AxiosInstance;
  private config: OutlookCalendarConfig;
  private calendarId: string;

  /**
   * Constructor
   * @param config Outlook Calendar API configuration
   */
  constructor(config: OutlookCalendarConfig) {
    this.config = config;
    this.calendarId = config.calendarId || 'primary';
    
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://graph.microsoft.com/v1.0',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Token might be expired, try to refresh
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            // Retry the original request with new token
            error.config.headers['Authorization'] = `Bearer ${newToken}`;
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
      
      const response = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const newToken = response.data.access_token;
      this.config.accessToken = newToken;
      
      // Update the authorization header for future requests
      this.client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return newToken;
    } catch (error) {
      console.error('Failed to refresh Outlook access token:', error);
      return null;
    }
  }

  /**
   * Test connection to Outlook Calendar API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get(`/me/calendars/${this.calendarId}`);
      return true;
    } catch (error) {
      console.error('Outlook Calendar connection test failed:', error);
      return false;
    }
  }

  /**
   * Convert our internal calendar event to Outlook event format
   */
  private convertToOutlookEvent(event: CalendarEvent): Partial<OutlookEvent> {
    const outlookEvent: Partial<OutlookEvent> = {
      subject: event.title,
      start: {
        dateTime: event.startDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      isAllDay: event.isAllDay || false,
      categories: []
    };

    // Add description if available
    if (event.description) {
      outlookEvent.body = {
        contentType: 'text',
        content: event.description
      };
    }

    // Add location if available
    if (event.location) {
      outlookEvent.location = {
        displayName: event.location
      };
    }

    // Add attendees if available
    if (event.attendees && event.attendees.length > 0) {
      outlookEvent.attendees = event.attendees.map(email => ({
        emailAddress: {
          address: email,
          name: email.split('@')[0]
        },
        type: 'required'
      }));
    }

    // Add categories based on event type and priority
    if (event.eventType) {
      outlookEvent.categories!.push(event.eventType);
    }
    
    if (event.priority) {
      outlookEvent.categories!.push(`priority-${event.priority}`);
    }
    
    // Special handling for deadlines
    if (event.eventType === 'deadline') {
      outlookEvent.categories!.push('Deadline');
      // Set reminder for deadlines
      if (!event.reminderMinutes) {
        event.reminderMinutes = 1440; // 24 hours default for deadlines
      }
    }

    return outlookEvent;
  }

  /**
   * Convert Outlook event to our internal calendar event format
   */
  private convertFromOutlookEvent(outlookEvent: OutlookEvent): CalendarEvent {
    return {
      id: outlookEvent.id,
      title: outlookEvent.subject,
      description: outlookEvent.body?.content,
      startTime: outlookEvent.start.dateTime,
      endTime: outlookEvent.end.dateTime,
      startDate: outlookEvent.start.dateTime,
      endDate: outlookEvent.end.dateTime,
      location: outlookEvent.location?.displayName,
      attendees: outlookEvent.attendees?.map(att => att.emailAddress.address) || [],
      isAllDay: outlookEvent.isAllDay,
      eventType: this.determineEventType(outlookEvent.categories),
      priority: this.determinePriority(outlookEvent.categories),
      status: 'confirmed'
    };
  }

  /**
   * Determine event type from categories
   */
  private determineEventType(categories?: string[]): CalendarEvent['eventType'] {
    if (!categories || categories.length === 0) return 'other';
    
    if (categories.includes('deadline') || categories.includes('Deadline')) return 'deadline';
    if (categories.includes('court_date')) return 'court_hearing';
    if (categories.includes('court_hearing')) return 'court_hearing';
    if (categories.includes('meeting')) return 'meeting';
    if (categories.includes('conference')) return 'meeting';
    
    return 'other';
  }

  /**
   * Determine priority from categories
   */
  private determinePriority(categories?: string[]): CalendarEvent['priority'] {
    if (!categories || categories.length === 0) return 'normal';
    
    for (const category of categories) {
      if (category.startsWith('priority-')) {
        const priority = category.split('-')[1];
        if (['low', 'normal', 'high', 'urgent'].includes(priority)) {
          return priority as CalendarEvent['priority'];
        }
      }
    }
    
    return 'normal';
  }

  /**
   * Sync calendar events to Outlook Calendar
   * @param events Array of calendar events to sync
   * @returns Boolean indicating success
   */
  async syncEvents(events: CalendarEvent[]): Promise<boolean> {
    try {
      let successCount = 0;

      // Process events in batches to avoid API limits
      const batchSize = 10;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        // Handle each event
        for (const event of batch) {
          let result = false;
          
          if (event.id) {
            // Update existing event
            result = await this.updateEvent(event.id, event);
          } else {
            // Create new event
            result = await this.createEvent(event);
          }
          
          if (result) {
            successCount++;
          }
        }
      }

      console.log(`Successfully synced ${successCount} out of ${events.length} events to Outlook Calendar`);
      return successCount > 0;
    } catch (error) {
      console.error('Outlook Calendar event sync failed:', error);
      throw error;
    }
  }

  /**
   * Create a new event in Outlook Calendar
   * @param event Calendar event to create
   * @returns Boolean indicating success
   */
  async createEvent(event: CalendarEvent): Promise<boolean> {
    try {
      const outlookEvent = this.convertToOutlookEvent(event);
      
      const response = await this.client.post<OutlookEvent>(
        `/me/calendars/${this.calendarId}/events`,
        outlookEvent
      );

      if (response.data.id) {
        console.log(`Successfully created Outlook event ${response.data.id}`);
        return true;
      } else {
        console.error('Outlook event creation failed: No ID returned');
        return false;
      }
    } catch (error) {
      console.error('Outlook event creation failed:', error);
      return false;
    }
  }

  /**
   * Update an existing event in Outlook Calendar
   * @param eventId ID of the event to update
   * @param eventData Partial event data to update
   * @returns Boolean indicating success
   */
  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<boolean> {
    try {
      // For simplicity, we'll patch the event with the available data
      // In a production environment, you might want to fetch the full event first
      const outlookEventData: any = {};
      
      if (eventData.title) outlookEventData.subject = eventData.title;
      if (eventData.description) {
        outlookEventData.body = {
          contentType: 'text',
          content: eventData.description
        };
      }
      if (eventData.startDate) {
        outlookEventData.start = {
          dateTime: eventData.startDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      }
      if (eventData.endDate) {
        outlookEventData.end = {
          dateTime: eventData.endDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      }
      if (eventData.location) {
        outlookEventData.location = {
          displayName: eventData.location
        };
      }

      const response = await this.client.patch<OutlookEvent>(
        `/me/calendars/${this.calendarId}/events/${eventId}`,
        outlookEventData
      );

      if (response.data.id) {
        console.log(`Successfully updated Outlook event ${response.data.id}`);
        return true;
      } else {
        console.error('Outlook event update failed: No ID returned');
        return false;
      }
    } catch (error) {
      console.error('Outlook event update failed:', error);
      return false;
    }
  }

  /**
   * Get events from Outlook Calendar
   * @param startDate Start date for fetching events (ISO format)
   * @param endDate End date for fetching events (ISO format)
   * @returns Array of calendar events
   */
  async getEvents(startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDateTime', startDate);
      }
      
      if (endDate) {
        params.append('endDateTime', endDate);
      }
      
      // Always include these parameters for better results
      params.append('$top', '100'); // Limit to 100 events
      params.append('orderby', 'start/dateTime');

      const response = await this.client.get<OutlookApiResponse>(
        `/me/calendars/${this.calendarId}/events?${params.toString()}`
      );

      if (response.data.value) {
        // Transform Outlook events to our internal format
        const events: CalendarEvent[] = response.data.value.map((outlookEvent: OutlookEvent) => 
          this.convertFromOutlookEvent(outlookEvent)
        );

        console.log(`Successfully fetched ${events.length} events from Outlook Calendar`);
        return events;
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch events from Outlook Calendar');
      }
    } catch (error) {
      console.error('Outlook Calendar event fetch failed:', error);
      throw error;
    }
  }

  /**
   * Create a special deadline event with advanced features
   * @param event Calendar event representing a deadline
   * @returns ID of created event
   */
  async createDeadlineEvent(event: CalendarEvent): Promise<string> {
    try {
      // Ensure this is treated as a deadline
      event.eventType = 'deadline';
      
      // Set default reminder if not specified
      if (!event.reminderMinutes) {
        event.reminderMinutes = 1440; // 24 hours
      }
      
      const outlookEvent = this.convertToOutlookEvent(event);
      
      // Add special deadline properties
      if (!outlookEvent.categories) {
        outlookEvent.categories = [];
      }
      outlookEvent.categories.push('Legal Deadline', 'Important');
      
      const response = await this.client.post<OutlookEvent>(
        `/me/calendars/${this.calendarId}/events`,
        outlookEvent
      );

      if (response.data.id) {
        console.log(`Successfully created deadline event ${response.data.id} in Outlook Calendar`);
        return response.data.id;
      } else {
        throw new Error('Failed to create deadline event: No ID returned');
      }
    } catch (error) {
      console.error('Outlook deadline event creation failed:', error);
      throw error;
    }
  }
}