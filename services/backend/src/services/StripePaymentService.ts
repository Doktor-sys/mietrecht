import Stripe from 'stripe';
import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { logger, loggers } from '../utils/logger';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler';
import { PaymentIntent, PaymentDetails, Invoice, RefundRequest } from './PaymentService';

export class StripePaymentService {
  private stripe: Stripe;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, stripeSecretKey: string) {
    this.prisma = prisma;
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Erstellt einen Stripe Payment Intent für eine Buchung
   */
  async createPaymentIntent(
    bookingId: string,
    userId: string
  ): Promise<PaymentIntent> {
    try {
      logger.info('Creating Stripe payment intent', { bookingId, userId });

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
        throw new NotFoundError('Buchung nicht gefunden');
      }

      if (booking.userId !== userId) {
        throw new ValidationError('Keine Berechtigung für diese Buchung');
      }

      // Prüfe ob bereits eine Zahlung existiert
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          bookingId,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.COMPLETED]
          }
        }
      });

      if (existingPayment) {
        throw new ConflictError('Zahlung für diese Buchung existiert bereits');
      }

      // Berechne Betrag basierend auf Anwalt-Stundensatz und Dauer
      const duration = this.calculateDuration(
        booking.timeSlot.startTime,
        booking.timeSlot.endTime
      );
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
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          transactionId: stripeIntent.id
        }
      });

      loggers.businessEvent('PAYMENT_INTENT_CREATED', userId, {
        paymentId: payment.id,
        bookingId,
        amount,
        currency: 'EUR',
        stripeIntentId: stripeIntent.id
      });

      logger.info('Stripe payment intent created successfully', {
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
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        logger.error('Stripe API error:', {
          type: error.type,
          message: error.message,
          code: error.code
        });
        throw new ValidationError(`Stripe Fehler: ${error.message}`);
      }
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Bestätigt eine Zahlung nach erfolgreicher Stripe-Zahlung
   */
  async confirmPayment(
    paymentId: string,
    stripePaymentIntentId: string
  ): Promise<PaymentDetails> {
    try {
      logger.info('Confirming Stripe payment', { paymentId, stripePaymentIntentId });

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new NotFoundError('Zahlung nicht gefunden');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new ValidationError('Zahlung kann nicht bestätigt werden');
      }

      // Verifiziere Payment Intent bei Stripe
      const stripeIntent = await this.stripe.paymentIntents.retrieve(stripePaymentIntentId);

      if (stripeIntent.status !== 'succeeded') {
        throw new ValidationError(`Stripe Zahlung nicht erfolgreich: ${stripeIntent.status}`);
      }

      // Aktualisiere Payment-Status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
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

      loggers.businessEvent('PAYMENT_CONFIRMED', payment.userId, {
        paymentId,
        bookingId: payment.bookingId,
        amount: payment.amount,
        stripeIntentId: stripePaymentIntentId
      });

      logger.info('Stripe payment confirmed successfully', { paymentId });

      return this.mapToPaymentDetails(updatedPayment);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        logger.error('Stripe API error:', error);
        throw new ValidationError(`Stripe Fehler: ${error.message}`);
      }
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine Rückerstattung über Stripe
   */
  async createRefund(request: RefundRequest, userId: string): Promise<PaymentDetails> {
    try {
      logger.info('Creating Stripe refund', { request, userId });

      const payment = await this.prisma.payment.findUnique({
        where: { id: request.paymentId },
        include: {
          booking: true
        }
      });

      if (!payment) {
        throw new NotFoundError('Zahlung nicht gefunden');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new ValidationError('Nur abgeschlossene Zahlungen können erstattet werden');
      }

      // Prüfe Berechtigung
      if (payment.userId !== userId) {
        throw new ValidationError('Keine Berechtigung für diese Rückerstattung');
      }

      // Berechne Erstattungsbetrag
      const refundAmount = request.amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new ValidationError('Erstattungsbetrag kann nicht höher als Zahlungsbetrag sein');
      }

      // Erstelle Stripe Refund
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: payment.transactionId!,
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
          status: PaymentStatus.REFUNDED,
          refundedAmount: refundAmount,
          refundedAt: new Date()
        }
      });

      loggers.businessEvent('REFUND_CREATED', userId, {
        paymentId: payment.id,
        refundId: refund.id,
        stripeRefundId: stripeRefund.id,
        amount: refundAmount,
        reason: request.reason
      });

      logger.info('Stripe refund created successfully', {
        refundId: refund.id,
        stripeRefundId: stripeRefund.id,
        amount: refundAmount
      });

      return this.mapToPaymentDetails(updatedPayment);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        logger.error('Stripe API error:', error);
        throw new ValidationError(`Stripe Fehler: ${error.message}`);
      }
      logger.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Webhook Handler für Stripe Events
   */
  async handleWebhook(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.info('Processing Stripe webhook', { type: event.type, id: event.id });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        logger.error('Invalid webhook signature:', error);
        throw new ValidationError('Ungültige Webhook-Signatur');
      }
      logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Holt Zahlungsdetails von Stripe
   */
  async getStripePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        logger.error('Stripe API error:', error);
        throw new ValidationError(`Stripe Fehler: ${error.message}`);
      }
      throw error;
    }
  }

  // Private Helper-Methoden

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: paymentIntent.id }
      });

      if (!payment) {
        logger.warn('Payment not found for succeeded intent', { intentId: paymentIntent.id });
        return;
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        logger.info('Payment already marked as completed', { paymentId: payment.id });
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date()
        }
      });

      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: 'PAID'
        }
      });

      loggers.businessEvent('PAYMENT_WEBHOOK_SUCCEEDED', payment.userId, {
        paymentId: payment.id,
        stripeIntentId: paymentIntent.id
      });

      logger.info('Payment marked as completed via webhook', { paymentId: payment.id });
    } catch (error) {
      logger.error('Error handling payment_intent.succeeded:', error);
      throw error;
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: paymentIntent.id }
      });

      if (!payment) {
        logger.warn('Payment not found for failed intent', { intentId: paymentIntent.id });
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED
        }
      });

      loggers.businessEvent('PAYMENT_WEBHOOK_FAILED', payment.userId, {
        paymentId: payment.id,
        stripeIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message
      });

      logger.info('Payment marked as failed via webhook', {
        paymentId: payment.id,
        reason: paymentIntent.last_payment_error?.message
      });
    } catch (error) {
      logger.error('Error handling payment_intent.payment_failed:', error);
      throw error;
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: charge.payment_intent as string }
      });

      if (!payment) {
        logger.warn('Payment not found for refunded charge', { chargeId: charge.id });
        return;
      }

      const refundAmount = charge.amount_refunded;

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAmount: refundAmount,
          refundedAt: new Date()
        }
      });

      loggers.businessEvent('PAYMENT_WEBHOOK_REFUNDED', payment.userId, {
        paymentId: payment.id,
        chargeId: charge.id,
        refundAmount
      });

      logger.info('Payment marked as refunded via webhook', {
        paymentId: payment.id,
        refundAmount
      });
    } catch (error) {
      logger.error('Error handling charge.refunded:', error);
      throw error;
    }
  }

  private calculateDuration(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  }

  private mapToPaymentDetails(payment: any): PaymentDetails {
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
