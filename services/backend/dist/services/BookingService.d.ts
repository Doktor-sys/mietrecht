import { PrismaClient, Booking, BookingStatus, MeetingType } from '@prisma/client';
export interface BookingRequest {
    userId: string;
    lawyerId: string;
    timeSlotId: string;
    meetingType: MeetingType;
    notes?: string;
}
export interface BookingDetails extends Booking {
    lawyer: {
        id: string;
        name: string;
        email: string;
        specializations: string[];
        location: string;
    };
    timeSlot: {
        id: string;
        startTime: Date;
        endTime: Date;
    };
    user: {
        id: string;
        email: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
}
export interface ConsultationData {
    caseId?: string;
    documents?: string[];
    summary: string;
    legalReferences?: Array<{
        type: string;
        reference: string;
        title: string;
    }>;
}
export declare class BookingService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Erstellt eine neue Buchung
     */
    createBooking(request: BookingRequest): Promise<BookingDetails>;
    /**
     * Holt Buchungsdetails
     */
    getBooking(bookingId: string, userId: string): Promise<BookingDetails>;
    /**
     * Listet alle Buchungen eines Nutzers
     */
    getUserBookings(userId: string, status?: BookingStatus): Promise<BookingDetails[]>;
    /**
     * Bestätigt eine Buchung (durch Anwalt)
     */
    confirmBooking(bookingId: string, lawyerId: string): Promise<BookingDetails>;
    /**
     * Storniert eine Buchung
     */
    cancelBooking(bookingId: string, userId: string): Promise<void>;
    /**
     * Markiert Buchung als abgeschlossen
     */
    completeBooking(bookingId: string, lawyerId: string): Promise<void>;
    /**
     * Überträgt Falldaten an Anwalt
     */
    transferConsultationData(bookingId: string, userId: string, data: ConsultationData): Promise<void>;
    /**
     * Holt verfügbare Zeitslots für einen Anwalt
     */
    getAvailableSlots(lawyerId: string, startDate: Date, endDate: Date): Promise<Array<{
        id: string;
        startTime: Date;
        endTime: Date;
    }>>;
    /**
     * Erstellt Zeitslots für einen Anwalt
     */
    createTimeSlots(lawyerId: string, slots: Array<{
        startTime: Date;
        endTime: Date;
    }>): Promise<void>;
}
