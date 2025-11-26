import { PrismaClient, Booking, BookingStatus, MeetingType } from '@prisma/client';
import { logger, loggers } from '../utils/logger';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler';

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

export class BookingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Erstellt eine neue Buchung
   */
  async createBooking(request: BookingRequest): Promise<BookingDetails> {
    try {
      logger.info('Creating booking', { request });

      // Validiere TimeSlot
      const timeSlot = await this.prisma.timeSlot.findUnique({
        where: { id: request.timeSlotId },
        include: {
          lawyer: true,
          booking: true
        }
      });

      if (!timeSlot) {
        throw new NotFoundError('Zeitslot nicht gefunden');
      }

      if (!timeSlot.available) {
        throw new ConflictError('Zeitslot ist nicht verfügbar');
      }

      if (timeSlot.booking) {
        throw new ConflictError('Zeitslot ist bereits gebucht');
      }

      if (timeSlot.lawyerId !== request.lawyerId) {
        throw new ValidationError('Zeitslot gehört nicht zum angegebenen Anwalt');
      }

      // Prüfe ob Zeitslot in der Zukunft liegt
      if (timeSlot.startTime < new Date()) {
        throw new ValidationError('Zeitslot liegt in der Vergangenheit');
      }

      // Erstelle Buchung in Transaction
      const booking = await this.prisma.$transaction(async (tx) => {
        // Erstelle Buchung
        const newBooking = await tx.booking.create({
          data: {
            userId: request.userId,
            lawyerId: request.lawyerId,
            timeSlotId: request.timeSlotId,
            meetingType: request.meetingType,
            notes: request.notes,
            status: BookingStatus.PENDING
          },
          include: {
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
                specializations: true,
                location: true
              }
            },
            timeSlot: {
              select: {
                id: true,
                startTime: true,
                endTime: true
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        });

        // Markiere TimeSlot als nicht verfügbar
        await tx.timeSlot.update({
          where: { id: request.timeSlotId },
          data: { available: false }
        });

        return newBooking;
      });

      loggers.businessEvent('BOOKING_CREATED', request.userId, {
        bookingId: booking.id,
        lawyerId: request.lawyerId,
        meetingType: request.meetingType
      });

      logger.info('Booking created successfully', { bookingId: booking.id });

      return booking as BookingDetails;
    } catch (error) {
      logger.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Holt Buchungsdetails
   */
  async getBooking(bookingId: string, userId: string): Promise<BookingDetails> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          lawyer: {
            select: {
              id: true,
              name: true,
              email: true,
              specializations: true,
              location: true
            }
          },
          timeSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!booking) {
        throw new NotFoundError('Buchung nicht gefunden');
      }

      // Prüfe Berechtigung
      if (booking.userId !== userId) {
        throw new ValidationError('Keine Berechtigung für diese Buchung');
      }

      return booking as BookingDetails;
    } catch (error) {
      logger.error('Error getting booking:', error);
      throw error;
    }
  }

  /**
   * Listet alle Buchungen eines Nutzers
   */
  async getUserBookings(
    userId: string,
    status?: BookingStatus
  ): Promise<BookingDetails[]> {
    try {
      const where: any = { userId };
      
      if (status) {
        where.status = status;
      }

      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          lawyer: {
            select: {
              id: true,
              name: true,
              email: true,
              specializations: true,
              location: true
            }
          },
          timeSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return bookings as BookingDetails[];
    } catch (error) {
      logger.error('Error getting user bookings:', error);
      throw error;
    }
  }

  /**
   * Bestätigt eine Buchung (durch Anwalt)
   */
  async confirmBooking(bookingId: string, lawyerId: string): Promise<BookingDetails> {
    try {
      logger.info('Confirming booking', { bookingId, lawyerId });

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new NotFoundError('Buchung nicht gefunden');
      }

      if (booking.lawyerId !== lawyerId) {
        throw new ValidationError('Keine Berechtigung für diese Buchung');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new ValidationError('Buchung kann nicht bestätigt werden');
      }

      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
        include: {
          lawyer: {
            select: {
              id: true,
              name: true,
              email: true,
              specializations: true,
              location: true
            }
          },
          timeSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      loggers.businessEvent('BOOKING_CONFIRMED', booking.userId, {
        bookingId,
        lawyerId
      });

      return updatedBooking as BookingDetails;
    } catch (error) {
      logger.error('Error confirming booking:', error);
      throw error;
    }
  }

  /**
   * Storniert eine Buchung
   */
  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    try {
      logger.info('Cancelling booking', { bookingId, userId });

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new NotFoundError('Buchung nicht gefunden');
      }

      if (booking.userId !== userId) {
        throw new ValidationError('Keine Berechtigung für diese Buchung');
      }

      if (booking.status === BookingStatus.COMPLETED) {
        throw new ValidationError('Abgeschlossene Buchungen können nicht storniert werden');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new ValidationError('Buchung ist bereits storniert');
      }

      // Storniere in Transaction
      await this.prisma.$transaction(async (tx) => {
        // Aktualisiere Buchungsstatus
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED }
        });

        // Gebe TimeSlot wieder frei
        await tx.timeSlot.update({
          where: { id: booking.timeSlotId },
          data: { available: true }
        });
      });

      loggers.businessEvent('BOOKING_CANCELLED', userId, {
        bookingId,
        lawyerId: booking.lawyerId
      });

      logger.info('Booking cancelled successfully', { bookingId });
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Markiert Buchung als abgeschlossen
   */
  async completeBooking(bookingId: string, lawyerId: string): Promise<void> {
    try {
      logger.info('Completing booking', { bookingId, lawyerId });

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new NotFoundError('Buchung nicht gefunden');
      }

      if (booking.lawyerId !== lawyerId) {
        throw new ValidationError('Keine Berechtigung für diese Buchung');
      }

      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new ValidationError('Nur bestätigte Buchungen können abgeschlossen werden');
      }

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED }
      });

      loggers.businessEvent('BOOKING_COMPLETED', booking.userId, {
        bookingId,
        lawyerId
      });

      logger.info('Booking completed successfully', { bookingId });
    } catch (error) {
      logger.error('Error completing booking:', error);
      throw error;
    }
  }

  /**
   * Überträgt Falldaten an Anwalt
   */
  async transferConsultationData(
    bookingId: string,
    userId: string,
    data: ConsultationData
  ): Promise<void> {
    try {
      logger.info('Transferring consultation data', { bookingId, userId });

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new NotFoundError('Buchung nicht gefunden');
      }

      if (booking.userId !== userId) {
        throw new ValidationError('Keine Berechtigung für diese Buchung');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new ValidationError('Daten können nicht für stornierte Buchungen übertragen werden');
      }

      // Speichere Konsultationsdaten in notes (oder separates Modell)
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          notes: JSON.stringify({
            ...booking.notes ? JSON.parse(booking.notes) : {},
            consultationData: data,
            transferredAt: new Date()
          })
        }
      });

      loggers.businessEvent('CONSULTATION_DATA_TRANSFERRED', userId, {
        bookingId,
        lawyerId: booking.lawyerId,
        hasCaseId: !!data.caseId,
        documentCount: data.documents?.length || 0
      });

      logger.info('Consultation data transferred successfully', { bookingId });
    } catch (error) {
      logger.error('Error transferring consultation data:', error);
      throw error;
    }
  }

  /**
   * Holt verfügbare Zeitslots für einen Anwalt
   */
  async getAvailableSlots(
    lawyerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ id: string; startTime: Date; endTime: Date }>> {
    try {
      const slots = await this.prisma.timeSlot.findMany({
        where: {
          lawyerId,
          available: true,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return slots;
    } catch (error) {
      logger.error('Error getting available slots:', error);
      throw error;
    }
  }

  /**
   * Erstellt Zeitslots für einen Anwalt
   */
  async createTimeSlots(
    lawyerId: string,
    slots: Array<{ startTime: Date; endTime: Date }>
  ): Promise<void> {
    try {
      logger.info('Creating time slots', { lawyerId, count: slots.length });

      // Validiere Anwalt existiert
      const lawyer = await this.prisma.lawyer.findUnique({
        where: { id: lawyerId }
      });

      if (!lawyer) {
        throw new NotFoundError('Anwalt nicht gefunden');
      }

      // Validiere Zeitslots
      for (const slot of slots) {
        if (slot.startTime >= slot.endTime) {
          throw new ValidationError('Startzeit muss vor Endzeit liegen');
        }

        if (slot.startTime < new Date()) {
          throw new ValidationError('Zeitslots können nicht in der Vergangenheit liegen');
        }
      }

      // Erstelle Zeitslots
      await this.prisma.timeSlot.createMany({
        data: slots.map(slot => ({
          lawyerId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: true
        }))
      });

      logger.info('Time slots created successfully', { lawyerId, count: slots.length });
    } catch (error) {
      logger.error('Error creating time slots:', error);
      throw error;
    }
  }
}
