"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BookingController_1 = require("../controllers/BookingController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Alle Routen erfordern Authentifizierung
router.use(auth_1.authenticate);
/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Erstellt eine neue Buchung
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lawyerId
 *               - timeSlotId
 *               - meetingType
 *             properties:
 *               lawyerId:
 *                 type: string
 *               timeSlotId:
 *                 type: string
 *               meetingType:
 *                 type: string
 *                 enum: [VIDEO, PHONE, IN_PERSON]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Buchung erfolgreich erstellt
 *       400:
 *         description: Ungültige Eingabe
 *       409:
 *         description: Zeitslot nicht verfügbar
 */
router.post('/', BookingController_1.BookingController.createBooking);
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Listet alle Buchungen des Nutzers
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED]
 *         description: Filtert nach Buchungsstatus
 *     responses:
 *       200:
 *         description: Liste der Buchungen
 */
router.get('/', BookingController_1.BookingController.getUserBookings);
/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Holt Buchungsdetails
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buchungsdetails
 *       404:
 *         description: Buchung nicht gefunden
 */
router.get('/:id', BookingController_1.BookingController.getBooking);
/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   post:
 *     summary: Bestätigt eine Buchung (nur Anwälte)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buchung bestätigt
 *       403:
 *         description: Keine Berechtigung
 */
router.post('/:id/confirm', BookingController_1.BookingController.confirmBooking);
/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Storniert eine Buchung
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buchung storniert
 */
router.post('/:id/cancel', BookingController_1.BookingController.cancelBooking);
/**
 * @swagger
 * /api/bookings/{id}/complete:
 *   post:
 *     summary: Markiert Buchung als abgeschlossen (nur Anwälte)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buchung abgeschlossen
 */
router.post('/:id/complete', BookingController_1.BookingController.completeBooking);
/**
 * @swagger
 * /api/bookings/{id}/transfer-data:
 *   post:
 *     summary: Überträgt Falldaten an Anwalt
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - summary
 *             properties:
 *               caseId:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *               summary:
 *                 type: string
 *               legalReferences:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Daten erfolgreich übertragen
 */
router.post('/:id/transfer-data', BookingController_1.BookingController.transferConsultationData);
/**
 * @swagger
 * /api/bookings/{id}/case-data:
 *   get:
 *     summary: Holt übertragene Falldaten (nur Anwälte)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Falldaten
 */
router.get('/:id/case-data', BookingController_1.BookingController.getCaseData);
/**
 * @swagger
 * /api/bookings/{id}/start-consultation:
 *   post:
 *     summary: Startet eine Konsultations-Session
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Konsultation gestartet
 */
router.post('/:id/start-consultation', BookingController_1.BookingController.startConsultation);
/**
 * @swagger
 * /api/bookings/{id}/end-consultation:
 *   post:
 *     summary: Beendet eine Konsultations-Session
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Konsultation beendet
 */
router.post('/:id/end-consultation', BookingController_1.BookingController.endConsultation);
/**
 * @swagger
 * /api/lawyers/{lawyerId}/available-slots:
 *   get:
 *     summary: Holt verfügbare Zeitslots für einen Anwalt
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lawyerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Liste verfügbarer Zeitslots
 */
router.get('/lawyers/:lawyerId/available-slots', BookingController_1.BookingController.getAvailableSlots);
/**
 * @swagger
 * /api/lawyers/{lawyerId}/time-slots:
 *   post:
 *     summary: Erstellt Zeitslots für einen Anwalt (nur Anwälte)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lawyerId
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
 *               - slots
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - startTime
 *                     - endTime
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       201:
 *         description: Zeitslots erstellt
 */
router.post('/lawyers/:lawyerId/time-slots', BookingController_1.BookingController.createTimeSlots);
exports.default = router;
