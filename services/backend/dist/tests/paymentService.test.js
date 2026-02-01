"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const PaymentService_1 = require("../services/PaymentService");
const errorHandler_1 = require("../middleware/errorHandler");
// Mock Prisma Client
const mockPrisma = {
    payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
    },
    booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    invoice: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
    },
    refund: {
        create: jest.fn(),
        update: jest.fn(),
    },
};
describe('PaymentService', () => {
    let paymentService;
    beforeEach(() => {
        paymentService = new PaymentService_1.PaymentService(mockPrisma);
        jest.clearAllMocks();
    });
    describe('createPaymentIntent', () => {
        const mockBooking = {
            id: 'booking-1',
            userId: 'user-1',
            lawyerId: 'lawyer-1',
            timeSlotId: 'slot-1',
            status: client_1.BookingStatus.CONFIRMED,
            meetingType: 'VIDEO',
            lawyer: {
                id: 'lawyer-1',
                hourlyRate: 180
            },
            timeSlot: {
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T11:00:00Z')
            }
        };
        it('sollte einen Payment Intent erfolgreich erstellen', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
            mockPrisma.payment.findFirst.mockResolvedValue(null);
            mockPrisma.payment.create.mockResolvedValue({
                id: 'payment-1',
                bookingId: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                amount: 18000, // 180€ * 60 min = 180€ in Cent
                currency: 'EUR',
                status: client_1.PaymentStatus.PENDING,
                paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                createdAt: new Date()
            });
            const result = await paymentService.createPaymentIntent('booking-1', 'user-1');
            expect(result).toMatchObject({
                id: 'payment-1',
                amount: 18000,
                currency: 'EUR',
                status: client_1.PaymentStatus.PENDING,
                metadata: {
                    bookingId: 'booking-1',
                    userId: 'user-1',
                    lawyerId: 'lawyer-1'
                }
            });
            expect(result.clientSecret).toBeDefined();
            expect(mockPrisma.payment.create).toHaveBeenCalled();
        });
        it('sollte Fehler werfen wenn Buchung nicht gefunden', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(null);
            await expect(paymentService.createPaymentIntent('booking-1', 'user-1')).rejects.toThrow(errorHandler_1.NotFoundError);
        });
        it('sollte Fehler werfen wenn Nutzer nicht berechtigt', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue({
                ...mockBooking,
                userId: 'other-user'
            });
            await expect(paymentService.createPaymentIntent('booking-1', 'user-1')).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('sollte Fehler werfen wenn Zahlung bereits existiert', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
            mockPrisma.payment.findFirst.mockResolvedValue({
                id: 'existing-payment',
                status: client_1.PaymentStatus.PENDING
            });
            await expect(paymentService.createPaymentIntent('booking-1', 'user-1')).rejects.toThrow(errorHandler_1.ConflictError);
        });
        it('sollte Standard-Stundensatz verwenden wenn nicht angegeben', async () => {
            const bookingWithoutRate = {
                ...mockBooking,
                lawyer: {
                    ...mockBooking.lawyer,
                    hourlyRate: null
                }
            };
            mockPrisma.booking.findUnique.mockResolvedValue(bookingWithoutRate);
            mockPrisma.payment.findFirst.mockResolvedValue(null);
            mockPrisma.payment.create.mockResolvedValue({
                id: 'payment-1',
                amount: 15000, // 150€ Default * 60 min
                currency: 'EUR',
                status: client_1.PaymentStatus.PENDING
            });
            const result = await paymentService.createPaymentIntent('booking-1', 'user-1');
            expect(result.amount).toBe(15000); // 150€ in Cent
        });
    });
    describe('confirmPayment', () => {
        const mockPayment = {
            id: 'payment-1',
            bookingId: 'booking-1',
            userId: 'user-1',
            lawyerId: 'lawyer-1',
            amount: 18000,
            currency: 'EUR',
            status: client_1.PaymentStatus.PENDING,
            paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
            createdAt: new Date()
        };
        it('sollte Zahlung erfolgreich bestätigen', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.COMPLETED,
                transactionId: 'txn-123',
                paidAt: new Date()
            });
            mockPrisma.booking.update.mockResolvedValue({});
            const result = await paymentService.confirmPayment('payment-1', 'txn-123');
            expect(result.status).toBe(client_1.PaymentStatus.COMPLETED);
            expect(result.transactionId).toBe('txn-123');
            expect(result.paidAt).toBeDefined();
            expect(mockPrisma.booking.update).toHaveBeenCalledWith({
                where: { id: 'booking-1' },
                data: { paymentStatus: 'PAID' }
            });
        });
        it('sollte Fehler werfen wenn Zahlung nicht gefunden', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(null);
            await expect(paymentService.confirmPayment('payment-1', 'txn-123')).rejects.toThrow(errorHandler_1.NotFoundError);
        });
        it('sollte Fehler werfen wenn Zahlung nicht PENDING', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.COMPLETED
            });
            await expect(paymentService.confirmPayment('payment-1', 'txn-123')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('getPayment', () => {
        const mockPayment = {
            id: 'payment-1',
            bookingId: 'booking-1',
            userId: 'user-1',
            lawyerId: 'lawyer-1',
            amount: 18000,
            currency: 'EUR',
            status: client_1.PaymentStatus.COMPLETED,
            paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
            createdAt: new Date(),
            paidAt: new Date()
        };
        it('sollte Zahlungsdetails für Nutzer zurückgeben', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            const result = await paymentService.getPayment('payment-1', 'user-1');
            expect(result).toMatchObject({
                id: 'payment-1',
                amount: 18000,
                status: client_1.PaymentStatus.COMPLETED
            });
        });
        it('sollte Zahlungsdetails für Anwalt zurückgeben', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            const result = await paymentService.getPayment('payment-1', 'lawyer-1');
            expect(result).toBeDefined();
        });
        it('sollte Fehler werfen wenn nicht berechtigt', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            await expect(paymentService.getPayment('payment-1', 'other-user')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('generateInvoice', () => {
        const mockPayment = {
            id: 'payment-1',
            bookingId: 'booking-1',
            userId: 'user-1',
            lawyerId: 'lawyer-1',
            amount: 18000,
            currency: 'EUR',
            status: client_1.PaymentStatus.COMPLETED,
            booking: {
                lawyer: {
                    name: 'Dr. Schmidt',
                    hourlyRate: 180
                },
                timeSlot: {
                    startTime: new Date('2024-01-15T10:00:00Z'),
                    endTime: new Date('2024-01-15T11:00:00Z')
                }
            }
        };
        it('sollte Rechnung erfolgreich generieren', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrisma.invoice.findFirst.mockResolvedValue(null);
            mockPrisma.invoice.create.mockResolvedValue({
                id: 'invoice-1',
                paymentId: 'payment-1',
                invoiceNumber: 'INV-202401-0001',
                amount: 18000,
                taxAmount: 3420, // 19% MwSt
                totalAmount: 21420,
                currency: 'EUR',
                issueDate: new Date(),
                dueDate: new Date(),
                status: 'PAID'
            });
            const result = await paymentService.generateInvoice('payment-1');
            expect(result).toMatchObject({
                invoiceNumber: 'INV-202401-0001',
                amount: 18000,
                taxAmount: 3420,
                totalAmount: 21420
            });
            expect(result.items).toHaveLength(1);
            expect(result.items[0].description).toContain('Dr. Schmidt');
        });
        it('sollte existierende Rechnung zurückgeben', async () => {
            const existingInvoice = {
                id: 'invoice-1',
                paymentId: 'payment-1',
                invoiceNumber: 'INV-202401-0001',
                amount: 18000,
                taxAmount: 3420,
                totalAmount: 21420,
                currency: 'EUR',
                issueDate: new Date(),
                dueDate: new Date()
            };
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrisma.invoice.findFirst.mockResolvedValue(existingInvoice);
            const result = await paymentService.generateInvoice('payment-1');
            expect(result.invoiceNumber).toBe('INV-202401-0001');
            expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
        });
        it('sollte Fehler werfen wenn Zahlung nicht abgeschlossen', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.PENDING
            });
            await expect(paymentService.generateInvoice('payment-1')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('createRefund', () => {
        const mockPayment = {
            id: 'payment-1',
            bookingId: 'booking-1',
            userId: 'user-1',
            lawyerId: 'lawyer-1',
            amount: 18000,
            currency: 'EUR',
            status: client_1.PaymentStatus.COMPLETED,
            booking: {}
        };
        it('sollte vollständige Rückerstattung erstellen', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrisma.refund.create.mockResolvedValue({
                id: 'refund-1',
                paymentId: 'payment-1',
                amount: 18000,
                reason: 'Stornierung durch Nutzer',
                status: 'PENDING'
            });
            mockPrisma.refund.update.mockResolvedValue({
                id: 'refund-1',
                status: 'COMPLETED',
                processedAt: new Date()
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.REFUNDED,
                refundedAmount: 18000,
                refundedAt: new Date()
            });
            const result = await paymentService.createRefund({
                paymentId: 'payment-1',
                reason: 'Stornierung durch Nutzer'
            }, 'user-1');
            expect(result.status).toBe(client_1.PaymentStatus.REFUNDED);
            expect(mockPrisma.refund.create).toHaveBeenCalled();
        });
        it('sollte Teilerstattung erstellen', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrisma.refund.create.mockResolvedValue({
                id: 'refund-1',
                amount: 9000,
                status: 'PENDING'
            });
            mockPrisma.refund.update.mockResolvedValue({
                id: 'refund-1',
                status: 'COMPLETED'
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.REFUNDED,
                refundedAmount: 9000
            });
            await paymentService.createRefund({
                paymentId: 'payment-1',
                amount: 9000,
                reason: 'Teilstornierung'
            }, 'user-1');
            expect(mockPrisma.refund.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    amount: 9000
                })
            });
        });
        it('sollte Fehler werfen wenn Betrag zu hoch', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            await expect(paymentService.createRefund({
                paymentId: 'payment-1',
                amount: 20000,
                reason: 'Test'
            }, 'user-1')).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('sollte Fehler werfen wenn nicht berechtigt', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            await expect(paymentService.createRefund({
                paymentId: 'payment-1',
                reason: 'Test'
            }, 'other-user')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('getLawyerPaymentStats', () => {
        it('sollte Zahlungsstatistiken korrekt berechnen', async () => {
            const mockPayments = [
                {
                    id: 'payment-1',
                    amount: 18000,
                    status: client_1.PaymentStatus.COMPLETED,
                    refundedAmount: null
                },
                {
                    id: 'payment-2',
                    amount: 15000,
                    status: client_1.PaymentStatus.COMPLETED,
                    refundedAmount: null
                },
                {
                    id: 'payment-3',
                    amount: 20000,
                    status: client_1.PaymentStatus.PENDING,
                    refundedAmount: null
                },
                {
                    id: 'payment-4',
                    amount: 12000,
                    status: client_1.PaymentStatus.REFUNDED,
                    refundedAmount: 12000
                }
            ];
            mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
            const result = await paymentService.getLawyerPaymentStats('lawyer-1');
            expect(result).toEqual({
                totalEarnings: 33000, // 18000 + 15000
                pendingPayments: 1,
                completedPayments: 2,
                refundedPayments: 1
            });
        });
        it('sollte Teilerstattungen berücksichtigen', async () => {
            const mockPayments = [
                {
                    id: 'payment-1',
                    amount: 18000,
                    status: client_1.PaymentStatus.COMPLETED,
                    refundedAmount: 5000
                }
            ];
            mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
            const result = await paymentService.getLawyerPaymentStats('lawyer-1');
            expect(result.totalEarnings).toBe(13000); // 18000 - 5000
        });
    });
});
