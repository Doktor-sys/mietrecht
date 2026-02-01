import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Ruft das Benutzerprofil ab
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzerprofil erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/profile', UserController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Aktualisiert das Benutzerprofil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Benutzerprofil erfolgreich aktualisiert
 *       401:
 *         description: Nicht authentifiziert
 */
router.put('/profile', UserController.updateProfile);

/**
 * @swagger
 * /api/users/preferences:
 *   get:
 *     summary: Ruft die Benutzereinstellungen ab
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzereinstellungen erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/preferences', UserController.getPreferences);

/**
 * @swagger
 * /api/users/preferences:
 *   put:
 *     summary: Aktualisiert die Benutzereinstellungen
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *               privacy:
 *                 type: object
 *     responses:
 *       200:
 *         description: Benutzereinstellungen erfolgreich aktualisiert
 *       401:
 *         description: Nicht authentifiziert
 */
router.put('/preferences', UserController.updatePreferences);

/**
 * @swagger
 * /api/users/sessions:
 *   get:
 *     summary: Ruft aktive Benutzersitzungen ab
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktive Sitzungen erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/sessions', UserController.getActiveSessions);

/**
 * @swagger
 * /api/users/sessions/{sessionId}:
 *   delete:
 *     summary: Beendet eine bestimmte Benutzersitzung
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sitzung erfolgreich beendet
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Sitzung nicht gefunden
 */
router.delete('/sessions/:sessionId', UserController.terminateSession);

export default router;