import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registriert einen neuen Benutzer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [TENANT, LANDLORD, BUSINESS]
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert
 *       400:
 *         description: Ungültige Eingabedaten
 *       409:
 *         description: Benutzer existiert bereits
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authentifiziert einen Benutzer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentifizierung erfolgreich
 *       401:
 *         description: Ungültige Anmeldedaten
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Erneuert ein abgelaufenes JWT-Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token erfolgreich erneuert
 *       401:
 *         description: Ungültiges Refresh-Token
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Fordert einen Passwort-Zurücksetzen-Link an
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zurücksetzen-Link gesendet
 *       404:
 *         description: Benutzer nicht gefunden
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Setzt das Passwort mit einem Token zurück
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Passwort erfolgreich zurückgesetzt
 *       400:
 *         description: Ungültiges Token oder Passwort
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verifiziert die E-Mail-Adresse eines Benutzers
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: E-Mail erfolgreich verifiziert
 *       400:
 *         description: Ungültiges Verifizierungstoken
 */
router.post('/verify-email', AuthController.verifyEmail);

export default router;