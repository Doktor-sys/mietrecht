"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ConsultationService_1 = require("../services/ConsultationService");
const errorHandler_1 = require("../middleware/errorHandler");
describe('ConsultationService', () => {
    let prisma;
    let consultationService;
    beforeEach(() => {
        // Mock Prisma Client
        prisma = {
            booking: {
                findUnique: jest.fn(),
                update: jest.fn()
            },
            case: {
                findUnique: jest.fn()
            },
            lawyer: {
                findFirst: jest.fn()
            }
        };
        consultationService = new ConsultationService_1.ConsultationService(prisma);
        jest.clearAllMocks();
    });
    describe('createVideoMeeting', () => {
        it('sollte Video-Meeting für Jitsi erstellen', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                meetingType: client_1.MeetingType.VIDEO,
                status: client_1.BookingStatus.CONFIRMED,
                notes: null,
                timeSlot: {
                    startTime: new Date('2025-12-01T10:00:00Z'),
                    endTime: new Date('2025-12-01T11:00:00Z')
                },
                lawyer: {
                    id: 'lawyer-1',
                    name: 'Dr. Müller'
                },
                user: {
                    id: 'user-1',
                    email: 'user@test.de'
                }
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            prisma.booking.update.mockResolvedValue(mockBooking);
            const result = await consultationService.createVideoMeeting('booking-1', 'jitsi');
            expect(result.provider).toBe('jitsi');
            expect(result.roomUrl).toContain('meet.jit.si');
            expect(result.roomId).toBeDefined();
            expect(result.startTime).toEqual(mockBooking.timeSlot.startTime);
            expect(result.endTime).toEqual(mockBooking.timeSlot.endTime);
        });
        it('sollte Video-Meeting für Zoom mit Passwort erstellen', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                meetingType: client_1.MeetingType.VIDEO,
                status: client_1.BookingStatus.CONFIRMED,
                notes: null,
                timeSlot: {
                    startTime: new Date('2025-12-01T10:00:00Z'),
                    endTime: new Date('2025-12-01T11:00:00Z')
                },
                lawyer: { id: 'lawyer-1' },
                user: { id: 'user-1' }
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            prisma.booking.update.mockResolvedValue(mockBooking);
            const result = await consultationService.createVideoMeeting('booking-1', 'zoom');
            expect(result.provider).toBe('zoom');
            expect(result.roomUrl).toContain('zoom.us');
            expect(result.password).toBeDefined();
            expect(result.password).toHaveLength(8);
        });
        it('sollte Fehler werfen wenn Buchung nicht existiert', async () => {
            prisma.booking.findUnique.mockResolvedValue(null);
            await expect(consultationService.createVideoMeeting('invalid-booking', 'jitsi')).rejects.toThrow(errorHandler_1.NotFoundError);
        });
        it('sollte Fehler werfen wenn Buchung nicht für Video konfiguriert ist', async () => {
            const mockBooking = {
                id: 'booking-1',
                meetingType: client_1.MeetingType.PHONE,
                timeSlot: {
                    startTime: new Date(),
                    endTime: new Date()
                }
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            await expect(consultationService.createVideoMeeting('booking-1', 'jitsi')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('getVideoMeeting', () => {
        it('sollte Video-Meeting-Details zurückgeben', async () => {
            const videoMeeting = {
                provider: 'jitsi',
                roomId: 'test-room',
                roomUrl: 'https://meet.jit.si/smartlaw-test-room',
                startTime: '2025-12-01T10:00:00.000Z',
                endTime: '2025-12-01T11:00:00.000Z'
            };
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                notes: JSON.stringify({ videoMeeting })
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            const result = await consultationService.getVideoMeeting('booking-1', 'user-1');
            expect(result).toEqual(videoMeeting);
        });
        it('sollte null zurückgeben wenn kein Video-Meeting existiert', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                notes: null
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            const result = await consultationService.getVideoMeeting('booking-1', 'user-1');
            expect(result).toBeNull();
        });
    });
    describe('startConsultation', () => {
        it('sollte Konsultation erfolgreich starten', async () => {
            const now = new Date();
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                meetingType: client_1.MeetingType.VIDEO,
                status: client_1.BookingStatus.CONFIRMED,
                notes: JSON.stringify({
                    videoMeeting: {
                        provider: 'jitsi',
                        roomUrl: 'https://meet.jit.si/test'
                    }
                }),
                timeSlot: {
                    startTime: now
                }
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            const result = await consultationService.startConsultation('booking-1', 'user-1');
            expect(result.bookingId).toBe('booking-1');
            expect(result.status).toBe('active');
            expect(result.meetingType).toBe(client_1.MeetingType.VIDEO);
            expect(result.meetingConfig).toBeDefined();
            expect(result.startedAt).toBeDefined();
        });
        it('sollte Fehler werfen wenn Konsultation zu früh gestartet wird', async () => {
            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 2);
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                meetingType: client_1.MeetingType.VIDEO,
                timeSlot: {
                    startTime: futureDate
                }
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            await expect(consultationService.startConsultation('booking-1', 'user-1')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('endConsultation', () => {
        it('sollte Konsultation mit Notizen beenden', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                notes: JSON.stringify({
                    videoMeeting: { roomId: 'test' }
                })
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            prisma.booking.update.mockResolvedValue(mockBooking);
            await consultationService.endConsultation('booking-1', 'user-1', 'Beratung erfolgreich abgeschlossen');
            expect(prisma.booking.update).toHaveBeenCalled();
            const updateCall = prisma.booking.update.mock.calls[0][0];
            const updatedNotes = JSON.parse(updateCall.data.notes);
            expect(updatedNotes.consultationNotes).toBe('Beratung erfolgreich abgeschlossen');
            expect(updatedNotes.endedAt).toBeDefined();
        });
    });
    describe('transferSecureCaseData', () => {
        it('sollte Falldaten erfolgreich übertragen', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                status: client_1.BookingStatus.CONFIRMED,
                notes: null
            };
            const mockCase = {
                id: 'case-1',
                userId: 'user-1',
                title: 'Mietminderung',
                category: 'RENT_REDUCTION',
                description: 'Schimmel in der Wohnung',
                priority: 'HIGH',
                messages: [
                    {
                        sender: 'USER',
                        content: 'Ich habe Schimmel entdeckt',
                        timestamp: new Date()
                    }
                ],
                documents: [
                    {
                        id: 'doc-1',
                        filename: 'schimmel.jpg',
                        documentType: 'OTHER',
                        uploadedAt: new Date()
                    }
                ],
                legalRefs: [
                    {
                        legal: {
                            type: 'LAW',
                            reference: '§ 536 BGB',
                            title: 'Mietminderung bei Sach- und Rechtsmängeln'
                        },
                        relevantSection: 'Abs. 1'
                    }
                ]
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            prisma.case.findUnique.mockResolvedValue(mockCase);
            prisma.booking.update.mockResolvedValue(mockBooking);
            await consultationService.transferSecureCaseData('booking-1', 'user-1', 'case-1');
            expect(prisma.booking.update).toHaveBeenCalled();
            const updateCall = prisma.booking.update.mock.calls[0][0];
            const updatedNotes = JSON.parse(updateCall.data.notes);
            expect(updatedNotes.caseData).toBeDefined();
            expect(updatedNotes.caseData.caseId).toBe('case-1');
            expect(updatedNotes.caseData.documents).toHaveLength(1);
            expect(updatedNotes.caseData.legalReferences).toHaveLength(1);
        });
        it('sollte Fehler werfen wenn Fall nicht existiert', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                status: client_1.BookingStatus.CONFIRMED
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            prisma.case.findUnique.mockResolvedValue(null);
            await expect(consultationService.transferSecureCaseData('booking-1', 'user-1', 'invalid-case')).rejects.toThrow(errorHandler_1.NotFoundError);
        });
        it('sollte Fehler werfen wenn Nutzer nicht Besitzer des Falls ist', async () => {
            const mockBooking = {
                id: 'booking-1',
                userId: 'user-1',
                status: client_1.BookingStatus.CONFIRMED
            };
            const mockCase = {
                id: 'case-1',
                userId: 'other-user'
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            prisma.case.findUnique.mockResolvedValue(mockCase);
            await expect(consultationService.transferSecureCaseData('booking-1', 'user-1', 'case-1')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('getCaseDataForLawyer', () => {
        it('sollte Falldaten für Anwalt zurückgeben', async () => {
            const caseData = {
                caseId: 'case-1',
                title: 'Mietminderung',
                category: 'RENT_REDUCTION',
                documents: []
            };
            const mockBooking = {
                id: 'booking-1',
                lawyerId: 'lawyer-1',
                notes: JSON.stringify({ caseData })
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            const result = await consultationService.getCaseDataForLawyer('booking-1', 'lawyer-1');
            expect(result).toEqual(caseData);
        });
        it('sollte Fehler werfen wenn Anwalt keine Berechtigung hat', async () => {
            const mockBooking = {
                id: 'booking-1',
                lawyerId: 'other-lawyer'
            };
            prisma.booking.findUnique.mockResolvedValue(mockBooking);
            await expect(consultationService.getCaseDataForLawyer('booking-1', 'lawyer-1')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
});
