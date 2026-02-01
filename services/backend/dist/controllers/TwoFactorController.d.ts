import { Request, Response, NextFunction } from 'express';
export declare class TwoFactorController {
    private twoFactorService;
    constructor();
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
    setupTwoFactor: (req: Request, res: Response, next: NextFunction) => void;
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
    verifyTwoFactor: (req: Request, res: Response, next: NextFunction) => void;
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
    verifyLoginTwoFactor: (req: Request, res: Response, next: NextFunction) => void;
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
    disableTwoFactor: (req: Request, res: Response, next: NextFunction) => void;
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
    getTwoFactorStatus: (req: Request, res: Response, next: NextFunction) => void;
}
