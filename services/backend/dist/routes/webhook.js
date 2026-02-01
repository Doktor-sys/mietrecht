"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const StripeWebhookController_1 = require("../controllers/StripeWebhookController");
const router = (0, express_1.Router)();
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
router.post('/stripe', 
// Wichtig: Verwende express.raw() für Stripe Webhooks
express_2.default.raw({ type: 'application/json' }), StripeWebhookController_1.StripeWebhookController.handleWebhook);
exports.default = router;
