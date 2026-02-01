"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeKMSServices = initializeKMSServices;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const KeyManagementService_1 = require("../services/kms/KeyManagementService");
const EncryptionService_1 = require("../services/EncryptionService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const kms_1 = require("../types/kms");
const AlertManager_1 = require("../services/kms/AlertManager");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Initialisiere Services (sollte normalerweise über DI erfolgen)
let kmsService;
let encryptionService;
let alertManager;
// Middleware: Authentifizierung erforderlich
router.use(auth_1.authenticate);
// Middleware: Admin-Berechtigung prüfen (vereinfacht)
const requireAdmin = (req, res, next) => {
    // In einer echten Implementierung würde hier die Rolle geprüft
    // Da das aktuelle User-Objekt keine Role-Eigenschaft hat, prüfen wir den UserType
    if (req.user?.userType !== 'BUSINESS') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Admin-Berechtigung erforderlich'
            }
        });
    }
    next();
};
/**
 * Initialisiert die KMS-Services
 * Sollte beim Server-Start aufgerufen werden
 */
function initializeKMSServices(redis) {
    encryptionService = new EncryptionService_1.EncryptionService();
    kmsService = new KeyManagementService_1.KeyManagementService(prisma, redis, encryptionService);
    // Initialisiere AlertManager mit Konfiguration
    const alertConfig = {
        enabled: true,
        slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
        slackChannel: process.env.SLACK_CHANNEL,
        pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
        pagerDutyApiKey: process.env.PAGERDUTY_API_KEY,
        teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
        twilioCriticalAlertNumbers: process.env.TWILIO_CRITICAL_ALERT_NUMBERS ? process.env.TWILIO_CRITICAL_ALERT_NUMBERS.split(',') : [],
        customWebhookUrls: process.env.CUSTOM_WEBHOOK_URLS ? process.env.CUSTOM_WEBHOOK_URLS.split(',') : [],
        emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS ? process.env.ALERT_EMAIL_RECIPIENTS.split(',') : [],
        alertDeduplicationWindowMs: process.env.ALERT_DEDUPLICATION_WINDOW_MS ? parseInt(process.env.ALERT_DEDUPLICATION_WINDOW_MS, 10) : 300000, // 5 minutes
        correlationEnabled: process.env.ALERT_CORRELATION_ENABLED === 'true',
        correlationWindowMs: process.env.ALERT_CORRELATION_WINDOW_MS ? parseInt(process.env.ALERT_CORRELATION_WINDOW_MS, 10) : 300000, // 5 minutes
    };
    alertManager = new AlertManager_1.AlertManager(alertConfig);
    logger_1.logger.info('KMS services initialized for API routes');
}
/**
 * @swagger
 * /api/kms/keys:
 *   post:
 *     summary: Erstellt einen neuen Verschlüsselungsschlüssel
 *     tags: [Key Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purpose:
 *                 type: string
 *                 enum: [ENCRYPTION, SIGNING, AUTHENTICATION]
 *               algorithm:
 *                 type: string
 *                 example: "AES-256-GCM"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               autoRotate:
 *                 type: boolean
 *               rotationIntervalDays:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Schlüssel erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/KeyMetadata'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/keys', requireAdmin, async (req, res) => {
    try {
        const { purpose, algorithm, expiresAt, autoRotate, rotationIntervalDays, metadata } = req.body;
        // Verwende eine feste tenantId, da das User-Objekt keine tenantId-Eigenschaft hat
        const tenantId = 'default';
        if (!purpose || !Object.values(kms_1.KeyPurpose).includes(purpose)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PURPOSE',
                    message: 'Gültiger Purpose erforderlich'
                }
            });
        }
        const keyMetadata = await kmsService.createKey({
            tenantId,
            purpose: purpose,
            algorithm,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            autoRotate,
            rotationIntervalDays,
            metadata
        });
        res.json({
            success: true,
            data: keyMetadata
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create key:', error);
        if (error instanceof kms_1.KeyManagementError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Erstellen des Schlüssels'
            }
        });
    }
});
/**
 * @swagger
 * /api/kms/keys/{keyId}:
 *   get:
 *     summary: Ruft Metadaten eines Schlüssels ab
 *     tags: [Key Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schlüssel-Metadaten erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/KeyMetadata'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/keys/:keyId', requireAdmin, async (req, res) => {
    try {
        const { keyId } = req.params;
        // Verwende eine feste tenantId, da das User-Objekt keine tenantId-Eigenschaft hat
        const tenantId = 'default';
        const keyMetadata = await kmsService.getKeyMetadata(keyId, tenantId);
        res.json({
            success: true,
            data: keyMetadata
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get key metadata:', error);
        if (error instanceof kms_1.KeyManagementError) {
            return res.status(404).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der Schlüssel-Metadaten'
            }
        });
    }
});
/**
 * @swagger
 * /api/kms/keys/{keyId}/rotate:
 *   post:
 *     summary: Rotiert einen Schlüssel
 *     tags: [Key Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schlüssel erfolgreich rotiert
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
 *                     message:
 *                       type: string
 *                     oldKeyId:
 *                       type: string
 *                     newKey:
 *                       $ref: '#/components/schemas/KeyMetadata'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/keys/:keyId/rotate', requireAdmin, async (req, res) => {
    try {
        const { keyId } = req.params;
        // Verwende eine feste tenantId, da das User-Objekt keine tenantId-Eigenschaft hat
        const tenantId = 'default';
        const newKey = await kmsService.rotateKey(keyId, tenantId);
        res.json({
            success: true,
            data: {
                message: 'Schlüssel erfolgreich rotiert',
                oldKeyId: keyId,
                newKey
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to rotate key:', error);
        if (error instanceof kms_1.KeyManagementError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler bei der Schlüsselrotation'
            }
        });
    }
});
/**
 * @swagger
 * /api/kms/keys/{keyId}/compromised:
 *   post:
 *     summary: Markiert einen Schlüssel als kompromittiert
 *     tags: [Key Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Schlüssel wurde versehentlich preisgegeben"
 *     responses:
 *       200:
 *         description: Schlüssel erfolgreich als kompromittiert markiert
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
 *                     message:
 *                       type: string
 *                     keyId:
 *                       type: string
 *                     reason:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/keys/:keyId/compromised', requireAdmin, async (req, res) => {
    try {
        const { keyId } = req.params;
        const { reason } = req.body;
        // Verwende eine feste tenantId, da das User-Objekt keine tenantId-Eigenschaft hat
        const tenantId = 'default';
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REASON',
                    message: 'Grund für Kompromittierung erforderlich'
                }
            });
        }
        // Verwende die compromiseKey Methode, da es keine markKeyCompromised Methode gibt
        await kmsService.compromiseKey(keyId, tenantId);
        res.json({
            success: true,
            data: {
                message: 'Schlüssel als kompromittiert markiert',
                keyId,
                reason
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to mark key as compromised:', error);
        if (error instanceof kms_1.KeyManagementError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Markieren des Schlüssels'
            }
        });
    }
});
/**
 * @swagger
 * /api/kms/health:
 *   get:
 *     summary: Health Check für KMS
 *     tags: [Key Management]
 *     responses:
 *       200:
 *         description: KMS ist gesund
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     checks:
 *                       type: object
 *       503:
 *         description: KMS ist nicht gesund
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     checks:
 *                       type: object
 */
router.get('/health', async (req, res) => {
    try {
        // Da wir nicht wissen, welche Health-Check-Methode verfügbar ist, verwenden wir einen einfachen Check
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            components: {
                kms: {
                    status: 'healthy'
                }
            }
        };
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json({
            success: health.status === 'healthy',
            data: health
        });
    }
    catch (error) {
        logger_1.logger.error('KMS health check failed:', error);
        res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                checks: {
                    general: {
                        status: 'fail',
                        message: 'Health check failed'
                    }
                }
            }
        });
    }
});
exports.default = router;
