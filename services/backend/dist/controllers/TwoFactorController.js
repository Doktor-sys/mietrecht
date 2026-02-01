"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorController = void 0;
const TwoFactorAuthService_1 = require("../services/TwoFactorAuthService");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
class TwoFactorController {
    constructor() {
        /**
         * @swagger
         * /api/auth/2fa/setup:
         *   post:
         *     summary: 2FA für Benutzer initialisieren
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 2FA Setup erfolgreich
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   type: object
         *                   properties:
         *                     qrCodeDataUrl:
         *                       type: string
         *                       description: Data URL für QR Code
         *                     backupCodes:
         *                       type: array
         *                       items:
         *                         type: string
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.setupTwoFactor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer nicht authentifiziert');
            }
            const setupResult = await this.twoFactorService.setupTwoFactor(userId);
            const qrCodeDataUrl = await this.twoFactorService.generateQRCodeDataUrl(setupResult.qrCodeUrl);
            res.json({
                success: true,
                data: {
                    qrCodeDataUrl,
                    backupCodes: setupResult.backupCodes
                }
            });
        });
        /**
         * @swagger
         * /api/auth/2fa/verify:
         *   post:
         *     summary: 2FA Code verifizieren und aktivieren
         *     tags: [Authentication]
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
         *                 description: 6-stelliger TOTP Code
         *                 example: "123456"
         *     responses:
         *       200:
         *         description: 2FA erfolgreich aktiviert
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.verifyTwoFactor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { token } = req.body;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer nicht authentifiziert');
            }
            if (!token) {
                throw new errorHandler_2.ValidationError('TOTP Code ist erforderlich');
            }
            const result = await this.twoFactorService.verifyAndEnableTwoFactor(userId, token);
            res.json({
                success: result.success,
                message: result.message
            });
        });
        /**
         * @swagger
         * /api/auth/2fa/login:
         *   post:
         *     summary: 2FA Code während des Login verifizieren
         *     tags: [Authentication]
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
         *                 description: 6-stelliger TOTP Code oder Backup Code
         *                 example: "123456"
         *     responses:
         *       200:
         *         description: 2FA erfolgreich verifiziert, vollständige Tokens zurückgegeben
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   type: object
         *                   properties:
         *                     user:
         *                       $ref: '#/components/schemas/User'
         *                     tokens:
         *                       type: object
         *                       properties:
         *                         accessToken:
         *                           type: string
         *                         refreshToken:
         *                           type: string
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.verifyLoginTwoFactor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            // Diese Methode wird vom AuthController aufgerufen, wenn ein temporärer Token vorliegt
            // und der 2FA Code verifiziert werden muss
            throw new Error('Diese Methode wird vom AuthController behandelt');
        });
        /**
         * @swagger
         * /api/auth/2fa/disable:
         *   post:
         *     summary: 2FA für Benutzer deaktivieren
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 2FA erfolgreich deaktiviert
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.disableTwoFactor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer nicht authentifiziert');
            }
            await this.twoFactorService.disableTwoFactor(userId);
            res.json({
                success: true,
                message: 'Zwei-Faktor-Authentifizierung erfolgreich deaktiviert'
            });
        });
        /**
         * @swagger
         * /api/auth/2fa/status:
         *   get:
         *     summary: 2FA Status für Benutzer abrufen
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 2FA Status
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   type: object
         *                   properties:
         *                     enabled:
         *                       type: boolean
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.getTwoFactorStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer nicht authentifiziert');
            }
            const enabled = await this.twoFactorService.isTwoFactorEnabled(userId);
            res.json({
                success: true,
                data: {
                    enabled
                }
            });
        });
        this.twoFactorService = new TwoFactorAuthService_1.TwoFactorAuthService(database_1.prisma);
    }
}
exports.TwoFactorController = TwoFactorController;
