import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    private authService;
    private twoFactorService;
    constructor();
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
    register: (req: Request, res: Response, next: NextFunction) => void;
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
    login: (req: Request, res: Response, next: NextFunction) => void;
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
    refreshToken: (req: Request, res: Response, next: NextFunction) => void;
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
    logout: (req: Request, res: Response, next: NextFunction) => void;
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
    me: (req: Request, res: Response, next: NextFunction) => void;
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
    forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
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
    resetPassword: (req: Request, res: Response, next: NextFunction) => void;
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
    verifyToken: (req: Request, res: Response, next: NextFunction) => void;
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
    verifyEmailWithToken: (req: Request, res: Response, next: NextFunction) => void;
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
    resendVerificationEmail: (req: Request, res: Response, next: NextFunction) => void;
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
    changeEmail: (req: Request, res: Response, next: NextFunction) => void;
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
    confirmEmailChange: (req: Request, res: Response, next: NextFunction) => void;
}
