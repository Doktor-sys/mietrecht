"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
class UserController {
    constructor() {
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
        this.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            const user = await this.userService.getUserById(userId);
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
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    profile: user.profile,
                    preferences: user.preferences
                }
            });
        });
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
        this.getPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            const preferences = await this.userService.getPreferences(userId);
            res.json({
                success: true,
                data: preferences
            });
        });
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
        this.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            const profileData = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                location: req.body.location,
                language: req.body.language,
                accessibilityNeeds: req.body.accessibilityNeeds
            };
            const updatedProfile = await this.userService.updateProfile(userId, profileData);
            res.json({
                success: true,
                data: updatedProfile,
                message: 'Profil erfolgreich aktualisiert'
            });
        });
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
        this.updatePreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            const preferencesData = {
                notifications: req.body.notifications,
                privacy: req.body.privacy,
                language: req.body.language,
                accessibility: req.body.accessibility,
                legalTopics: req.body.legalTopics,
                frequentDocuments: req.body.frequentDocuments,
                alerts: req.body.alerts
            };
            const updatedPreferences = await this.userService.updatePreferences(userId, preferencesData);
            res.json({
                success: true,
                data: updatedPreferences,
                message: 'Präferenzen erfolgreich aktualisiert'
            });
        });
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
        this.deactivateAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            const reason = req.body.reason;
            await this.userService.deactivateUser(userId, reason);
            res.json({
                success: true,
                message: 'Konto erfolgreich deaktiviert'
            });
        });
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
        this.verifyEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            await this.userService.verifyEmail(userId);
            res.json({
                success: true,
                message: 'E-Mail-Adresse erfolgreich verifiziert'
            });
        });
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
        this.searchUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userType = req.user?.userType;
            if (!userType) {
                throw new errorHandler_2.ValidationError('Benutzertyp nicht gefunden');
            }
            const filters = {
                userType: req.query.userType,
                location: req.query.location,
                isVerified: req.query.isVerified ? req.query.isVerified === 'true' : undefined,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
            };
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const result = await this.userService.searchUsers(filters, page, limit, userType);
            res.json({
                success: true,
                data: result
            });
        });
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
        this.getUserStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userType = req.user?.userType;
            if (!userType) {
                throw new errorHandler_2.ValidationError('Benutzertyp nicht gefunden');
            }
            const stats = await this.userService.getUserStats(userType);
            res.json({
                success: true,
                data: stats
            });
        });
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
        this.exportUserData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            const exportData = await this.userService.exportUserData(userId);
            res.json({
                success: true,
                data: exportData,
                message: 'Daten erfolgreich exportiert'
            });
        });
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
        this.deleteUserData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_2.ValidationError('Benutzer-ID nicht gefunden');
            }
            await this.userService.deleteUserData(userId);
            res.json({
                success: true,
                message: 'Alle Benutzerdaten wurden erfolgreich gelöscht'
            });
        });
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
        this.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const requestingUserType = req.user?.userType;
            const targetUserId = req.params.userId;
            // Nur Business-Benutzer dürfen andere Benutzer abrufen
            if (requestingUserType !== client_1.UserType.BUSINESS && req.user?.id !== targetUserId) {
                throw new errorHandler_2.ValidationError('Nicht autorisiert');
            }
            const user = await this.userService.getUserById(targetUserId);
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
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    profile: user.profile,
                    preferences: requestingUserType === client_1.UserType.BUSINESS ? user.preferences : undefined
                }
            });
        });
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
        this.reactivateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const requestingUserType = req.user?.userType;
            const targetUserId = req.params.userId;
            // Nur Business-Benutzer dürfen andere Benutzer reaktivieren
            if (requestingUserType !== client_1.UserType.BUSINESS) {
                throw new errorHandler_2.ValidationError('Nicht autorisiert');
            }
            await this.userService.reactivateUser(targetUserId);
            res.json({
                success: true,
                message: 'Benutzer erfolgreich reaktiviert'
            });
        });
        this.userService = new UserService_1.UserService(database_1.prisma);
    }
}
exports.UserController = UserController;
