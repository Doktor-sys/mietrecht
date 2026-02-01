"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripePaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class StripePaymentService {
    constructor(prisma, stripeSecretKey) {
        this.prisma = prisma;
        this.stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });
    }
    /**
     * Erstellt einen Stripe Payment Intent für eine Buchung
     */
    async createPaymentIntent(bookingId, userId) {
        try {
            logger_1.logger.info('Creating Stripe payment intent', { bookingId, userId });
            // Hole Buchungsdetails
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    lawyer: true,
                    timeSlot: true,
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            });
            if (!booking) {
                throw new errorHandler_1.NotFoundError('Buchung nicht gefunden');
            }
            if (booking.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Buchung');
            }
            // Prüfe ob bereits eine Zahlung existiert
            const existingPayment = await this.prisma.payment.findFirst({
                where: {
                    bookingId,
                    status: {
                        in: [client_1.PaymentStatus.PENDING, client_1.PaymentStatus.COMPLETED]
                    }
                }
            });
            if (existingPayment) {
                throw new errorHandler_1.ConflictError('Zahlung für diese Buchung existiert bereits');
            }
            // Berechne Betrag basierend auf Anwalt-Stundensatz und Dauer
            const duration = this.calculateDuration(booking.timeSlot.startTime, booking.timeSlot.endTime);
            const hourlyRate = booking.lawyer.hourlyRate || 150; // Default 150€/Stunde
            const amount = Math.round((hourlyRate / 60) * duration * 100); // in Cent
            // Erstelle Stripe Payment Intent
            const stripeIntent = await this.stripe.paymentIntents.create({
                amount,
                currency: 'eur',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    bookingId,
                    userId,
                    lawyerId: booking.lawyerId,
                    duration: duration.toString(),
                    hourlyRate: hourlyRate.toString()
                },
                description: `Rechtsberatung - ${booking.lawyer.name}`,
                receipt_email: booking.user.email,
            });
            // Erstelle Payment-Eintrag in Datenbank
            const payment = await this.prisma.payment.create({
                data: {
                    bookingId,
                    userId,
                    lawyerId: booking.lawyerId,
                    amount,
                    currency: 'EUR',
                    status: client_1.PaymentStatus.PENDING,
                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD,
                    transactionId: stripeIntent.id
                }
            });
            logger_1.loggers.businessEvent('PAYMENT_INTENT_CREATED', userId, {
                paymentId: payment.id,
                bookingId,
                amount,
                currency: 'EUR',
                stripeIntentId: stripeIntent.id
            });
            logger_1.logger.info('Stripe payment intent created successfully', {
                paymentId: payment.id,
                stripeIntentId: stripeIntent.id,
                amount
            });
            return {
                id: payment.id,
                amount,
                currency: 'EUR',
                status: payment.status,
                clientSecret: stripeIntent.client_secret || undefined,
                metadata: {
                    bookingId,
                    userId,
                    lawyerId: booking.lawyerId
                }
            };
        }
        catch (error) {
            if (error instanceof stripe_1.default.errors.StripeError) {
                logger_1.logger.error('Stripe API error:', {
                    type: error.type,
                    message: error.message,
                    code: error.code
                });
                throw new errorHandler_1.ValidationError(`Stripe Fehler: ${error.message}`);
            }
            logger_1.logger.error('Error creating payment intent:', error);
            throw error;
        }
    }
    /**
     * Bestätigt eine Zahlung nach erfolgreicher Stripe-Zahlung
     */
    async confirmPayment(paymentId, stripePaymentIntentId) {
        try {
            logger_1.logger.info('Confirming Stripe payment', { paymentId, stripePaymentIntentId });
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId }
            });
            if (!payment) {
                throw new errorHandler_1.NotFoundError('Zahlung nicht gefunden');
            }
            if (payment.status !== client_1.PaymentStatus.PENDING) {
                throw new errorHandler_1.ValidationError('Zahlung kann nicht bestätigt werden');
            }
            // Verifiziere Payment Intent bei Stripe
            const stripeIntent = await this.stripe.paymentIntents.retrieve(stripePaymentIntentId);
            if (stripeIntent.status !== 'succeeded') {
                throw new errorHandler_1.ValidationError(`Stripe Zahlung nicht erfolgreich: ${stripeIntent.status}`);
            }
            // Aktualisiere Payment-Status
            const updatedPayment = await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: client_1.PaymentStatus.COMPLETED,
                    transactionId: stripePaymentIntentId,
                    paidAt: new Date()
                }
            });
            // Aktualisiere Buchungsstatus
            await this.prisma.booking.update({
                where: { id: payment.bookingId },
                data: {
                    paymentStatus: 'PAID'
                }
            });
            logger_1.loggers.businessEvent('PAYMENT_CONFIRMED', payment.userId, {
                paymentId,
                bookingId: payment.bookingId,
                amount: payment.amount,
                stripeIntentId: stripePaymentIntentId
            });
            logger_1.logger.info('Stripe payment confirmed successfully', { paymentId });
            return this.mapToPaymentDetails(updatedPayment);
        }
        catch (error) {
            if (error instanceof stripe_1.default.errors.StripeError) {
                logger_1.logger.error('Stripe API error:', error);
                throw new errorHandler_1.ValidationError(`Stripe Fehler: ${error.message}`);
            }
            logger_1.logger.error('Error confirming payment:', error);
            throw error;
        }
    }
    /**
     * Erstellt eine Rückerstattung über Stripe
     */
    async createRefund(request, userId) {
        try {
            logger_1.logger.info('Creating Stripe refund', { request, userId });
            const payment = await this.prisma.payment.findUnique({
                where: { id: request.paymentId },
                include: {
                    booking: true
                }
            });
            if (!payment) {
                throw new errorHandler_1.NotFoundError('Zahlung nicht gefunden');
            }
            if (payment.status !== client_1.PaymentStatus.COMPLETED) {
                throw new errorHandler_1.ValidationError('Nur abgeschlossene Zahlungen können erstattet werden');
            }
            // Prüfe Berechtigung
            if (payment.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Rückerstattung');
            }
            // Berechne Erstattungsbetrag
            const refundAmount = request.amount || payment.amount;
            if (refundAmount > payment.amount) {
                throw new errorHandler_1.ValidationError('Erstattungsbetrag kann nicht höher als Zahlungsbetrag sein');
            }
            // Erstelle Stripe Refund
            const stripeRefund = await this.stripe.refunds.create({
                payment_intent: payment.transactionId,
                amount: refundAmount,
                reason: 'requested_by_customer',
                metadata: {
                    paymentId: payment.id,
                    userId,
                    reason: request.reason
                }
            });
            // Erstelle Refund-Eintrag
            const refund = await this.prisma.refund.create({
                data: {
                    paymentId: payment.id,
                    amount: refundAmount,
                    reason: request.reason,
                    status: stripeRefund.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
                    processedAt: stripeRefund.status === 'succeeded' ? new Date() : null
                }
            });
            // Aktualisiere Payment-Status
            const updatedPayment = await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.REFUNDED,
                    refundedAmount: refundAmount,
                    refundedAt: new Date()
                }
            });
            logger_1.loggers.businessEvent('REFUND_CREATED', userId, {
                paymentId: payment.id,
                refundId: refund.id,
                stripeRefundId: stripeRefund.id,
                amount: refundAmount,
                reason: request.reason
            });
            logger_1.logger.info('Stripe refund created successfully', {
                refundId: refund.id,
                stripeRefundId: stripeRefund.id,
                amount: refundAmount
            });
            return this.mapToPaymentDetails(updatedPayment);
        }
        catch (error) {
            if (error instanceof stripe_1.default.errors.StripeError) {
                logger_1.logger.error('Stripe API error:', error);
                throw new errorHandler_1.ValidationError(`Stripe Fehler: ${error.message}`);
            }
            logger_1.logger.error('Error creating refund:', error);
            throw error;
        }
    }
    /**
     * Webhook Handler für Stripe Events
     */
    async handleWebhook(payload, signature, webhookSecret) {
        try {
            const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            logger_1.logger.info('Processing Stripe webhook', { type: event.type, id: event.id });
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object);
                    break;
                case 'charge.refunded':
                    await this.handleChargeRefunded(event.data.object);
                    break;
                default:
                    logger_1.logger.info('Unhandled webhook event type', { type: event.type });
            }
        }
        catch (error) {
            if (error instanceof stripe_1.default.errors.StripeSignatureVerificationError) {
                logger_1.logger.error('Invalid webhook signature:', error);
                throw new errorHandler_1.ValidationError('Ungültige Webhook-Signatur');
            }
            logger_1.logger.error('Error processing webhook:', error);
            throw error;
        }
    }
    /**
     * Holt Zahlungsdetails von Stripe
     */
    async getStripePaymentIntent(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            if (error instanceof stripe_1.default.errors.StripeError) {
                logger_1.logger.error('Stripe API error:', error);
                throw new errorHandler_1.ValidationError(`Stripe Fehler: ${error.message}`);
            }
            throw error;
        }
    }
    // Private Helper-Methoden
    async handlePaymentIntentSucceeded(paymentIntent) {
        try {
            const payment = await this.prisma.payment.findFirst({
                where: { transactionId: paymentIntent.id }
            });
            if (!payment) {
                logger_1.logger.warn('Payment not found for succeeded intent', { intentId: paymentIntent.id });
                return;
            }
            if (payment.status === client_1.PaymentStatus.COMPLETED) {
                logger_1.logger.info('Payment already marked as completed', { paymentId: payment.id });
                return;
            }
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.COMPLETED,
                    paidAt: new Date()
                }
            });
            await this.prisma.booking.update({
                where: { id: payment.bookingId },
                data: {
                    paymentStatus: 'PAID'
                }
            });
            logger_1.loggers.businessEvent('PAYMENT_WEBHOOK_SUCCEEDED', payment.userId, {
                paymentId: payment.id,
                stripeIntentId: paymentIntent.id
            });
            logger_1.logger.info('Payment marked as completed via webhook', { paymentId: payment.id });
        }
        catch (error) {
            logger_1.logger.error('Error handling payment_intent.succeeded:', error);
            throw error;
        }
    }
    async handlePaymentIntentFailed(paymentIntent) {
        try {
            const payment = await this.prisma.payment.findFirst({
                where: { transactionId: paymentIntent.id }
            });
            if (!payment) {
                logger_1.logger.warn('Payment not found for failed intent', { intentId: paymentIntent.id });
                return;
            }
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.FAILED
                }
            });
            logger_1.loggers.businessEvent('PAYMENT_WEBHOOK_FAILED', payment.userId, {
                paymentId: payment.id,
                stripeIntentId: paymentIntent.id,
                failureReason: paymentIntent.last_payment_error?.message
            });
            logger_1.logger.info('Payment marked as failed via webhook', {
                paymentId: payment.id,
                reason: paymentIntent.last_payment_error?.message
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling payment_intent.payment_failed:', error);
            throw error;
        }
    }
    async handleChargeRefunded(charge) {
        try {
            const payment = await this.prisma.payment.findFirst({
                where: { transactionId: charge.payment_intent }
            });
            if (!payment) {
                logger_1.logger.warn('Payment not found for refunded charge', { chargeId: charge.id });
                return;
            }
            const refundAmount = charge.amount_refunded;
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.REFUNDED,
                    refundedAmount: refundAmount,
                    refundedAt: new Date()
                }
            });
            logger_1.loggers.businessEvent('PAYMENT_WEBHOOK_REFUNDED', payment.userId, {
                paymentId: payment.id,
                chargeId: charge.id,
                refundAmount
            });
            logger_1.logger.info('Payment marked as refunded via webhook', {
                paymentId: payment.id,
                refundAmount
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling charge.refunded:', error);
            throw error;
        }
    }
    calculateDuration(startTime, endTime) {
        return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }
    mapToPaymentDetails(payment) {
        return {
            id: payment.id,
            bookingId: payment.bookingId,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            invoiceUrl: payment.invoiceUrl,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt
        };
    }
}
exports.StripePaymentService = StripePaymentService;
