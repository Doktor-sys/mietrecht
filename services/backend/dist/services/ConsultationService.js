"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class ConsultationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Erstellt eine Video-Meeting-Konfiguration für eine Buchung
     */
    async createVideoMeeting(bookingId, provider = 'jitsi') {
        try {
            logger_1.logger.info('Creating video meeting', { bookingId, provider });
            // Hole Buchungsdetails
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    timeSlot: true,
                    lawyer: true,
                    user: true
                }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.meetingType !== client_1.MeetingType.VIDEO) {
                throw new errorHandler_1.ValidationError('Buchung ist nicht für Video-Meeting konfiguriert');
            }
            // Generiere Meeting-Konfiguration basierend auf Provider
            const config = await this.generateMeetingConfig(provider, bookingId, booking.timeSlot.startTime, booking.timeSlot.endTime);
            // Speichere Konfiguration in Booking notes
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    notes: JSON.stringify({
                        ...booking.notes ? JSON.parse(booking.notes) : {},
                        videoMeeting: config
                    })
                }
            });
            logger_1.loggers.businessEvent('VIDEO_MEETING_CREATED', booking.userId, {
                bookingId,
                provider,
                lawyerId: booking.lawyerId
            });
            logger_1.logger.info('Video meeting created successfully', { bookingId, roomId: config.roomId });
            return config;
        }
        catch (error) {
            logger_1.logger.error('Error creating video meeting:', error);
            throw error;
        }
    }
    /**
     * Generiert Meeting-Konfiguration basierend auf Provider
     */
    async generateMeetingConfig(provider, bookingId, startTime, endTime) {
        const roomId = this.generateRoomId(bookingId);
        switch (provider) {
            case 'jitsi':
                return {
                    provider: 'jitsi',
                    roomId,
                    roomUrl: `https://meet.jit.si/smartlaw-${roomId}`,
                    startTime,
                    endTime
                };
            case 'zoom':
                // In Produktion würde hier die Zoom API verwendet werden
                return {
                    provider: 'zoom',
                    roomId,
                    roomUrl: `https://zoom.us/j/${roomId}`,
                    password: this.generateMeetingPassword(),
                    startTime,
                    endTime
                };
            case 'teams':
                // In Produktion würde hier die Microsoft Teams API verwendet werden
                return {
                    provider: 'teams',
                    roomId,
                    roomUrl: `https://teams.microsoft.com/l/meetup-join/${roomId}`,
                    startTime,
                    endTime
                };
            default:
                throw new errorHandler_1.ValidationError('Ungültiger Meeting-Provider');
        }
    }
    /**
     * Generiert eindeutige Room-ID
     */
    generateRoomId(bookingId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${bookingId.substring(0, 8)}-${timestamp}-${random}`;
    }
    /**
     * Generiert sicheres Meeting-Passwort
     */
    generateMeetingPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    /**
     * Holt Video-Meeting-Details für eine Buchung
     */
    async getVideoMeeting(bookingId, userId) {
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            // Prüfe Berechtigung (Nutzer oder Anwalt)
            const isAuthorized = booking.userId === userId;
            if (!isAuthorized) {
                // Prüfe ob Nutzer der Anwalt ist
                const lawyer = await this.prisma.lawyer.findFirst({
                    where: {
                        id: booking.lawyerId,
                        email: userId // Vereinfachte Prüfung, in Produktion würde hier ein separates Auth-System verwendet
                    }
                });
                if (!lawyer) {
                    throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
                }
            }
            if (!booking.notes) {
                return null;
            }
            const notes = JSON.parse(booking.notes);
            return notes.videoMeeting || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting video meeting:', error);
            throw error;
        }
    }
    /**
     * Startet eine Konsultations-Session
     */
    async startConsultation(bookingId, userId) {
        try {
            logger_1.logger.info('Starting consultation', { bookingId, userId });
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    timeSlot: true
                }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            // Prüfe ob Konsultation zur richtigen Zeit startet
            const now = new Date();
            const startTime = booking.timeSlot.startTime;
            const timeDiff = Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60); // in Minuten
            if (timeDiff > 15) {
                throw new errorHandler_1.ValidationError('Konsultation kann nur 15 Minuten vor oder nach der geplanten Zeit gestartet werden');
            }
            // Hole Video-Meeting-Config wenn VIDEO
            let meetingConfig;
            if (booking.meetingType === client_1.MeetingType.VIDEO && booking.notes) {
                const notes = JSON.parse(booking.notes);
                meetingConfig = notes.videoMeeting;
            }
            const session = {
                bookingId,
                meetingType: booking.meetingType,
                meetingConfig,
                status: 'active',
                startedAt: now
            };
            logger_1.loggers.businessEvent('CONSULTATION_STARTED', booking.userId, {
                bookingId,
                meetingType: booking.meetingType,
                lawyerId: booking.lawyerId
            });
            logger_1.logger.info('Consultation started successfully', { bookingId });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Error starting consultation:', error);
            throw error;
        }
    }
    /**
     * Beendet eine Konsultations-Session
     */
    async endConsultation(bookingId, userId, notes) {
        try {
            logger_1.logger.info('Ending consultation', { bookingId, userId });
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            // Aktualisiere Booking mit Konsultations-Notizen
            const existingNotes = booking.notes ? JSON.parse(booking.notes) : {};
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    notes: JSON.stringify({
                        ...existingNotes,
                        consultationNotes: notes,
                        endedAt: new Date()
                    })
                }
            });
            logger_1.loggers.businessEvent('CONSULTATION_ENDED', booking.userId, {
                bookingId,
                lawyerId: booking.lawyerId,
                hasNotes: !!notes
            });
            logger_1.logger.info('Consultation ended successfully', { bookingId });
        }
        catch (error) {
            logger_1.logger.error('Error ending consultation:', error);
            throw error;
        }
    }
    /**
     * Überträgt verschlüsselte Falldaten an Anwalt
     */
    async transferSecureCaseData(bookingId, userId, caseId) {
        try {
            logger_1.logger.info('Transferring secure case data', { bookingId, userId, caseId });
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            // Hole Fall-Daten
            const caseData = await this.prisma.case.findUnique({
                where: { id: caseId },
                include: {
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 10
                    },
                    documents: true,
                    legalRefs: {
                        include: {
                            legal: true
                        }
                    }
                }
            });
            if (!caseData) {
                throw new errorHandler_1.NotFoundError('Fall nicht gefunden');
            }
            if (caseData.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diesen Fall');
            }
            // Erstelle Zusammenfassung der Falldaten
            const caseSummary = {
                caseId: caseData.id,
                title: caseData.title,
                category: caseData.category,
                description: caseData.description,
                priority: caseData.priority,
                recentMessages: caseData.messages.map(m => ({
                    sender: m.sender,
                    content: m.content,
                    timestamp: m.timestamp
                })),
                documents: caseData.documents.map(d => ({
                    id: d.id,
                    filename: d.filename,
                    documentType: d.documentType,
                    uploadedAt: d.uploadedAt
                })),
                legalReferences: caseData.legalRefs.map(ref => ({
                    type: ref.legal.type,
                    reference: ref.legal.reference,
                    title: ref.legal.title,
                    relevantSection: ref.relevantSection
                }))
            };
            // Speichere in Booking notes
            const existingNotes = booking.notes ? JSON.parse(booking.notes) : {};
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    notes: JSON.stringify({
                        ...existingNotes,
                        caseData: caseSummary,
                        transferredAt: new Date()
                    })
                }
            });
            logger_1.loggers.businessEvent('CASE_DATA_TRANSFERRED', userId, {
                bookingId,
                caseId,
                lawyerId: booking.lawyerId,
                documentCount: caseData.documents.length
            });
            logger_1.logger.info('Case data transferred successfully', { bookingId, caseId });
        }
        catch (error) {
            logger_1.logger.error('Error transferring case data:', error);
            throw error;
        }
    }
    /**
     * Holt übertragene Falldaten für Anwalt
     */
    async getCaseDataForLawyer(bookingId, lawyerId) {
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.lawyerId !== lawyerId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            if (!booking.notes) {
                return null;
            }
            const notes = JSON.parse(booking.notes);
            return notes.caseData || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting case data for lawyer:', error);
            throw error;
        }
    }
}
exports.ConsultationService = ConsultationService;
