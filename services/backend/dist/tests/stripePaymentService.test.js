"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const StripePaymentService_1 = require("../services/StripePaymentService");
const errorHandler_1 = require("../middleware/errorHandler");
const stripe_1 = __importDefault(require("stripe"));
// Mock Stripe
jest.mock('stripe');
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
// Mock Stripe Instance
const mockStripeInstance = {
    paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
    },
    refunds: {
        create: jest.fn(),
    },
    webhooks: {
        constructEvent: jest.fn(),
    },
};
describe('StripePaymentService', () => {
    let stripeService;
    beforeEach(() => {
        stripe_1.default.mockImplementation(() => mockStripeInstance);
        stripeService = new StripePaymentService_1.StripePaymentService(mockPrisma, 'sk_test_123');
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
                name: 'Dr. Schmidt',
                hourlyRate: 180
            },
            timeSlot: {
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T11:00:00Z')
            },
            user: {
                email: 'user@example.com',
                profile: {}
            }
        };
        it('sollte einen Stripe Payment Intent erfolgreich erstellen', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
            mockPrisma.payment.findFirst.mockResolvedValue(null);
            mockStripeInstance.paymentIntents.create.mockResolvedValue({
                id: 'pi_stripe_123',
                client_secret: 'pi_stripe_123_secret_abc',
                amount: 18000,
                currency: 'eur',
                status: 'requires_payment_method'
            });
            mockPrisma.payment.create.mockResolvedValue({
                id: 'payment-1',
                bookingId: 'booking-1',
                userId: 'user-1',
                lawyerId: 'lawyer-1',
                amount: 18000,
                currency: 'EUR',
                status: client_1.PaymentStatus.PENDING,
                paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                transactionId: 'pi_stripe_123',
                createdAt: new Date()
            });
            const result = await stripeService.createPaymentIntent('booking-1', 'user-1');
            expect(result).toMatchObject({
                id: 'payment-1',
                amount: 18000,
                currency: 'EUR',
                status: client_1.PaymentStatus.PENDING,
                clientSecret: 'pi_stripe_123_secret_abc',
                metadata: {
                    bookingId: 'booking-1',
                    userId: 'user-1',
                    lawyerId: 'lawyer-1'
                }
            });
            expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith({
                amount: 18000,
                currency: 'eur',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    bookingId: 'booking-1',
                    userId: 'user-1',
                    lawyerId: 'lawyer-1',
                    duration: '60',
                    hourlyRate: '180'
                },
                description: 'Rechtsberatung - Dr. Schmidt',
                receipt_email: 'user@example.com',
            });
        });
        it('sollte Stripe-Fehler korrekt behandeln', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
            mockPrisma.payment.findFirst.mockResolvedValue(null);
            const stripeError = new stripe_1.default.errors.StripeCardError('Your card was declined', 'card_declined', 'card_error');
            mockStripeInstance.paymentIntents.create.mockRejectedValue(stripeError);
            await expect(stripeService.createPaymentIntent('booking-1', 'user-1')).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('sollte Fehler werfen wenn Buchung nicht gefunden', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(null);
            await expect(stripeService.createPaymentIntent('booking-1', 'user-1')).rejects.toThrow(errorHandler_1.NotFoundError);
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
            transactionId: 'pi_stripe_123',
            createdAt: new Date()
        };
        it('sollte Zahlung nach Stripe-Verifizierung bestätigen', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockStripeInstance.paymentIntents.retrieve.mockResolvedValue({
                id: 'pi_stripe_123',
                status: 'succeeded',
                amount: 18000
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.COMPLETED,
                paidAt: new Date()
            });
            mockPrisma.booking.update.mockResolvedValue({});
            const result = await stripeService.confirmPayment('payment-1', 'pi_stripe_123');
            expect(result.status).toBe(client_1.PaymentStatus.COMPLETED);
            expect(mockStripeInstance.paymentIntents.retrieve).toHaveBeenCalledWith('pi_stripe_123');
            expect(mockPrisma.booking.update).toHaveBeenCalledWith({
                where: { id: 'booking-1' },
                data: { paymentStatus: 'PAID' }
            });
        });
        it('sollte Fehler werfen wenn Stripe-Zahlung nicht erfolgreich', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockStripeInstance.paymentIntents.retrieve.mockResolvedValue({
                id: 'pi_stripe_123',
                status: 'requires_payment_method',
                amount: 18000
            });
            await expect(stripeService.confirmPayment('payment-1', 'pi_stripe_123')).rejects.toThrow(errorHandler_1.ValidationError);
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
            transactionId: 'pi_stripe_123',
            booking: {}
        };
        it('sollte Stripe-Rückerstattung erfolgreich erstellen', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockStripeInstance.refunds.create.mockResolvedValue({
                id: 'ref_stripe_123',
                amount: 18000,
                status: 'succeeded',
                payment_intent: 'pi_stripe_123'
            });
            mockPrisma.refund.create.mockResolvedValue({
                id: 'refund-1',
                paymentId: 'payment-1',
                amount: 18000,
                reason: 'Stornierung',
                status: 'COMPLETED',
                processedAt: new Date()
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.REFUNDED,
                refundedAmount: 18000,
                refundedAt: new Date()
            });
            const result = await stripeService.createRefund({
                paymentId: 'payment-1',
                reason: 'Stornierung'
            }, 'user-1');
            expect(result.status).toBe(client_1.PaymentStatus.REFUNDED);
            expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
                payment_intent: 'pi_stripe_123',
                amount: 18000,
                reason: 'requested_by_customer',
                metadata: {
                    paymentId: 'payment-1',
                    userId: 'user-1',
                    reason: 'Stornierung'
                }
            });
        });
        it('sollte Teilerstattung über Stripe erstellen', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            mockStripeInstance.refunds.create.mockResolvedValue({
                id: 'ref_stripe_123',
                amount: 9000,
                status: 'succeeded'
            });
            mockPrisma.refund.create.mockResolvedValue({
                id: 'refund-1',
                amount: 9000,
                status: 'COMPLETED'
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: client_1.PaymentStatus.REFUNDED,
                refundedAmount: 9000
            });
            await stripeService.createRefund({
                paymentId: 'payment-1',
                amount: 9000,
                reason: 'Teilstornierung'
            }, 'user-1');
            expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith(expect.objectContaining({
                amount: 9000
            }));
        });
    });
    describe('handleWebhook', () => {
        const webhookPayload = JSON.stringify({
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: 'pi_stripe_123',
                    status: 'succeeded'
                }
            }
        });
        it('sollte payment_intent.succeeded Event verarbeiten', async () => {
            const mockEvent = {
                id: 'evt_123',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_stripe_123',
                        status: 'succeeded'
                    }
                }
            };
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);
            mockPrisma.payment.findFirst.mockResolvedValue({
                id: 'payment-1',
                bookingId: 'booking-1',
                userId: 'user-1',
                status: client_1.PaymentStatus.PENDING,
                transactionId: 'pi_stripe_123'
            });
            mockPrisma.payment.update.mockResolvedValue({});
            mockPrisma.booking.update.mockResolvedValue({});
            await stripeService.handleWebhook(webhookPayload, 'stripe-signature', 'whsec_test');
            expect(mockPrisma.payment.update).toHaveBeenCalledWith({
                where: { id: 'payment-1' },
                data: {
                    status: client_1.PaymentStatus.COMPLETED,
                    paidAt: expect.any(Date)
                }
            });
        });
        it('sollte payment_intent.payment_failed Event verarbeiten', async () => {
            const mockEvent = {
                id: 'evt_123',
                type: 'payment_intent.payment_failed',
                data: {
                    object: {
                        id: 'pi_stripe_123',
                        status: 'failed',
                        last_payment_error: {
                            message: 'Card declined'
                        }
                    }
                }
            };
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);
            mockPrisma.payment.findFirst.mockResolvedValue({
                id: 'payment-1',
                userId: 'user-1',
                status: client_1.PaymentStatus.PENDING,
                transactionId: 'pi_stripe_123'
            });
            mockPrisma.payment.update.mockResolvedValue({});
            await stripeService.handleWebhook(webhookPayload, 'stripe-signature', 'whsec_test');
            expect(mockPrisma.payment.update).toHaveBeenCalledWith({
                where: { id: 'payment-1' },
                data: {
                    status: client_1.PaymentStatus.FAILED
                }
            });
        });
        it('sollte Fehler werfen bei ungültiger Signatur', async () => {
            const signatureError = new stripe_1.default.errors.StripeSignatureVerificationError('Invalid signature', 'stripe-signature');
            mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
                throw signatureError;
            });
            await expect(stripeService.handleWebhook(webhookPayload, 'invalid-signature', 'whsec_test')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('getStripePaymentIntent', () => {
        it('sollte Payment Intent von Stripe abrufen', async () => {
            const mockIntent = {
                id: 'pi_stripe_123',
                amount: 18000,
                currency: 'eur',
                status: 'succeeded'
            };
            mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockIntent);
            const result = await stripeService.getStripePaymentIntent('pi_stripe_123');
            expect(result).toEqual(mockIntent);
            expect(mockStripeInstance.paymentIntents.retrieve).toHaveBeenCalledWith('pi_stripe_123');
        });
        it('sollte Stripe-Fehler korrekt behandeln', async () => {
            const stripeError = new stripe_1.default.errors.StripeInvalidRequestError('No such payment_intent', 'payment_intent', 404);
            mockStripeInstance.paymentIntents.retrieve.mockRejectedValue(stripeError);
            await expect(stripeService.getStripePaymentIntent('pi_invalid')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
});
