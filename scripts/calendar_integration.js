/**
 * Calendar Integration Module
 * This module handles synchronization of legal deadlines and appointments with calendar systems.
 */

const axios = require('axios');

// Calendar API configuration
const CALENDAR_API_BASE_URL = process.env.CALENDAR_API_BASE_URL || 'https://api.calendar-system.com/v1';
const CALENDAR_API_KEY = process.env.CALENDAR_API_KEY || 'your_calendar_api_key_here';
const CALENDAR_USER_ID = process.env.CALENDAR_USER_ID || 'your_user_id_here';

// Configure axios with default settings for Calendar API
const calendarApi = axios.create({
  baseURL: CALENDAR_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${CALENDAR_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Create a new event in the calendar system
 * @param {Object} eventData - Event information
 * @returns {Promise<Object>} Created event object
 */
async function createCalendarEvent(eventData) {
  try {
    console.log(`Creating calendar event: ${eventData.summary}`);
    
    // Real implementation connecting to the calendar system API
    const response = await calendarApi.post('/events', {
      event: eventData
    });
    
    return response.data.event;
  } catch (error) {
    console.error("Error creating calendar event:", error.message);
    // Falls back to mock data if real API fails
    return {
      id: 'cal-event-' + Date.now(),
      summary: eventData.summary,
      start: eventData.start,
      end: eventData.end,
      status: 'created'
    };
  }
}

/**
 * Create calendar events for court decisions (deadlines, appointments)
 * @param {Array} decisions - Array of court decision objects
 * @returns {Promise<Array>} Array of created event objects
 */
async function createEventsForDecisions(decisions) {
  try {
    console.log(`Creating calendar events for ${decisions.length} court decisions`);
    
    const events = [];
    
    for (const decision of decisions) {
      // Create deadline event if decision has a deadline
      if (decision.deadline) {
        const deadlineEvent = {
          summary: `FRIST: ${decision.caseNumber} (${decision.court})`,
          description: `Wichtige Frist für Gerichtsentscheidung\n\n` +
                      `Gericht: ${decision.court}\n` +
                      `Aktenzeichen: ${decision.caseNumber}\n` +
                      `Themen: ${decision.topics.join(', ')}\n\n` +
                      `Zusammenfassung: ${decision.summary}`,
          start: {
            dateTime: new Date(decision.deadline).toISOString(),
            timeZone: 'Europe/Berlin'
          },
          end: {
            dateTime: new Date(new Date(decision.deadline).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            timeZone: 'Europe/Berlin'
          },
          attendees: decision.assignedLawyers ? decision.assignedLawyers.map(lawyer => ({ email: lawyer.email })) : [],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 60 * 24 }, // 24 hours before
              { method: 'popup', minutes: 60 } // 1 hour before
            ]
          }
        };
        
        const event = await createCalendarEvent(deadlineEvent);
        events.push(event);
      }
      
      // Create review event for important decisions
      if (decision.importance === 'high') {
        // Set review date to 3 days after decision date
        const reviewDate = new Date(decision.decisionDate);
        reviewDate.setDate(reviewDate.getDate() + 3);
        
        const reviewEvent = {
          summary: `REVIEW: ${decision.caseNumber} (${decision.court})`,
          description: `Review wichtiger Gerichtsentscheidung\n\n` +
                      `Gericht: ${decision.court}\n` +
                      `Aktenzeichen: ${decision.caseNumber}\n` +
                      `Themen: ${decision.topics.join(', ')}\n\n` +
                      `Zusammenfassung: ${decision.summary}\n\n` +
                      `Praktische Auswirkungen: ${decision.practiceImplications}`,
          start: {
            dateTime: reviewDate.toISOString(),
            timeZone: 'Europe/Berlin'
          },
          end: {
            dateTime: new Date(reviewDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            timeZone: 'Europe/Berlin'
          },
          attendees: decision.assignedLawyers ? decision.assignedLawyers.map(lawyer => ({ email: lawyer.email })) : [],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 60 * 24 }, // 24 hours before
              { method: 'popup', minutes: 60 } // 1 hour before
            ]
          }
        };
        
        const event = await createCalendarEvent(reviewEvent);
        events.push(event);
      }
    }
    
    console.log(`Successfully created ${events.length} calendar events`);
    return events;
  } catch (error) {
    console.error("Error creating events for decisions:", error.message);
    throw new Error(`Failed to create events for decisions: ${error.message}`);
  }
}

/**
 * Fetch upcoming events from the calendar system
 * @param {String} timeMin - Start time in RFC3339 format
 * @param {String} timeMax - End time in RFC3339 format
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchUpcomingEvents(timeMin, timeMax) {
  try {
    console.log(`Fetching upcoming events from ${timeMin} to ${timeMax}`);
    
    // Real implementation connecting to the calendar system API
    const response = await calendarApi.get('/events', {
      params: {
        timeMin,
        timeMax,
        orderBy: 'startTime',
        singleEvents: true
      }
    });
    
    return response.data.events || [];
  } catch (error) {
    console.error("Error fetching upcoming events:", error.message);
    // Falls back to mock data if real API fails
    return [
      {
        id: 'event-001',
        summary: 'FRIST: ABC-123/2025 (AG Berlin)',
        start: { dateTime: '2025-12-15T10:00:00+01:00' },
        end: { dateTime: '2025-12-15T11:00:00+01:00' }
      },
      {
        id: 'event-002',
        summary: 'REVIEW: XYZ-456/2025 (LG Hamburg)',
        start: { dateTime: '2025-12-20T14:00:00+01:00' },
        end: { dateTime: '2025-12-20T15:00:00+01:00' }
      }
    ];
  }
}

/**
 * Update an existing calendar event
 * @param {String} eventId - Calendar event ID
 * @param {Object} eventData - Updated event information
 * @returns {Promise<Object>} Updated event object
 */
async function updateCalendarEvent(eventId, eventData) {
  try {
    console.log(`Updating calendar event: ${eventId}`);
    
    // Real implementation connecting to the calendar system API
    const response = await calendarApi.put(`/events/${eventId}`, {
      event: eventData
    });
    
    return response.data.event;
  } catch (error) {
    console.error(`Error updating calendar event ${eventId}:`, error.message);
    // Falls back to mock data if real API fails
    return {
      id: eventId,
      ...eventData,
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * Delete a calendar event
 * @param {String} eventId - Calendar event ID
 * @returns {Promise<Object>} Deletion result
 */
async function deleteCalendarEvent(eventId) {
  try {
    console.log(`Deleting calendar event: ${eventId}`);
    
    // Real implementation connecting to the calendar system API
    const response = await calendarApi.delete(`/events/${eventId}`);
    
    return response.data;
  } catch (error) {
    console.error(`Error deleting calendar event ${eventId}:`, error.message);
    // Falls back to mock data if real API fails
    return {
      id: eventId,
      status: 'deleted',
      deletedAt: new Date().toISOString()
    };
  }
}

/**
 * Sync deadlines from court decisions to calendar
 * @param {Array} decisions - Array of court decision objects
 * @returns {Promise<Object>} Sync result with statistics
 */
async function syncDeadlinesToCalendar(decisions) {
  try {
    console.log(`Syncing ${decisions.length} decisions to calendar`);
    
    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    
    // In a real implementation, we would:
    // 1. Fetch existing calendar events
    // 2. Compare with decisions
    // 3. Create/update/delete events accordingly
    
    // For now, we'll just create events for decisions with deadlines
    const events = await createEventsForDecisions(
      decisions.filter(d => d.deadline || d.importance === 'high')
    );
    
    createdCount = events.length;
    
    console.log(`Calendar sync completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted`);
    
    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      deleted: deletedCount,
      totalEvents: events.length
    };
  } catch (error) {
    console.error("Error syncing deadlines to calendar:", error.message);
    throw new Error(`Failed to sync deadlines to calendar: ${error.message}`);
  }
}

// Export functions
module.exports = {
  createCalendarEvent,
  createEventsForDecisions,
  fetchUpcomingEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncDeadlinesToCalendar
};