import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { PaymentIntent, PaymentDetails, RefundRequest } from './PaymentService';
export declare class StripePaymentService {
    private stripe;
    private prisma;
    constructor(prisma: PrismaClient, stripeSecretKey: string);
    /**
     * Erstellt einen Stripe Payment Intent für eine Buchung
     */
    createPaymentIntent(bookingId: string, userId: string): Promise<PaymentIntent>;
    /**
     * Bestätigt eine Zahlung nach erfolgreicher Stripe-Zahlung
     */
    confirmPayment(paymentId: string, stripePaymentIntentId: string): Promise<PaymentDetails>;
    /**
     * Erstellt eine Rückerstattung über Stripe
     */
    createRefund(request: RefundRequest, userId: string): Promise<PaymentDetails>;
    /**
     * Webhook Handler für Stripe Events
     */
    handleWebhook(payload: string | Buffer, signature: string, webhookSecret: string): Promise<void>;
    /**
     * Holt Zahlungsdetails von Stripe
     */
    getStripePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private handleChargeRefunded;
    private calculateDuration;
    private mapToPaymentDetails;
}
