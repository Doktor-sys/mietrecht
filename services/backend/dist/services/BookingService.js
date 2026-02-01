"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class BookingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Erstellt eine neue Buchung
     */
    async createBooking(request) {
        try {
            logger_1.logger.info('Creating booking', { request });
            // Validiere TimeSlot
            const timeSlot = await this.prisma.timeSlot.findUnique({
                where: { id: request.timeSlotId },
                include: {
                    lawyer: true,
                    booking: true
                }
            });
            if (!timeSlot) {
                throw new errorHandler_1.NotFoundError('Zeitslot nicht gefunden');
            }
            if (!timeSlot.available) {
                throw new errorHandler_1.ConflictError('Zeitslot ist nicht verfügbar');
            }
            if (timeSlot.booking) {
                throw new errorHandler_1.ConflictError('Zeitslot ist bereits gebucht');
            }
            if (timeSlot.lawyerId !== request.lawyerId) {
                throw new errorHandler_1.ValidationError('Zeitslot gehört nicht zum angegebenen Anwalt');
            }
            // Prüfe ob Zeitslot in der Zukunft liegt
            if (timeSlot.startTime < new Date()) {
                throw new errorHandler_1.ValidationError('Zeitslot liegt in der Vergangenheit');
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
                        status: client_1.BookingStatus.PENDING
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
            logger_1.loggers.businessEvent('BOOKING_CREATED', request.userId, {
                bookingId: booking.id,
                lawyerId: request.lawyerId,
                meetingType: request.meetingType
            });
            logger_1.logger.info('Booking created successfully', { bookingId: booking.id });
            return booking;
        }
        catch (error) {
            logger_1.logger.error('Error creating booking:', error);
            throw error;
        }
    }
    /**
     * Holt Buchungsdetails
     */
    async getBooking(bookingId, userId) {
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
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            // Prüfe Berechtigung
            if (booking.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            return booking;
        }
        catch (error) {
            logger_1.logger.error('Error getting booking:', error);
            throw error;
        }
    }
    /**
     * Listet alle Buchungen eines Nutzers
     */
    async getUserBookings(userId, status) {
        try {
            const where = { userId };
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
            return bookings;
        }
        catch (error) {
            logger_1.logger.error('Error getting user bookings:', error);
            throw error;
        }
    }
    /**
     * Bestätigt eine Buchung (durch Anwalt)
     */
    async confirmBooking(bookingId, lawyerId) {
        try {
            logger_1.logger.info('Confirming booking', { bookingId, lawyerId });
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.lawyerId !== lawyerId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            if (booking.status !== client_1.BookingStatus.PENDING) {
                throw new errorHandler_1.ValidationError('Buchung kann nicht bestätigt werden');
            }
            const updatedBooking = await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: client_1.BookingStatus.CONFIRMED },
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
            logger_1.loggers.businessEvent('BOOKING_CONFIRMED', booking.userId, {
                bookingId,
                lawyerId
            });
            return updatedBooking;
        }
        catch (error) {
            logger_1.logger.error('Error confirming booking:', error);
            throw error;
        }
    }
    /**
     * Storniert eine Buchung
     */
    async cancelBooking(bookingId, userId) {
        try {
            logger_1.logger.info('Cancelling booking', { bookingId, userId });
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            if (booking.status === client_1.BookingStatus.COMPLETED) {
                throw new errorHandler_1.ValidationError('Abgeschlossene Buchungen können nicht storniert werden');
            }
            if (booking.status === client_1.BookingStatus.CANCELLED) {
                throw new errorHandler_1.ValidationError('Buchung ist bereits storniert');
            }
            // Storniere in Transaction
            await this.prisma.$transaction(async (tx) => {
                // Aktualisiere Buchungsstatus
                await tx.booking.update({
                    where: { id: bookingId },
                    data: { status: client_1.BookingStatus.CANCELLED }
                });
                // Gebe TimeSlot wieder frei
                await tx.timeSlot.update({
                    where: { id: booking.timeSlotId },
                    data: { available: true }
                });
            });
            logger_1.loggers.businessEvent('BOOKING_CANCELLED', userId, {
                bookingId,
                lawyerId: booking.lawyerId
            });
            logger_1.logger.info('Booking cancelled successfully', { bookingId });
        }
        catch (error) {
            logger_1.logger.error('Error cancelling booking:', error);
            throw error;
        }
    }
    /**
     * Markiert Buchung als abgeschlossen
     */
    async completeBooking(bookingId, lawyerId) {
        try {
            logger_1.logger.info('Completing booking', { bookingId, lawyerId });
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.lawyerId !== lawyerId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            if (booking.status !== client_1.BookingStatus.CONFIRMED) {
                throw new errorHandler_1.ValidationError('Nur bestätigte Buchungen können abgeschlossen werden');
            }
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: client_1.BookingStatus.COMPLETED }
            });
            logger_1.loggers.businessEvent('BOOKING_COMPLETED', booking.userId, {
                bookingId,
                lawyerId
            });
            logger_1.logger.info('Booking completed successfully', { bookingId });
        }
        catch (error) {
            logger_1.logger.error('Error completing booking:', error);
            throw error;
        }
    }
    /**
     * Überträgt Falldaten an Anwalt
     */
    async transferConsultationData(bookingId, userId, data) {
        try {
            logger_1.logger.info('Transferring consultation data', { bookingId, userId });
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            if (booking.status === client_1.BookingStatus.CANCELLED) {
                throw new errorHandler_1.ValidationError('Daten können nicht für stornierte Buchungen übertragen werden');
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
            logger_1.loggers.businessEvent('CONSULTATION_DATA_TRANSFERRED', userId, {
                bookingId,
                lawyerId: booking.lawyerId,
                hasCaseId: !!data.caseId,
                documentCount: data.documents?.length || 0
            });
            logger_1.logger.info('Consultation data transferred successfully', { bookingId });
        }
        catch (error) {
            logger_1.logger.error('Error transferring consultation data:', error);
            throw error;
        }
    }
    /**
     * Holt verfügbare Zeitslots für einen Anwalt
     */
    async getAvailableSlots(lawyerId, startDate, endDate) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting available slots:', error);
            throw error;
        }
    }
    /**
     * Erstellt Zeitslots für einen Anwalt
     */
    async createTimeSlots(lawyerId, slots) {
        try {
            logger_1.logger.info('Creating time slots', { lawyerId, count: slots.length });
            // Validiere Anwalt existiert
            const lawyer = await this.prisma.lawyer.findUnique({
                where: { id: lawyerId }
            });
            if (!lawyer) {
                throw new errorHandler_1.NotFoundError('Anwalt nicht gefunden');
            }
            // Validiere Zeitslots
            for (const slot of slots) {
                if (slot.startTime >= slot.endTime) {
                    throw new errorHandler_1.ValidationError('Startzeit muss vor Endzeit liegen');
                }
                if (slot.startTime < new Date()) {
                    throw new errorHandler_1.ValidationError('Zeitslots können nicht in der Vergangenheit liegen');
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
            logger_1.logger.info('Time slots created successfully', { lawyerId, count: slots.length });
        }
        catch (error) {
            logger_1.logger.error('Error creating time slots:', error);
            throw error;
        }
    }
}
exports.BookingService = BookingService;
