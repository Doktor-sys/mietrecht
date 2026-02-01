"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const AuditService_1 = require("../services/AuditService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Middleware: Authentifizierung erforderlich
router.use(auth_1.authenticate);
// Middleware: Admin-Berechtigung prüfen
const requireAdmin = (req, res, next) => {
    // In einer echten Implementierung würde hier die Rolle geprüft
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
router.use(requireAdmin);
/**
 * @swagger
 * /api/security-dashboard/overview:
 *   get:
 *     summary: Ruft Sicherheitsübersicht ab
 *     tags: [Security Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sicherheitsübersicht erfolgreich abgerufen
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
 *                     totalEvents:
 *                       type: integer
 *                     failedLogins:
 *                       type: integer
 *                     securityIncidents:
 *                       type: integer
 *                     activeAlerts:
 *                       type: integer
 *                     keyMetrics:
 *                       type: object
 *                     topUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/overview', async (req, res) => {
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Letzte 24 Stunden
        // Gesamtanzahl Events
        const totalEvents = await prisma.auditLog.count({
            where: {
                timestamp: { gte: since }
            }
        });
        // Fehlgeschlagene Logins
        const failedLogins = await prisma.auditLog.count({
            where: {
                timestamp: { gte: since },
                eventType: AuditService_1.AuditEventType.FAILED_LOGIN
            }
        });
        // Sicherheitsvorfälle
        const securityIncidents = await prisma.auditLog.count({
            where: {
                timestamp: { gte: since },
                eventType: {
                    in: [
                        AuditService_1.AuditEventType.UNAUTHORIZED_ACCESS,
                        AuditService_1.AuditEventType.BRUTE_FORCE_ATTEMPT,
                        AuditService_1.AuditEventType.SECURITY_ALERT,
                        AuditService_1.AuditEventType.KEY_COMPROMISED
                    ]
                }
            }
        });
        // Key Metrics
        const keyMetrics = await prisma.auditLog.groupBy({
            by: ['eventType'],
            where: {
                timestamp: { gte: since },
                eventType: {
                    in: [
                        AuditService_1.AuditEventType.KEY_GENERATED,
                        AuditService_1.AuditEventType.KEY_ROTATED,
                        AuditService_1.AuditEventType.KEY_COMPROMISED
                    ]
                }
            },
            _count: true
        });
        // Top-Nutzer nach fehlgeschlagenen Logins
        const topUsers = await prisma.auditLog.groupBy({
            by: ['userId'],
            where: {
                timestamp: { gte: since },
                eventType: AuditService_1.AuditEventType.FAILED_LOGIN,
                userId: { not: null }
            },
            _count: true,
            orderBy: {
                _count: {
                    userId: 'desc'
                }
            },
            take: 10
        });
        res.json({
            success: true,
            data: {
                totalEvents,
                failedLogins,
                securityIncidents,
                activeAlerts: 0, // In einer echten Implementierung würde man hier aktive Alerts zählen
                keyMetrics,
                topUsers
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get security overview:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der Sicherheitsübersicht'
            }
        });
    }
});
/**
 * @swagger
 * /api/security-dashboard/incidents:
 *   get:
 *     summary: Ruft Sicherheitsvorfälle ab
 *     tags: [Security Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Sicherheitsvorfälle erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/incidents', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const incidents = await prisma.auditLog.findMany({
            where: {
                eventType: {
                    in: [
                        AuditService_1.AuditEventType.UNAUTHORIZED_ACCESS,
                        AuditService_1.AuditEventType.BRUTE_FORCE_ATTEMPT,
                        AuditService_1.AuditEventType.SECURITY_ALERT,
                        AuditService_1.AuditEventType.KEY_COMPROMISED,
                        AuditService_1.AuditEventType.FAILED_LOGIN
                    ]
                }
            },
            take: limit,
            skip: offset,
            orderBy: {
                timestamp: 'desc'
            }
        });
        res.json({
            success: true,
            data: incidents
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get security incidents:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der Sicherheitsvorfälle'
            }
        });
    }
});
/**
 * @swagger
 * /api/security-dashboard/kms-metrics:
 *   get:
 *     summary: Ruft KMS-Metriken ab
 *     tags: [Security Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KMS-Metriken erfolgreich abgerufen
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
 *                     totalKeys:
 *                       type: integer
 *                     activeKeys:
 *                       type: integer
 *                     compromisedKeys:
 *                       type: integer
 *                     rotatedKeys:
 *                       type: integer
 *                     keyDistribution:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/kms-metrics', async (req, res) => {
    try {
        // Gesamtanzahl Keys
        const totalKeys = await prisma.encryptionKey.count();
        // Aktive Keys
        const activeKeys = await prisma.encryptionKey.count({
            where: {
                status: 'active'
            }
        });
        // Kompromittierte Keys
        const compromisedKeys = await prisma.encryptionKey.count({
            where: {
                status: 'compromised'
            }
        });
        // Rotierte Keys (Version > 1)
        const rotatedKeys = await prisma.encryptionKey.count({
            where: {
                version: {
                    gt: 1
                }
            }
        });
        // Key-Verteilung nach Zweck
        const keyDistribution = await prisma.encryptionKey.groupBy({
            by: ['purpose'],
            _count: true
        });
        res.json({
            success: true,
            data: {
                totalKeys,
                activeKeys,
                compromisedKeys,
                rotatedKeys,
                keyDistribution
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get KMS metrics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der KMS-Metriken'
            }
        });
    }
});
/**
 * @swagger
 * /api/security-dashboard/threats:
 *   get:
 *     summary: Ruft aktuelle Bedrohungen ab
 *     tags: [Security Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktuelle Bedrohungen erfolgreich abgerufen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         $ref: '#/components/responses/AuthorizationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/threats', async (req, res) => {
    try {
        const since = new Date(Date.now() - 60 * 60 * 1000); // Letzte Stunde
        // Brute-Force-Versuche
        const bruteForceAttempts = await prisma.auditLog.groupBy({
            by: ['ipAddress'],
            where: {
                timestamp: { gte: since },
                eventType: AuditService_1.AuditEventType.BRUTE_FORCE_ATTEMPT
            },
            _count: true,
            having: {
                ipAddress: {
                    _count: {
                        gte: 5
                    }
                }
            }
        });
        // Verdächtige IP-Adressen
        const suspiciousIPs = await prisma.auditLog.groupBy({
            by: ['ipAddress'],
            where: {
                timestamp: { gte: since },
                eventType: {
                    in: [
                        AuditService_1.AuditEventType.BRUTE_FORCE_ATTEMPT,
                        AuditService_1.AuditEventType.UNAUTHORIZED_ACCESS,
                        AuditService_1.AuditEventType.SECURITY_ALERT
                    ]
                }
            },
            _count: true,
            having: {
                ipAddress: {
                    _count: {
                        gte: 3
                    }
                }
            }
        });
        res.json({
            success: true,
            data: {
                bruteForceAttempts,
                suspiciousIPs
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get threat intelligence:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Fehler beim Abrufen der Bedrohungsdaten'
            }
        });
    }
});
exports.default = router;
