import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { authenticate, authorize, requireVerified } from '../middleware/auth'
import { UserType } from '@prisma/client'

const router = Router()
const userController = new UserController()

// Alle Routen erfordern Authentifizierung
router.use(authenticate)

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Holt das Benutzerprofil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzerprofil
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/profile', userController.getProfile)

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
 *               language:
 *                 type: string
 *                 enum: [de, en, tr, ar]
 *               accessibilityNeeds:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil erfolgreich aktualisiert
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht authentifiziert
 */
router.put('/profile', userController.updateProfile)

/**
 * @swagger
 * /api/users/preferences:
 *   get:
 *     summary: Holt Benutzereinstellungen
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzereinstellungen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/preferences', userController.getPreferences)

/**
 * @swagger
 * /api/users/preferences:
 *   put:
 *     summary: Aktualisiert Benutzereinstellungen
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
 *               language:
 *                 type: string
 *                 enum: [de, en, tr, ar]
 *     responses:
 *       200:
 *         description: Einstellungen erfolgreich aktualisiert
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht authentifiziert
 */
router.put('/preferences', userController.updatePreferences)

/**
 * @swagger
 * /api/users/verify-email:
 *   post:
 *     summary: Verifiziert die E-Mail-Adresse
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: E-Mail erfolgreich verifiziert
 *       400:
 *         description: Ungültiger Token
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/verify-email', userController.verifyEmail)

/**
 * @swagger
 * /api/users/deactivate:
 *   post:
 *     summary: Deaktiviert das Benutzerkonto
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Konto erfolgreich deaktiviert
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/deactivate', userController.deactivateAccount)

/**
 * @swagger
 * /api/users/export-data:
 *   get:
 *     summary: Exportiert Benutzerdaten (DSGVO)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datenexport
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/export-data', userController.exportUserData)

/**
 * @swagger
 * /api/users/delete-data:
 *   delete:
 *     summary: Löscht Benutzerdaten (DSGVO)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daten erfolgreich gelöscht
 *       401:
 *         description: Nicht authentifiziert
 */
router.delete('/delete-data', userController.deleteUserData)

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Sucht Benutzer (nur Business-Benutzer)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Suchbegriff
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [TENANT, LANDLORD, BUSINESS]
 *         description: Benutzertyp filtern
 *     responses:
 *       200:
 *         description: Suchergebnisse
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/search', authorize(UserType.BUSINESS), userController.searchUsers)

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Holt Benutzerstatistiken (nur Business-Benutzer)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzerstatistiken
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/stats', authorize(UserType.BUSINESS), userController.getUserStats)

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Holt Benutzerdetails
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Benutzerdetails
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Benutzer nicht gefunden
 */
router.get('/:userId', userController.getUserById)

/**
 * @swagger
 * /api/users/{userId}/reactivate:
 *   post:
 *     summary: Reaktiviert einen Benutzer (nur Business-Benutzer)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Benutzer erfolgreich reaktiviert
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Benutzer nicht gefunden
 */
router.post('/:userId/reactivate', authorize(UserType.BUSINESS), userController.reactivateUser)

export default router