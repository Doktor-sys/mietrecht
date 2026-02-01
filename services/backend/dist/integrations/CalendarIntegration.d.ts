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
export declare class CalendarIntegration {
    private apiClient;
    private baseUrl;
    private accessToken;
    constructor(baseUrl: string, accessToken: string);
    /**
     * Holt alle Kalender des Benutzers
     */
    getCalendars(): Promise<Calendar[]>;
    /**
     * Holt einen bestimmten Kalender anhand seiner ID
     */
    getCalendarById(calendarId: string): Promise<Calendar>;
    /**
     * Holt alle Ereignisse aus einem bestimmten Kalender
     */
    getEvents(calendarId: string, timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]>;
    /**
     * Holt ein bestimmtes Ereignis anhand seiner ID
     */
    getEventById(calendarId: string, eventId: string): Promise<CalendarEvent>;
    /**
     * Erstellt ein neues Ereignis in einem Kalender
     */
    createEvent(calendarId: string, eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent>;
    /**
     * Aktualisiert ein bestehendes Ereignis
     */
    updateEvent(calendarId: string, eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent>;
    /**
     * Löscht ein Ereignis
     */
    deleteEvent(calendarId: string, eventId: string): Promise<void>;
    /**
     * Sucht nach Ereignissen basierend auf einem Suchbegriff
     */
    searchEvents(query: string, calendarId?: string): Promise<CalendarEvent[]>;
    /**
     * Erstellt eine wiederkehrende Erinnerung für Fristen
     */
    createDeadlineReminder(deadline: Date, title: string, description: string): Promise<CalendarEvent>;
    /**
     * Synchronisiert Termine zwischen SmartLaw und dem Kalendersystem
     */
    syncEvents(): Promise<void>;
    /**
     * Holt die nächsten Termine des Benutzers
     */
    getUpcomingEvents(days?: number): Promise<CalendarEvent[]>;
}
export {};
