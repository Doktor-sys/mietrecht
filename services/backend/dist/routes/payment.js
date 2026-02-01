"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_1 = require("../controllers/PaymentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
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
router.post('/intent', auth_1.authenticate, ...(0, validation_1.validateRequest)([
    (0, express_validator_1.body)('bookingId').isString().notEmpty().withMessage('Booking ID ist erforderlich')
]), PaymentController_1.PaymentController.createPaymentIntent);
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
router.post('/:paymentId/confirm', auth_1.authenticate, ...(0, validation_1.validateRequest)([
    (0, express_validator_1.param)('paymentId').isString().notEmpty(),
    (0, express_validator_1.body)('transactionId').isString().notEmpty().withMessage('Transaction ID ist erforderlich')
]), PaymentController_1.PaymentController.confirmPayment);
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
router.get('/:paymentId', auth_1.authenticate, ...(0, validation_1.validateRequest)([
    (0, express_validator_1.param)('paymentId').isString().notEmpty()
]), PaymentController_1.PaymentController.getPayment);
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
router.get('/', auth_1.authenticate, PaymentController_1.PaymentController.getUserPayments);
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
router.post('/:paymentId/invoice', auth_1.authenticate, ...(0, validation_1.validateRequest)([
    (0, express_validator_1.param)('paymentId').isString().notEmpty()
]), PaymentController_1.PaymentController.generateInvoice);
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
router.get('/invoices/:invoiceId', auth_1.authenticate, ...(0, validation_1.validateRequest)([
    (0, express_validator_1.param)('invoiceId').isString().notEmpty()
]), PaymentController_1.PaymentController.getInvoice);
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
router.post('/:paymentId/refund', auth_1.authenticate, ...(0, validation_1.validateRequest)([
    (0, express_validator_1.param)('paymentId').isString().notEmpty(),
    (0, express_validator_1.body)('reason').isString().notEmpty().withMessage('Grund ist erforderlich'),
    (0, express_validator_1.body)('amount').optional().isNumeric().withMessage('Betrag muss eine Zahl sein')
]), PaymentController_1.PaymentController.createRefund);
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
router.get('/lawyers/:lawyerId/stats', auth_1.authenticate, ...(0, validation_1.validateRequest)([
    (0, express_validator_1.param)('lawyerId').isString().notEmpty()
]), PaymentController_1.PaymentController.getLawyerPaymentStats);
exports.default = router;
