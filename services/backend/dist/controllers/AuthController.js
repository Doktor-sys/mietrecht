"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const TwoFactorAuthService_1 = require("../services/TwoFactorAuthService");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const errorHandler_2 = require("../middleware/errorHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
class AuthController {
    constructor() {
        /**
         * @swagger
         * /api/auth/register:
         *   post:
         *     summary: Benutzer registrieren
         *     tags: [Authentication]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - email
         *               - password
         *               - userType
         *               - acceptedTerms
         *             properties:
         *               email:
         *                 type: string
         *                 format: email
         *                 example: "max@example.com"
         *               password:
         *                 type: string
         *                 minLength: 8
         *                 example: "SecurePass123"
         *               userType:
         *                 type: string
         *                 enum: [TENANT, LANDLORD, BUSINESS]
         *                 example: "TENANT"
         *               acceptedTerms:
         *                 type: boolean
         *                 example: true
         *               firstName:
         *                 type: string
         *                 example: "Max"
         *               lastName:
         *                 type: string
         *                 example: "Mustermann"
         *               location:
         *                 type: string
         *                 example: "Berlin"
         *               language:
         *                 type: string
         *                 enum: [de, en, tr, ar]
         *                 example: "de"
         *     responses:
         *       201:
         *         description: Benutzer erfolgreich registriert
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
         *       409:
         *         $ref: '#/components/responses/ConflictError'
         */
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const registerData = {
                email: req.body.email,
                password: req.body.password,
                userType: req.body.userType,
                acceptedTerms: req.body.acceptedTerms,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                city: req.body.city,
                language: req.body.language
            };
            const result = await this.authService.register(registerData);
            // Log erfolgreiche Registrierung
            logger_1.loggers.httpRequest(req, res, 0);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Registrierung erfolgreich'
            });
        });
        /**
         * @swagger
         * /api/auth/login:
         *   post:
         *     summary: Benutzer anmelden
         *     tags: [Authentication]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - email
         *               - password
         *             properties:
         *               email:
         *                 type: string
         *                 format: email
         *                 example: "max@example.com"
         *               password:
         *                 type: string
         *                 example: "SecurePass123"
         *               twoFactorToken:
         *                 type: string
         *                 description: Optionaler 2FA Token für Benutzer mit aktivierter 2FA
         *                 example: "123456"
         *     responses:
         *       200:
         *         description: Erfolgreich angemeldet
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
         *                     requires2FA:
         *                       type: boolean
         *                       description: Gibt an, ob 2FA erforderlich ist
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         *       429:
         *         $ref: '#/components/responses/RateLimitError'
         */
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const credentials = {
                email: req.body.email,
                password: req.body.password
            };
            const ip = req.ip || req.connection.remoteAddress;
            // Prüfe ob ein 2FA Token mitgesendet wurde
            const twoFactorToken = req.body.twoFactorToken;
            if (twoFactorToken) {
                // Wenn 2FA Token vorhanden ist, verifiziere diesen zuerst
                // Extrahiere userId aus dem temporären Token
                const tempToken = req.headers.authorization?.replace('Bearer ', '');
                if (!tempToken) {
                    throw new errorHandler_2.AuthenticationError('Temporärer Token fehlt');
                }
                try {
                    const decoded = jsonwebtoken_1.default.verify(tempToken, config_1.config.jwt.secret);
                    if (!decoded.tempAuth || !decoded.userId) {
                        throw new errorHandler_2.AuthenticationError('Ungültiger temporärer Token');
                    }
                    // Verifiziere 2FA Token
                    const verificationResult = await this.twoFactorService.verifyTwoFactorToken(decoded.userId, twoFactorToken);
                    if (!verificationResult.success) {
                        throw new errorHandler_2.AuthenticationError(verificationResult.message);
                    }
                    // Generiere volle Tokens
                    const fullResult = await this.authService.login(credentials, ip);
                    res.json({
                        success: true,
                        data: fullResult,
                        message: 'Anmeldung erfolgreich'
                    });
                    return;
                }
                catch (error) {
                    if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                        throw new errorHandler_2.AuthenticationError('Ungültiger temporärer Token');
                    }
                    throw error;
                }
            }
            // Normale Login-Verarbeitung
            const result = await this.authService.login(credentials, ip);
            // Log erfolgreichen Login mit zusätzlichen Informationen
            logger_1.loggers.businessEvent('USER_LOGIN', result.user.id, {
                ip,
                userAgent: req.get('User-Agent'),
                userType: result.user.userType
            });
            res.json({
                success: true,
                data: result,
                message: 'Anmeldung erfolgreich'
            });
        });
        /**
         * @swagger
         * /api/auth/refresh:
         *   post:
         *     summary: Access Token erneuern
         *     tags: [Authentication]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - refreshToken
         *             properties:
         *               refreshToken:
         *                 type: string
         *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
         *     responses:
         *       200:
         *         description: Token erfolgreich erneuert
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
         *                     accessToken:
         *                       type: string
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new errorHandler_2.ValidationError('Refresh Token ist erforderlich');
            }
            const result = await this.authService.refreshToken(refreshToken);
            res.json({
                success: true,
                data: result,
                message: 'Token erfolgreich erneuert'
            });
        });
        /**
         * @swagger
         * /api/auth/logout:
         *   post:
         *     summary: Benutzer abmelden
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Erfolgreich abgemeldet
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
         *                   example: "Erfolgreich abgemeldet"
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const sessionId = req.user?.sessionId;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            await this.authService.logout(userId, sessionId);
            res.json({
                success: true,
                message: 'Erfolgreich abgemeldet'
            });
        });
        /**
         * @swagger
         * /api/auth/me:
         *   get:
         *     summary: Aktuelle Benutzerinformationen abrufen
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Benutzerinformationen erfolgreich abgerufen
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   $ref: '#/components/schemas/User'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.me = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    preferences: true
                }
            });
            if (!user) {
                throw new errorHandler_2.ValidationError('Benutzer nicht gefunden');
            }
            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    userType: user.userType,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    profile: user.profile ? {
                        firstName: user.profile.firstName,
                        lastName: user.profile.lastName,
                        city: user.profile.city,
                        language: user.profile.language
                    } : null,
                    preferences: user.preferences ? {
                        notificationsEnabled: user.preferences.notificationsEnabled,
                        privacy: user.preferences.privacy,
                        language: user.preferences.language,
                        accessibility: user.preferences.accessibility
                    } : null
                }
            });
        });
        /**
         * @swagger
         * /api/auth/forgot-password:
         *   post:
         *     summary: Passwort zurücksetzen anfordern
         *     tags: [Authentication]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - email
         *             properties:
         *               email:
         *                 type: string
         *                 format: email
         *                 example: "max@example.com"
         *     responses:
         *       200:
         *         description: Reset-E-Mail gesendet (falls E-Mail existiert)
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
         *                   example: "Falls die E-Mail-Adresse existiert, wurde eine Reset-E-Mail gesendet"
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         */
        this.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            if (!email) {
                throw new errorHandler_2.ValidationError('E-Mail-Adresse ist erforderlich');
            }
            await this.authService.requestPasswordReset(email);
            // Aus Sicherheitsgründen immer die gleiche Antwort
            res.json({
                success: true,
                message: 'Falls die E-Mail-Adresse existiert, wurde eine Reset-E-Mail gesendet'
            });
        });
        /**
         * @swagger
         * /api/auth/reset-password:
         *   post:
         *     summary: Passwort mit Reset-Token zurücksetzen
         *     tags: [Authentication]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - token
         *               - newPassword
         *             properties:
         *               token:
         *                 type: string
         *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
         *               newPassword:
         *                 type: string
         *                 minLength: 8
         *                 example: "NewSecurePass123"
         *     responses:
         *       200:
         *         description: Passwort erfolgreich zurückgesetzt
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
         *                   example: "Passwort erfolgreich zurückgesetzt"
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                throw new errorHandler_2.ValidationError('Token und neues Passwort sind erforderlich');
            }
            await this.authService.resetPassword(token, newPassword);
            res.json({
                success: true,
                message: 'Passwort erfolgreich zurückgesetzt'
            });
        });
        /**
         * @swagger
         * /api/auth/verify-token:
         *   post:
         *     summary: Token validieren
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Token ist gültig
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
         *                     valid:
         *                       type: boolean
         *                       example: true
         *                     userId:
         *                       type: string
         *                     userType:
         *                       type: string
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.verifyToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            // Wenn wir hier ankommen, ist der Token bereits durch die auth middleware validiert
            res.json({
                success: true,
                data: {
                    valid: true,
                    userId: req.user?.id,
                    userType: req.user?.userType,
                    email: req.user?.email
                }
            });
        });
        /**
         * @swagger
         * /api/auth/verify-email:
         *   post:
         *     summary: E-Mail-Adresse mit Token verifizieren
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
         *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
         *     responses:
         *       200:
         *         description: E-Mail erfolgreich verifiziert
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
         *                   example: "E-Mail-Adresse erfolgreich verifiziert"
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.verifyEmailWithToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { token } = req.body;
            if (!token) {
                throw new errorHandler_2.ValidationError('Verifizierungs-Token ist erforderlich');
            }
            await this.authService.verifyEmailWithToken(token);
            res.json({
                success: true,
                message: 'E-Mail-Adresse erfolgreich verifiziert'
            });
        });
        /**
         * @swagger
         * /api/auth/resend-verification:
         *   post:
         *     summary: Verifizierungs-E-Mail erneut senden
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Verifizierungs-E-Mail gesendet
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
         *                   example: "Verifizierungs-E-Mail wurde gesendet"
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.resendVerificationEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            await this.authService.resendVerificationEmail(userId);
            res.json({
                success: true,
                message: 'Verifizierungs-E-Mail wurde gesendet'
            });
        });
        /**
         * @swagger
         * /api/auth/change-email:
         *   post:
         *     summary: E-Mail-Adresse ändern
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
         *               - newEmail
         *               - password
         *             properties:
         *               newEmail:
         *                 type: string
         *                 format: email
         *                 example: "newemail@example.com"
         *               password:
         *                 type: string
         *                 example: "currentpassword123"
         *     responses:
         *       200:
         *         description: Bestätigungs-E-Mail gesendet
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
         *                   example: "Bestätigungs-E-Mail wurde an die neue Adresse gesendet"
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         *       409:
         *         $ref: '#/components/responses/ConflictError'
         */
        this.changeEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { newEmail, password } = req.body;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            if (!newEmail || !password) {
                throw new errorHandler_2.ValidationError('Neue E-Mail-Adresse und Passwort sind erforderlich');
            }
            await this.authService.changeEmail(userId, newEmail, password);
            res.json({
                success: true,
                message: 'Bestätigungs-E-Mail wurde an die neue Adresse gesendet'
            });
        });
        /**
         * @swagger
         * /api/auth/confirm-email-change:
         *   post:
         *     summary: E-Mail-Änderung bestätigen
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
         *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
         *     responses:
         *       200:
         *         description: E-Mail-Adresse erfolgreich geändert
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
         *                   example: "E-Mail-Adresse erfolgreich geändert"
         *       400:
         *         $ref: '#/components/responses/ValidationError'
         *       401:
         *         $ref: '#/components/responses/AuthenticationError'
         */
        this.confirmEmailChange = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { token } = req.body;
            if (!token) {
                throw new errorHandler_2.ValidationError('Bestätigungs-Token ist erforderlich');
            }
            await this.authService.confirmEmailChange(token);
            res.json({
                success: true,
                message: 'E-Mail-Adresse erfolgreich geändert. Bitte melden Sie sich erneut an.'
            });
        });
        this.authService = new AuthService_1.AuthService(database_1.prisma);
        this.twoFactorService = new TwoFactorAuthService_1.TwoFactorAuthService(database_1.prisma);
    }
}
exports.AuthController = AuthController;
