import { Request, Response, NextFunction } from 'express';
import { PrismaClient, MeetingType, BookingStatus } from '@prisma/client';
import { BookingService } from '../services/BookingService';
import { ConsultationService } from '../services/ConsultationService';
import { ValidationError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const bookingService = new BookingService(prisma);
const consultationService = new ConsultationService(prisma);

export class BookingController {
  /**
   * POST /api/bookings
   * Erstellt eine neue Buchung
   */
  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      const { lawyerId, timeSlotId, meetingType, notes } = req.body;

      if (!lawyerId || !timeSlotId || !meetingType) {
        throw new ValidationError('Fehlende erforderliche Felder');
      }

      if (!Object.values(MeetingType).includes(meetingType)) {
        throw new ValidationError('Ungültiger Meeting-Typ');
      }

      const booking = await bookingService.createBooking({
        userId,
        lawyerId,
        timeSlotId,
        meetingType,
        notes
      });

      // Erstelle Video-Meeting wenn VIDEO
      if (meetingType === MeetingType.VIDEO) {
        const videoMeeting = await consultationService.createVideoMeeting(
          booking.id,
          'jitsi'
        );
        
        res.status(201).json({
          success: true,
          data: {
            ...booking,
            videoMeeting
          }
        });
      } else {
        res.status(201).json({
          success: true,
          data: booking
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id
   * Holt Buchungsdetails
   */
  static async getBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      const { id } = req.params;
      const booking = await bookingService.getBooking(id, userId);

      // Hole Video-Meeting-Details wenn vorhanden
      let videoMeeting = null;
      if (booking.meetingType === MeetingType.VIDEO) {
        videoMeeting = await consultationService.getVideoMeeting(id, userId);
      }

      res.json({
        success: true,
        data: {
          ...booking,
          videoMeeting
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings
   * Listet alle Buchungen des Nutzers
   */
  static async getUserBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      const { status } = req.query;
      
      let bookingStatus: BookingStatus | undefined;
      if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
        bookingStatus = status as BookingStatus;
      }

      const bookings = await bookingService.getUserBookings(userId, bookingStatus);

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/confirm
   * Bestätigt eine Buchung (Anwalt)
   */
  static async confirmBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      // Hole Anwalts-ID basierend auf User-Email
      const lawyer = await prisma.lawyer.findUnique({
        where: { email: req.user!.email }
      });

      if (!lawyer) {
        throw new ValidationError('Nur Anwälte können Buchungen bestätigen');
      }

      const { id } = req.params;
      const booking = await bookingService.confirmBooking(id, lawyer.id);

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/cancel
   * Storniert eine Buchung
   */
  static async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      const { id } = req.params;
      await bookingService.cancelBooking(id, userId);

      res.json({
        success: true,
        message: 'Buchung erfolgreich storniert'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/complete
   * Markiert Buchung als abgeschlossen (Anwalt)
   */
  static async completeBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      // Hole Anwalts-ID basierend auf User-Email
      const lawyer = await prisma.lawyer.findUnique({
        where: { email: req.user!.email }
      });

      if (!lawyer) {
        throw new ValidationError('Nur Anwälte können Buchungen abschließen');
      }

      const { id } = req.params;
      await bookingService.completeBooking(id, lawyer.id);

      res.json({
        success: true,
        message: 'Buchung erfolgreich abgeschlossen'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/transfer-data
   * Überträgt Falldaten an Anwalt
   */
  static async transferConsultationData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      const { id } = req.params;
      const { caseId, documents, summary, legalReferences } = req.body;

      if (!summary) {
        throw new ValidationError('Zusammenfassung ist erforderlich');
      }

      // Wenn caseId vorhanden, übertrage vollständige Falldaten
      if (caseId) {
        await consultationService.transferSecureCaseData(id, userId, caseId);
      } else {
        // Sonst übertrage manuelle Daten
        await bookingService.transferConsultationData(id, userId, {
          caseId,
          documents,
          summary,
          legalReferences
        });
      }

      res.json({
        success: true,
        message: 'Daten erfolgreich übertragen'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id/case-data
   * Holt übertragene Falldaten (Anwalt)
   */
  static async getCaseData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      // Hole Anwalts-ID basierend auf User-Email
      const lawyer = await prisma.lawyer.findUnique({
        where: { email: req.user!.email }
      });

      if (!lawyer) {
        throw new ValidationError('Nur Anwälte können Falldaten abrufen');
      }

      const { id } = req.params;
      const caseData = await consultationService.getCaseDataForLawyer(id, lawyer.id);

      res.json({
        success: true,
        data: caseData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/start-consultation
   * Startet eine Konsultations-Session
   */
  static async startConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      const { id } = req.params;
      const session = await consultationService.startConsultation(id, userId);

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/end-consultation
   * Beendet eine Konsultations-Session
   */
  static async endConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      const { id } = req.params;
      const { notes } = req.body;

      await consultationService.endConsultation(id, userId, notes);

      res.json({
        success: true,
        message: 'Konsultation erfolgreich beendet'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lawyers/:lawyerId/available-slots
   * Holt verfügbare Zeitslots für einen Anwalt
   */
  static async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { lawyerId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Start- und Enddatum sind erforderlich');
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('Ungültiges Datumsformat');
      }

      const slots = await bookingService.getAvailableSlots(lawyerId, start, end);

      res.json({
        success: true,
        data: slots
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/lawyers/:lawyerId/time-slots
   * Erstellt Zeitslots für einen Anwalt
   */
  static async createTimeSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('Benutzer nicht authentifiziert');
      }

      // Hole Anwalts-ID basierend auf User-Email
      const lawyer = await prisma.lawyer.findUnique({
        where: { email: req.user!.email }
      });

      if (!lawyer) {
        throw new ValidationError('Nur Anwälte können Zeitslots erstellen');
      }

      const { slots } = req.body;

      if (!Array.isArray(slots) || slots.length === 0) {
        throw new ValidationError('Zeitslots müssen als Array angegeben werden');
      }

      // Validiere Slot-Format
      for (const slot of slots) {
        if (!slot.startTime || !slot.endTime) {
          throw new ValidationError('Jeder Slot muss startTime und endTime haben');
        }
      }

      // Konvertiere zu Date-Objekten
      const parsedSlots = slots.map(slot => ({
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime)
      }));

      await bookingService.createTimeSlots(lawyer.id, parsedSlots);

      res.status(201).json({
        success: true,
        message: `${slots.length} Zeitslots erfolgreich erstellt`
      });
    } catch (error) {
      next(error);
    }
  }
}
