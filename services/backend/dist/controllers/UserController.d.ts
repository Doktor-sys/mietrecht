import { Request, Response } from 'express';
export declare class UserController {
    private userService;
    constructor();
    /**
     * @swagger
     * /api/users/profile:
     *   get:
     *     summary: Benutzerprofil abrufen
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Benutzerprofil erfolgreich abgerufen
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
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/preferences:
     *   get:
     *     summary: Benutzerpräferenzen abrufen
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Benutzerpräferenzen erfolgreich abgerufen
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
     *                     id:
     *                       type: string
     *                     userId:
     *                       type: string
     *                     notifications:
     *                       type: object
     *                     privacy:
     *                       type: object
     *                     language:
     *                       type: string
     *                     accessibility:
     *                       type: object
     *                       nullable: true
     *                     legalTopics:
     *                       type: array
     *                       items:
     *                         type: string
     *                       nullable: true
     *                     frequentDocuments:
     *                       type: array
     *                       items:
     *                         type: string
     *                       nullable: true
     *                     alerts:
     *                       type: object
     *                       nullable: true
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    getPreferences: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/profile:
     *   put:
     *     summary: Benutzerprofil aktualisieren
     *     tags: [User Management]
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
     *               accessibilityNeeds:
     *                 type: object
     *                 properties:
     *                   screenReader:
     *                     type: boolean
     *                   highContrast:
     *                     type: boolean
     *                   largeText:
     *                     type: boolean
     *                   keyboardNavigation:
     *                     type: boolean
     *     responses:
     *       200:
     *         description: Profil erfolgreich aktualisiert
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/UserProfile'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/preferences:
     *   put:
     *     summary: Benutzerpräferenzen aktualisieren
     *     tags: [User Management]
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
     *                 properties:
     *                   email:
     *                     type: boolean
     *                   push:
     *                     type: boolean
     *                   sms:
     *                     type: boolean
     *               privacy:
     *                 type: object
     *                 properties:
     *                   dataSharing:
     *                     type: boolean
     *                   analytics:
     *                     type: boolean
     *                   marketing:
     *                     type: boolean
     *               language:
     *                 type: string
     *                 enum: [de, en, tr, ar]
     *               accessibility:
     *                 type: object
     *                 properties:
     *                   highContrast:
     *                     type: boolean
     *                   dyslexiaFriendly:
     *                     type: boolean
     *                   reducedMotion:
     *                     type: boolean
     *                   largerText:
     *                     type: boolean
     *                   screenReaderMode:
     *                     type: boolean
     *               legalTopics:
     *                 type: array
     *                 items:
     *                   type: string
     *               frequentDocuments:
     *                 type: array
     *                 items:
     *                   type: string
     *               alerts:
     *                 type: object
     *                 properties:
     *                   newCaseLaw:
     *                     type: string
     *                     enum: [instant, daily, weekly, disabled]
     *                   documentUpdates:
     *                     type: string
     *                     enum: [instant, daily, disabled]
     *                   newsletter:
     *                     type: string
     *                     enum: [monthly, disabled]
     *     responses:
     *       200:
     *         description: Präferenzen erfolgreich aktualisiert
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    updatePreferences: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/deactivate:
     *   post:
     *     summary: Benutzerkonto deaktivieren
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               reason:
     *                 type: string
     *                 example: "Benutzer möchte Konto pausieren"
     *     responses:
     *       200:
     *         description: Konto erfolgreich deaktiviert
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    deactivateAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/verify-email:
     *   post:
     *     summary: E-Mail-Adresse verifizieren
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: E-Mail erfolgreich verifiziert
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    verifyEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/search:
     *   get:
     *     summary: Benutzer suchen (nur für Business-Benutzer)
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: userType
     *         schema:
     *           type: string
     *           enum: [TENANT, LANDLORD, BUSINESS]
     *       - in: query
     *         name: location
     *         schema:
     *           type: string
     *       - in: query
     *         name: isVerified
     *         schema:
     *           type: boolean
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *           maximum: 100
     *     responses:
     *       200:
     *         description: Benutzer erfolgreich gefunden
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     users:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/User'
     *                     total:
     *                       type: integer
     *                     page:
     *                       type: integer
     *                     totalPages:
     *                       type: integer
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     *       403:
     *         $ref: '#/components/responses/AuthorizationError'
     */
    searchUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/stats:
     *   get:
     *     summary: Benutzerstatistiken abrufen (nur für Business-Benutzer)
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistiken erfolgreich abgerufen
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     totalUsers:
     *                       type: integer
     *                     activeUsers:
     *                       type: integer
     *                     verifiedUsers:
     *                       type: integer
     *                     usersByType:
     *                       type: object
     *                       properties:
     *                         tenant:
     *                           type: integer
     *                         landlord:
     *                           type: integer
     *                         business:
     *                           type: integer
     *                     usersByLocation:
     *                       type: object
     *                     recentRegistrations:
     *                       type: integer
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     *       403:
     *         $ref: '#/components/responses/AuthorizationError'
     */
    getUserStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/export-data:
     *   get:
     *     summary: Alle Benutzerdaten exportieren (DSGVO)
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Daten erfolgreich exportiert
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     exportDate:
     *                       type: string
     *                       format: date-time
     *                     userData:
     *                       type: object
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    exportUserData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/delete-data:
     *   delete:
     *     summary: Alle Benutzerdaten löschen (DSGVO)
     *     tags: [User Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Daten erfolgreich gelöscht
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     */
    deleteUserData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/{userId}:
     *   get:
     *     summary: Benutzer nach ID abrufen (nur für Business-Benutzer)
     *     tags: [User Management]
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
     *         description: Benutzer erfolgreich abgerufen
     *       401:
     *         $ref: '#/components/responses/AuthenticationError'
     *       403:
     *         $ref: '#/components/responses/AuthorizationError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    getUserById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /api/users/{userId}/reactivate:
     *   post:
     *     summary: Benutzer reaktivieren (nur für Business-Benutzer)
     *     tags: [User Management]
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
     *         $ref: '#/components/responses/AuthenticationError'
     *       403:
     *         $ref: '#/components/responses/AuthorizationError'
     */
    reactivateUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
