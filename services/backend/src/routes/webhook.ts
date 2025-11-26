import { Router } from 'express';
import express from 'express';
import { StripeWebhookController } from '../controllers/StripeWebhookController';

const router = Router();

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Stripe Webhook Endpunkt
 *     tags: [Webhooks]
 *     description: Verarbeitet Stripe Webhook Events für Zahlungsbenachrichtigungen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook erfolgreich verarbeitet
 *       400:
 *         description: Ungültige Signatur
 *       500:
 *         description: Serverfehler
 */
router.post(
  '/stripe',
  // Wichtig: Verwende express.raw() für Stripe Webhooks
  express.raw({ type: 'application/json' }),
  StripeWebhookController.handleWebhook
);

export default router;
