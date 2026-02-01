"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/lawyers/search:
 *   get:
 *     summary: Anwälte suchen
 *     tags: [Lawyer Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Anwälte erfolgreich gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lawyer'
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/search', (req, res) => {
    res.status(501).json({
        success: false,
        error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Lawyer Search wird in Task 7.1 implementiert',
        },
    });
});
/**
 * @swagger
 * /api/lawyers/{lawyerId}/book:
 *   post:
 *     summary: Beratungstermin buchen
 *     tags: [Lawyer Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lawyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timeSlot
 *               - meetingType
 *             properties:
 *               timeSlot:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date-time
 *                   end:
 *                     type: string
 *                     format: date-time
 *               meetingType:
 *                 type: string
 *                 enum: [video, phone, in_person]
 *     responses:
 *       201:
 *         description: Termin erfolgreich gebucht
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Anwalt nicht gefunden
 */
router.post('/:lawyerId/book', (req, res) => {
    res.status(501).json({
        success: false,
        error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Lawyer Booking wird in Task 7.2 implementiert',
        },
    });
});
exports.default = router;
