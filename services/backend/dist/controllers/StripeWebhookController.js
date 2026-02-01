"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeWebhookController = void 0;
const client_1 = require("@prisma/client");
const StripePaymentService_1 = require("../services/StripePaymentService");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class StripeWebhookController {
    /**
     * POST /api/webhooks/stripe
     * Verarbeitet Stripe Webhook Events
     */
    static async handleWebhook(req, res, next) {
        try {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_SIGNATURE',
                        message: 'Stripe-Signatur fehlt'
                    }
                });
                return;
            }
            const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!stripeSecretKey || !webhookSecret) {
                logger_1.logger.error('Stripe configuration missing');
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'CONFIGURATION_ERROR',
                        message: 'Stripe-Konfiguration fehlt'
                    }
                });
                return;
            }
            const stripeService = new StripePaymentService_1.StripePaymentService(prisma, stripeSecretKey);
            // req.body ist bereits ein Buffer durch express.raw() middleware
            await stripeService.handleWebhook(req.body, signature, webhookSecret);
            res.json({ received: true });
        }
        catch (error) {
            logger_1.logger.error('Error handling Stripe webhook:', error);
            next(error);
        }
    }
}
exports.StripeWebhookController = StripeWebhookController;
