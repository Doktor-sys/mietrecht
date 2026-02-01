"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class PaymentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Erstellt einen Payment Intent für eine Buchung
     */
    async createPaymentIntent(bookingId, userId) {
        try {
            logger_1.logger.info('Creating payment intent', { bookingId, userId });
            // Hole Buchungsdetails
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    lawyer: true,
                    timeSlot: true
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
            // Erstelle Payment-Eintrag
            const payment = await this.prisma.payment.create({
                data: {
                    bookingId,
                    userId,
                    lawyerId: booking.lawyerId,
                    amount,
                    currency: 'EUR',
                    status: client_1.PaymentStatus.PENDING,
                    paymentMethod: client_1.PaymentMethod.CREDIT_CARD
                }
            });
            // In Produktion würde hier die Stripe API verwendet werden
            const clientSecret = this.generateClientSecret(payment.id);
            logger_1.loggers.businessEvent('PAYMENT_INTENT_CREATED', userId, {
                paymentId: payment.id,
                bookingId,
                amount,
                currency: 'EUR'
            });
            logger_1.logger.info('Payment intent created successfully', {
                paymentId: payment.id,
                amount
            });
            return {
                id: payment.id,
                amount,
                currency: 'EUR',
                status: payment.status,
                clientSecret,
                metadata: {
                    bookingId,
                    userId,
                    lawyerId: booking.lawyerId
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating payment intent:', error);
            throw error;
        }
    }
    /**
     * Bestätigt eine Zahlung
     */
    async confirmPayment(paymentId, transactionId) {
        try {
            logger_1.logger.info('Confirming payment', { paymentId, transactionId });
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId }
            });
            if (!payment) {
                throw new errorHandler_1.NotFoundError('Zahlung nicht gefunden');
            }
            if (payment.status !== client_1.PaymentStatus.PENDING) {
                throw new errorHandler_1.ValidationError('Zahlung kann nicht bestätigt werden');
            }
            // Aktualisiere Payment-Status
            const updatedPayment = await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: client_1.PaymentStatus.COMPLETED,
                    transactionId,
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
                transactionId
            });
            logger_1.logger.info('Payment confirmed successfully', { paymentId });
            return this.mapToPaymentDetails(updatedPayment);
        }
        catch (error) {
            logger_1.logger.error('Error confirming payment:', error);
            throw error;
        }
    }
    /**
     * Holt Zahlungsdetails
     */
    async getPayment(paymentId, userId) {
        try {
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId }
            });
            if (!payment) {
                throw new errorHandler_1.NotFoundError('Zahlung nicht gefunden');
            }
            // Prüfe Berechtigung
            if (payment.userId !== userId && payment.lawyerId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Zahlung');
            }
            return this.mapToPaymentDetails(payment);
        }
        catch (error) {
            logger_1.logger.error('Error getting payment:', error);
            throw error;
        }
    }
    /**
     * Listet alle Zahlungen eines Nutzers
     */
    async getUserPayments(userId) {
        try {
            const payments = await this.prisma.payment.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            return payments.map(p => this.mapToPaymentDetails(p));
        }
        catch (error) {
            logger_1.logger.error('Error getting user payments:', error);
            throw error;
        }
    }
    /**
     * Erstellt eine Rechnung für eine Zahlung
     */
    async generateInvoice(paymentId) {
        try {
            logger_1.logger.info('Generating invoice', { paymentId });
            const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
                include: {
                    booking: {
                        include: {
                            lawyer: true,
                            timeSlot: true,
                            user: {
                                include: {
                                    profile: true
                                }
                            }
                        }
                    }
                }
            });
            if (!payment) {
                throw new errorHandler_1.NotFoundError('Zahlung nicht gefunden');
            }
            if (payment.status !== client_1.PaymentStatus.COMPLETED) {
                throw new errorHandler_1.ValidationError('Rechnung kann nur für abgeschlossene Zahlungen erstellt werden');
            }
            // Prüfe ob Rechnung bereits existiert
            const existingInvoice = await this.prisma.invoice.findFirst({
                where: { paymentId }
            });
            if (existingInvoice) {
                return this.mapToInvoice(existingInvoice, payment);
            }
            // Berechne Steuern (19% MwSt in Deutschland)
            const taxRate = 0.19;
            const netAmount = payment.amount;
            const taxAmount = Math.round(netAmount * taxRate);
            const totalAmount = netAmount + taxAmount;
            // Generiere Rechnungsnummer
            const invoiceNumber = this.generateInvoiceNumber();
            // Erstelle Rechnung
            const invoice = await this.prisma.invoice.create({
                data: {
                    paymentId,
                    invoiceNumber,
                    amount: netAmount,
                    taxAmount,
                    totalAmount,
                    currency: payment.currency,
                    issueDate: new Date(),
                    dueDate: new Date(), // Bereits bezahlt
                    status: 'PAID'
                }
            });
            logger_1.loggers.businessEvent('INVOICE_GENERATED', payment.userId, {
                invoiceId: invoice.id,
                paymentId,
                invoiceNumber,
                totalAmount
            });
            logger_1.logger.info('Invoice generated successfully', {
                invoiceId: invoice.id,
                invoiceNumber
            });
            return this.mapToInvoice(invoice, payment);
        }
        catch (error) {
            logger_1.logger.error('Error generating invoice:', error);
            throw error;
        }
    }
    /**
     * Holt Rechnung
     */
    async getInvoice(invoiceId, userId) {
        try {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: {
                    payment: {
                        include: {
                            booking: {
                                include: {
                                    lawyer: true,
                                    timeSlot: true
                                }
                            }
                        }
                    }
                }
            });
            if (!invoice) {
                throw new errorHandler_1.NotFoundError('Rechnung nicht gefunden');
            }
            // Prüfe Berechtigung
            if (invoice.payment.userId !== userId && invoice.payment.lawyerId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Rechnung');
            }
            return this.mapToInvoice(invoice, invoice.payment);
        }
        catch (error) {
            logger_1.logger.error('Error getting invoice:', error);
            throw error;
        }
    }
    /**
     * Erstellt eine Rückerstattung
     */
    async createRefund(request, userId) {
        try {
            logger_1.logger.info('Creating refund', { request, userId });
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
            // Prüfe Berechtigung (nur Nutzer oder Admin)
            if (payment.userId !== userId) {
                throw new errorHandler_1.ValidationError('Keine Berechtigung für diese Rückerstattung');
            }
            // Berechne Erstattungsbetrag
            const refundAmount = request.amount || payment.amount;
            if (refundAmount > payment.amount) {
                throw new errorHandler_1.ValidationError('Erstattungsbetrag kann nicht höher als Zahlungsbetrag sein');
            }
            // Erstelle Refund-Eintrag
            const refund = await this.prisma.refund.create({
                data: {
                    paymentId: payment.id,
                    amount: refundAmount,
                    reason: request.reason,
                    status: 'PENDING'
                }
            });
            // In Produktion würde hier die Stripe Refund API verwendet werden
            // Für Demo: Markiere als abgeschlossen
            await this.prisma.refund.update({
                where: { id: refund.id },
                data: {
                    status: 'COMPLETED',
                    processedAt: new Date()
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
                amount: refundAmount,
                reason: request.reason
            });
            logger_1.logger.info('Refund created successfully', {
                refundId: refund.id,
                amount: refundAmount
            });
            return this.mapToPaymentDetails(updatedPayment);
        }
        catch (error) {
            logger_1.logger.error('Error creating refund:', error);
            throw error;
        }
    }
    /**
     * Holt Zahlungsstatistiken für Anwalt
     */
    async getLawyerPaymentStats(lawyerId) {
        try {
            const payments = await this.prisma.payment.findMany({
                where: { lawyerId }
            });
            const stats = {
                totalEarnings: 0,
                pendingPayments: 0,
                completedPayments: 0,
                refundedPayments: 0
            };
            for (const payment of payments) {
                if (payment.status === client_1.PaymentStatus.COMPLETED) {
                    stats.totalEarnings += payment.amount - (payment.refundedAmount || 0);
                    stats.completedPayments++;
                }
                else if (payment.status === client_1.PaymentStatus.PENDING) {
                    stats.pendingPayments++;
                }
                else if (payment.status === client_1.PaymentStatus.REFUNDED) {
                    stats.refundedPayments++;
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error getting lawyer payment stats:', error);
            throw error;
        }
    }
    // Helper-Methoden
    calculateDuration(startTime, endTime) {
        return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }
    generateClientSecret(paymentId) {
        // In Produktion würde hier Stripe verwendet werden
        return `pi_${paymentId}_secret_${Math.random().toString(36).substring(2)}`;
    }
    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${year}${month}-${random}`;
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
    mapToInvoice(invoice, payment) {
        const duration = this.calculateDuration(payment.booking.timeSlot.startTime, payment.booking.timeSlot.endTime);
        const hourlyRate = payment.booking.lawyer.hourlyRate || 150;
        return {
            id: invoice.id,
            paymentId: invoice.paymentId,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            currency: invoice.currency,
            taxAmount: invoice.taxAmount,
            totalAmount: invoice.totalAmount,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            pdfUrl: invoice.pdfUrl,
            items: [
                {
                    description: `Rechtsberatung - ${payment.booking.lawyer.name}`,
                    quantity: duration,
                    unitPrice: Math.round((hourlyRate / 60) * 100),
                    totalPrice: invoice.amount,
                    taxRate: 0.19
                }
            ]
        };
    }
}
exports.PaymentService = PaymentService;
