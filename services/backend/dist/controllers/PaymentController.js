"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const client_1 = require("@prisma/client");
const PaymentService_1 = require("../services/PaymentService");
const StripePaymentService_1 = require("../services/StripePaymentService");
const prisma = new client_1.PrismaClient();
const paymentService = new PaymentService_1.PaymentService(prisma);
// Verwende Stripe wenn konfiguriert, sonst Mock-Service
const useStripe = process.env.STRIPE_SECRET_KEY && process.env.USE_STRIPE === 'true';
const stripeService = useStripe
    ? new StripePaymentService_1.StripePaymentService(prisma, process.env.STRIPE_SECRET_KEY)
    : null;
class PaymentController {
    /**
     * POST /api/payments/intent
     * Erstellt einen Payment Intent für eine Buchung
     */
    static async createPaymentIntent(req, res, next) {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentifizierung erforderlich'
                    }
                });
                return;
            }
            // Verwende Stripe oder Mock-Service
            const service = stripeService || paymentService;
            const paymentIntent = await service.createPaymentIntent(bookingId, userId);
            res.status(201).json({
                success: true,
                data: paymentIntent
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/payments/:paymentId/confirm
     * Bestätigt eine Zahlung
     */
    static async confirmPayment(req, res, next) {
        try {
            const { paymentId } = req.params;
            const { transactionId } = req.body;
            if (!transactionId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Transaction ID ist erforderlich'
                    }
                });
                return;
            }
            // Verwende Stripe oder Mock-Service
            const service = stripeService || paymentService;
            const payment = await service.confirmPayment(paymentId, transactionId);
            res.json({
                success: true,
                data: payment
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/payments/:paymentId
     * Holt Zahlungsdetails
     */
    static async getPayment(req, res, next) {
        try {
            const { paymentId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentifizierung erforderlich'
                    }
                });
                return;
            }
            const payment = await paymentService.getPayment(paymentId, userId);
            res.json({
                success: true,
                data: payment
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/payments
     * Listet alle Zahlungen des Nutzers
     */
    static async getUserPayments(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentifizierung erforderlich'
                    }
                });
                return;
            }
            const payments = await paymentService.getUserPayments(userId);
            res.json({
                success: true,
                data: payments
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/payments/:paymentId/invoice
     * Generiert eine Rechnung
     */
    static async generateInvoice(req, res, next) {
        try {
            const { paymentId } = req.params;
            const invoice = await paymentService.generateInvoice(paymentId);
            res.json({
                success: true,
                data: invoice
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/invoices/:invoiceId
     * Holt Rechnungsdetails
     */
    static async getInvoice(req, res, next) {
        try {
            const { invoiceId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentifizierung erforderlich'
                    }
                });
                return;
            }
            const invoice = await paymentService.getInvoice(invoiceId, userId);
            res.json({
                success: true,
                data: invoice
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/payments/:paymentId/refund
     * Erstellt eine Rückerstattung
     */
    static async createRefund(req, res, next) {
        try {
            const { paymentId } = req.params;
            const { amount, reason } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentifizierung erforderlich'
                    }
                });
                return;
            }
            if (!reason) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Grund für Rückerstattung ist erforderlich'
                    }
                });
                return;
            }
            // Verwende Stripe oder Mock-Service
            const service = stripeService || paymentService;
            const payment = await service.createRefund({ paymentId, amount, reason }, userId);
            res.json({
                success: true,
                data: payment
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/lawyers/:lawyerId/payment-stats
     * Holt Zahlungsstatistiken für Anwalt
     */
    static async getLawyerPaymentStats(req, res, next) {
        try {
            const { lawyerId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentifizierung erforderlich'
                    }
                });
                return;
            }
            // In Produktion: Prüfe ob userId der Anwalt ist
            const stats = await paymentService.getLawyerPaymentStats(lawyerId);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
