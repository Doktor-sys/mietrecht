"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class CalendarIntegration {
    constructor(baseUrl, accessToken) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;
        this.apiClient = axios_1.default.create({
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
    async getCalendars() {
        try {
            const response = await this.apiClient.get('/calendars');
            return response.data.calendars;
        }
        catch (error) {
            logger_1.logger.error('Error fetching calendars:', error);
            throw new Error('Failed to fetch calendars');
        }
    }
    /**
     * Holt einen bestimmten Kalender anhand seiner ID
     */
    async getCalendarById(calendarId) {
        try {
            const response = await this.apiClient.get(`/calendars/${calendarId}`);
            return response.data.calendar;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching calendar ${calendarId}:`, error);
            throw new Error('Failed to fetch calendar');
        }
    }
    /**
     * Holt alle Ereignisse aus einem bestimmten Kalender
     */
    async getEvents(calendarId, timeMin, timeMax) {
        try {
            const params = {};
            if (timeMin)
                params.timeMin = timeMin.toISOString();
            if (timeMax)
                params.timeMax = timeMax.toISOString();
            const response = await this.apiClient.get(`/calendars/${calendarId}/events`, { params });
            return response.data.events;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching events from calendar ${calendarId}:`, error);
            throw new Error('Failed to fetch events');
        }
    }
    /**
     * Holt ein bestimmtes Ereignis anhand seiner ID
     */
    async getEventById(calendarId, eventId) {
        try {
            const response = await this.apiClient.get(`/calendars/${calendarId}/events/${eventId}`);
            return response.data.event;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching event ${eventId} from calendar ${calendarId}:`, error);
            throw new Error('Failed to fetch event');
        }
    }
    /**
     * Erstellt ein neues Ereignis in einem Kalender
     */
    async createEvent(calendarId, eventData) {
        try {
            const response = await this.apiClient.post(`/calendars/${calendarId}/events`, { event: eventData });
            return response.data.event;
        }
        catch (error) {
            logger_1.logger.error('Error creating event:', error);
            throw new Error('Failed to create event');
        }
    }
    /**
     * Aktualisiert ein bestehendes Ereignis
     */
    async updateEvent(calendarId, eventId, eventData) {
        try {
            const response = await this.apiClient.patch(`/calendars/${calendarId}/events/${eventId}`, { event: eventData });
            return response.data.event;
        }
        catch (error) {
            logger_1.logger.error(`Error updating event ${eventId} in calendar ${calendarId}:`, error);
            throw new Error('Failed to update event');
        }
    }
    /**
     * Löscht ein Ereignis
     */
    async deleteEvent(calendarId, eventId) {
        try {
            await this.apiClient.delete(`/calendars/${calendarId}/events/${eventId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error);
            throw new Error('Failed to delete event');
        }
    }
    /**
     * Sucht nach Ereignissen basierend auf einem Suchbegriff
     */
    async searchEvents(query, calendarId) {
        try {
            const params = { q: query };
            if (calendarId)
                params.calendarId = calendarId;
            const response = await this.apiClient.get('/events/search', { params });
            return response.data.events;
        }
        catch (error) {
            logger_1.logger.error('Error searching events:', error);
            throw new Error('Failed to search events');
        }
    }
    /**
     * Erstellt eine wiederkehrende Erinnerung für Fristen
     */
    async createDeadlineReminder(deadline, title, description) {
        try {
            // Berechne Erinnerungszeiten (1 Woche, 3 Tage, 1 Tag vorher)
            const reminders = [
                { method: 'email', minutes: 7 * 24 * 60 }, // 1 Woche vorher
                { method: 'email', minutes: 3 * 24 * 60 }, // 3 Tage vorher
                { method: 'popup', minutes: 1 * 24 * 60 } // 1 Tag vorher
            ];
            const eventData = {
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
        }
        catch (error) {
            logger_1.logger.error('Error creating deadline reminder:', error);
            throw new Error('Failed to create deadline reminder');
        }
    }
    /**
     * Synchronisiert Termine zwischen SmartLaw und dem Kalendersystem
     */
    async syncEvents() {
        try {
            // In einer echten Implementierung würden wir hier die Termine synchronisieren
            logger_1.logger.info('Event synchronization with calendar system initiated');
        }
        catch (error) {
            logger_1.logger.error('Error synchronizing events with calendar system:', error);
            throw new Error('Failed to synchronize events');
        }
    }
    /**
     * Holt die nächsten Termine des Benutzers
     */
    async getUpcomingEvents(days = 7) {
        try {
            const now = new Date();
            const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            // Holen Sie sich Ereignisse aus allen Kalendern
            const calendars = await this.getCalendars();
            let allEvents = [];
            for (const calendar of calendars) {
                const events = await this.getEvents(calendar.id, now, future);
                allEvents = [...allEvents, ...events];
            }
            // Sortieren nach Startzeit
            allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
            return allEvents;
        }
        catch (error) {
            logger_1.logger.error('Error fetching upcoming events:', error);
            throw new Error('Failed to fetch upcoming events');
        }
    }
}
exports.CalendarIntegration = CalendarIntegration;
