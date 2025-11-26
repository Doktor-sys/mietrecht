import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /api/payments/intent:
 *   post:
 *     summary: Erstellt einen Payment Intent für eine Buchung
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment Intent erfolgreich erstellt
 *       400:
 *         description: Ungültige Anfrage
 *       401:
 *         description: Nicht authentifiziert
 */
router.post(
  '/intent',
  authenticate,
  ...validateRequest([
    body('bookingId').isString().notEmpty().withMessage('Booking ID ist erforderlich')
  ]),
  PaymentController.createPaymentIntent
);

/**
 * @swagger
 * /api/payments/{paymentId}/confirm:
 *   post:
 *     summary: Bestätigt eine Zahlung
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *             properties:
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zahlung erfolgreich bestätigt
 *       404:
 *         description: Zahlung nicht gefunden
 */
router.post(
  '/:paymentId/confirm',
  authenticate,
  ...validateRequest([
    param('paymentId').isString().notEmpty(),
    body('transactionId').isString().notEmpty().withMessage('Transaction ID ist erforderlich')
  ]),
  PaymentController.confirmPayment
);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Holt Zahlungsdetails
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zahlungsdetails
 *       404:
 *         description: Zahlung nicht gefunden
 */
router.get(
  '/:paymentId',
  authenticate,
  ...validateRequest([
    param('paymentId').isString().notEmpty()
  ]),
  PaymentController.getPayment
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Listet alle Zahlungen des Nutzers
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der Zahlungen
 */
router.get(
  '/',
  authenticate,
  PaymentController.getUserPayments
);

/**
 * @swagger
 * /api/payments/{paymentId}/invoice:
 *   post:
 *     summary: Generiert eine Rechnung für eine Zahlung
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rechnung erfolgreich generiert
 *       404:
 *         description: Zahlung nicht gefunden
 */
router.post(
  '/:paymentId/invoice',
  authenticate,
  ...validateRequest([
    param('paymentId').isString().notEmpty()
  ]),
  PaymentController.generateInvoice
);

/**
 * @swagger
 * /api/invoices/{invoiceId}:
 *   get:
 *     summary: Holt Rechnungsdetails
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rechnungsdetails
 *       404:
 *         description: Rechnung nicht gefunden
 */
router.get(
  '/invoices/:invoiceId',
  authenticate,
  ...validateRequest([
    param('invoiceId').isString().notEmpty()
  ]),
  PaymentController.getInvoice
);

/**
 * @swagger
 * /api/payments/{paymentId}/refund:
 *   post:
 *     summary: Erstellt eine Rückerstattung
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Betrag für Teilerstattung (optional)
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rückerstattung erfolgreich erstellt
 *       404:
 *         description: Zahlung nicht gefunden
 */
router.post(
  '/:paymentId/refund',
  authenticate,
  ...validateRequest([
    param('paymentId').isString().notEmpty(),
    body('reason').isString().notEmpty().withMessage('Grund ist erforderlich'),
    body('amount').optional().isNumeric().withMessage('Betrag muss eine Zahl sein')
  ]),
  PaymentController.createRefund
);

/**
 * @swagger
 * /api/lawyers/{lawyerId}/payment-stats:
 *   get:
 *     summary: Holt Zahlungsstatistiken für Anwalt
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lawyerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zahlungsstatistiken
 */
router.get(
  '/lawyers/:lawyerId/stats',
  authenticate,
  ...validateRequest([
    param('lawyerId').isString().notEmpty()
  ]),
  PaymentController.getLawyerPaymentStats
);

export default router;
