import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { StripePaymentService } from '../services/StripePaymentService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class StripeWebhookController {
  /**
   * POST /api/webhooks/stripe
   * Verarbeitet Stripe Webhook Events
   */
  static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;

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
        logger.error('Stripe configuration missing');
        res.status(500).json({
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Stripe-Konfiguration fehlt'
          }
        });
        return;
      }

      const stripeService = new StripePaymentService(prisma, stripeSecretKey);

      // req.body ist bereits ein Buffer durch express.raw() middleware
      await stripeService.handleWebhook(req.body, signature, webhookSecret);

      res.json({ received: true });
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      next(error);
    }
  }
}
