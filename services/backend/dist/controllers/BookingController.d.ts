import { Request, Response, NextFunction } from 'express';
export declare class BookingController {
    /**
     * POST /api/bookings
     * Erstellt eine neue Buchung
     */
    static createBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/bookings/:id
     * Holt Buchungsdetails
     */
    static getBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/bookings
     * Listet alle Buchungen des Nutzers
     */
    static getUserBookings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/bookings/:id/confirm
     * Bestätigt eine Buchung (Anwalt)
     */
    static confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/bookings/:id/cancel
     * Storniert eine Buchung
     */
    static cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/bookings/:id/complete
     * Markiert Buchung als abgeschlossen (Anwalt)
     */
    static completeBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/bookings/:id/transfer-data
     * Überträgt Falldaten an Anwalt
     */
    static transferConsultationData(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/bookings/:id/case-data
     * Holt übertragene Falldaten (Anwalt)
     */
    static getCaseData(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/bookings/:id/start-consultation
     * Startet eine Konsultations-Session
     */
    static startConsultation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/bookings/:id/end-consultation
     * Beendet eine Konsultations-Session
     */
    static endConsultation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/lawyers/:lawyerId/available-slots
     * Holt verfügbare Zeitslots für einen Anwalt
     */
    static getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/lawyers/:lawyerId/time-slots
     * Erstellt Zeitslots für einen Anwalt
     */
    static createTimeSlots(req: Request, res: Response, next: NextFunction): Promise<void>;
}
