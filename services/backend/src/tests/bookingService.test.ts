import { MeetingType, BookingStatus } from '@prisma/client';
import { BookingService } from '../services/BookingService';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler';

describe('BookingService', () => {
  let prisma: any;
  let bookingService: BookingService;

  beforeEach(() => {
    // Mock Prisma Client
    prisma = {
      timeSlot: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn()
      },
      booking: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      lawyer: {
        findUnique: jest.fn()
      },
      $transaction: jest.fn()
    };
    
    bookingService = new BookingService(prisma);
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('sollte eine Buchung erfolgreich erstellen', async () => {
      const mockTimeSlot = {
        id: 'slot-1',
        lawyerId: 'lawyer-1',
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T11:00:00Z'),
        available: true,
        booking: null,
        lawyer: {
          id: 'lawyer-1',
          name: 'Dr. Müller',
          email: 'mueller@law.de'
        }
      };

      const mockBooking = {
        id: 'booking-1',
        userId: 'user-1',
        lawyerId: 'lawyer-1',
        timeSlotId: 'slot-1',
        meetingType: MeetingType.VIDEO,
        status: BookingStatus.PENDING,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lawyer: {
          id: 'lawyer-1',
          name: 'Dr. Müller',
          email: 'mueller@law.de',
          specializations: ['Mietrecht'],
          location: 'Berlin'
        },
        timeSlot: {
          id: 'slot-1',
          startTime: new Date('2025-12-01T10:00:00Z'),
          endTime: new Date('2025-12-01T11:00:00Z')
        },
        user: {
          id: 'user-1',
          email: 'user@test.de',
          profile: {
            firstName: 'Max',
            lastName: 'Mustermann'
          }
        }
      };

      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue(mockTimeSlot);
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockBooking);

      const result = await bookingService.createBooking({
        userId: 'user-1',
        lawyerId: 'lawyer-1',
        timeSlotId: 'slot-1',
        meetingType: MeetingType.VIDEO
      });

      expect(result).toEqual(mockBooking);
      expect(prisma.timeSlot.findUnique).toHaveBeenCalledWith({
        where: { id: 'slot-1' },
        include: {
          lawyer: true,
          booking: true
        }
      });
    });

    it('sollte Fehler werfen wenn TimeSlot nicht existiert', async () => {
      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.createBooking({
          userId: 'user-1',
          lawyerId: 'lawyer-1',
          timeSlotId: 'invalid-slot',
          meetingType: MeetingType.VIDEO
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('sollte Fehler werfen wenn TimeSlot nicht verfügbar ist', async () => {
      const mockTimeSlot = {
        id: 'slot-1',
        lawyerId: 'lawyer-1',
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T11:00:00Z'),
        available: false,
        booking: null
      };

      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue(mockTimeSlot);

      await expect(
        bookingService.createBooking({
          userId: 'user-1',
          lawyerId: 'lawyer-1',
          timeSlotId: 'slot-1',
          meetingType: MeetingType.VIDEO
        })
      ).rejects.toThrow(ConflictError);
    });

    it('sollte Fehler werfen wenn TimeSlot bereits gebucht ist', async () => {
      const mockTimeSlot = {
        id: 'slot-1',
        lawyerId: 'lawyer-1',
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T11:00:00Z'),
        available: true,
        booking: { id: 'existing-booking' }
      };

      (prisma.timeSlot.findUnique as jest.Mock).mockResolvedValue(mockTimeSlot);

      await expect(
        bookingService.createBooking({
          userId: 'user-1',
          lawyerId: 'lawyer-1',
          timeSlotId: 'slot-1',
          meetingType: MeetingType.VIDEO
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getBooking', () => {
    it('sollte Buchungsdetails zurückgeben', async () => {
      const mockBooking = {
        id: 'booking-1',
        userId: 'user-1',
        lawyerId: 'lawyer-1',
        timeSlotId: 'slot-1',
        meetingType: MeetingType.VIDEO,
        status: BookingStatus.CONFIRMED,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lawyer: {
          id: 'lawyer-1',
          name: 'Dr. Müller',
          email: 'mueller@law.de',
          specializations: ['Mietrecht'],
          location: 'Berlin'
        },
        timeSlot: {
          id: 'slot-1',
          startTime: new Date('2025-12-01T10:00:00Z'),
          endTime: new Date('2025-12-01T11:00:00Z')
        },
        user: {
          id: 'user-1',
          email: 'user@test.de',
          profile: {
            firstName: 'Max',
            lastName: 'Mustermann'
          }
        }
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      const result = await bookingService.getBooking('booking-1', 'user-1');

      expect(result).toEqual(mockBooking);
    });

    it('sollte Fehler werfen wenn Buchung nicht existiert', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.getBooking('invalid-booking', 'user-1')
      ).rejects.toThrow(NotFoundError);
    });

    it('sollte Fehler werfen wenn Nutzer keine Berechtigung hat', async () => {
      const mockBooking = {
        id: 'booking-1',
        userId: 'other-user',
        lawyerId: 'lawyer-1'
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      await expect(
        bookingService.getBooking('booking-1', 'user-1')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('cancelBooking', () => {
    it('sollte Buchung erfolgreich stornieren', async () => {
      const mockBooking = {
        id: 'booking-1',
        userId: 'user-1',
        lawyerId: 'lawyer-1',
        timeSlotId: 'slot-1',
        status: BookingStatus.PENDING
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      await bookingService.cancelBooking('booking-1', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('sollte Fehler werfen wenn Buchung bereits abgeschlossen ist', async () => {
      const mockBooking = {
        id: 'booking-1',
        userId: 'user-1',
        status: BookingStatus.COMPLETED
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      await expect(
        bookingService.cancelBooking('booking-1', 'user-1')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getAvailableSlots', () => {
    it('sollte verfügbare Zeitslots zurückgeben', async () => {
      const mockSlots = [
        {
          id: 'slot-1',
          startTime: new Date('2025-12-01T10:00:00Z'),
          endTime: new Date('2025-12-01T11:00:00Z')
        },
        {
          id: 'slot-2',
          startTime: new Date('2025-12-01T14:00:00Z'),
          endTime: new Date('2025-12-01T15:00:00Z')
        }
      ];

      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue(mockSlots);

      const result = await bookingService.getAvailableSlots(
        'lawyer-1',
        new Date('2025-12-01'),
        new Date('2025-12-31')
      );

      expect(result).toEqual(mockSlots);
      expect(result).toHaveLength(2);
    });
  });

  describe('createTimeSlots', () => {
    it('sollte Zeitslots erfolgreich erstellen', async () => {
      const mockLawyer = {
        id: 'lawyer-1',
        name: 'Dr. Müller'
      };

      const slots = [
        {
          startTime: new Date('2025-12-01T10:00:00Z'),
          endTime: new Date('2025-12-01T11:00:00Z')
        },
        {
          startTime: new Date('2025-12-01T14:00:00Z'),
          endTime: new Date('2025-12-01T15:00:00Z')
        }
      ];

      (prisma.lawyer.findUnique as jest.Mock).mockResolvedValue(mockLawyer);
      (prisma.timeSlot.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await bookingService.createTimeSlots('lawyer-1', slots);

      expect(prisma.timeSlot.createMany).toHaveBeenCalledWith({
        data: slots.map(slot => ({
          lawyerId: 'lawyer-1',
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: true
        }))
      });
    });

    it('sollte Fehler werfen wenn Anwalt nicht existiert', async () => {
      (prisma.lawyer.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.createTimeSlots('invalid-lawyer', [])
      ).rejects.toThrow(NotFoundError);
    });

    it('sollte Fehler werfen wenn Startzeit nach Endzeit liegt', async () => {
      const mockLawyer = { id: 'lawyer-1' };
      (prisma.lawyer.findUnique as jest.Mock).mockResolvedValue(mockLawyer);

      const invalidSlots = [
        {
          startTime: new Date('2025-12-01T11:00:00Z'),
          endTime: new Date('2025-12-01T10:00:00Z')
        }
      ];

      await expect(
        bookingService.createTimeSlots('lawyer-1', invalidSlots)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('transferConsultationData', () => {
    it('sollte Konsultationsdaten erfolgreich übertragen', async () => {
      const mockBooking = {
        id: 'booking-1',
        userId: 'user-1',
        lawyerId: 'lawyer-1',
        status: BookingStatus.CONFIRMED,
        notes: null
      };

      const consultationData = {
        summary: 'Mietminderung wegen Schimmel',
        documents: ['doc-1', 'doc-2'],
        legalReferences: [
          {
            type: 'law',
            reference: '§ 536 BGB',
            title: 'Mietminderung'
          }
        ]
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockBooking,
        notes: JSON.stringify({ consultationData })
      });

      await bookingService.transferConsultationData(
        'booking-1',
        'user-1',
        consultationData
      );

      expect(prisma.booking.update).toHaveBeenCalled();
    });

    it('sollte Fehler werfen für stornierte Buchungen', async () => {
      const mockBooking = {
        id: 'booking-1',
        userId: 'user-1',
        status: BookingStatus.CANCELLED
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      await expect(
        bookingService.transferConsultationData('booking-1', 'user-1', {
          summary: 'Test'
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
