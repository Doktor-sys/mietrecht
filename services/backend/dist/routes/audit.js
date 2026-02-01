"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const AuditService_1 = require("../services/AuditService");
const EnhancedAuditService_1 = require("../services/EnhancedAuditService");
const SecurityMonitoringService_1 = require("../services/SecurityMonitoringService");
const ComplianceReportingService_1 = require("../services/ComplianceReportingService");
const AlertManager_1 = require("../services/kms/AlertManager");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const auditService = new AuditService_1.AuditService(prisma);
const enhancedAuditService = new EnhancedAuditService_1.EnhancedAuditService(prisma, process.env.AUDIT_HMAC_KEY || 'default-key');
const alertManager = new AlertManager_1.AlertManager();
const securityMonitoring = new SecurityMonitoringService_1.SecurityMonitoringService(prisma, auditService, alertManager);
const complianceReporting = new ComplianceReportingService_1.ComplianceReportingService(prisma, auditService, securityMonitoring, alertManager);
/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Audit-Logs abfragen
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Audit-Logs erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/logs', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { userId, eventType, startDate, endDate, limit, offset } = req.query;
        const filters = {};
        if (userId)
            filters.userId = userId;
        if (eventType)
            filters.eventType = eventType;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (limit)
            filters.limit = parseInt(limit);
        if (offset)
            filters.offset = parseInt(offset);
        const logs = await auditService.queryLogs(filters);
        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to query audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to query audit logs'
        });
    }
});
/**
 * @swagger
 * /api/audit/logs/export:
 *   get:
 *     summary: Audit-Logs exportieren
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Audit-Logs erfolgreich exportiert
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/logs/export', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        const filters = {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };
        const exportData = await auditService.exportLogs(filters, format);
        const contentType = format === 'csv'
            ? 'text/csv'
            : 'application/json';
        const filename = `audit-logs-${startDate}-${endDate}.${format}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
    }
    catch (error) {
        logger_1.logger.error('Failed to export audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export audit logs'
        });
    }
});
/**
 * @swagger
 * /api/audit/anomalies:
 *   get:
 *     summary: Anomalien erkennen
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeWindowMinutes
 *         schema:
 *           type: integer
 *           default: 60
 *     responses:
 *       200:
 *         description: Anomalien erfolgreich erkannt
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/anomalies', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { userId, tenantId, timeWindowMinutes = '60' } = req.query;
        const anomalies = await auditService.detectAnomalies(undefined, undefined, parseInt(timeWindowMinutes));
        res.json({
            success: true,
            data: anomalies,
            count: anomalies.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to detect anomalies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect anomalies'
        });
    }
});
/**
 * @swagger
 * /api/audit/security/alerts:
 *   get:
 *     summary: Aktive Security-Alerts abrufen
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: Security-Alerts erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/security/alerts', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { severity } = req.query;
        const alerts = securityMonitoring.getActiveAlerts(severity);
        res.json({
            success: true,
            data: alerts,
            count: alerts.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get security alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get security alerts'
        });
    }
});
/**
 * @swagger
 * /api/audit/security/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Security-Alert bestätigen
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert erfolgreich bestätigt
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Alert nicht gefunden
 */
router.post('/security/alerts/:alertId/acknowledge', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { alertId } = req.params;
        const acknowledged = securityMonitoring.acknowledgeAlert(alertId);
        if (!acknowledged) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }
        res.json({
            success: true,
            message: 'Alert acknowledged successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to acknowledge alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge alert'
        });
    }
});
/**
 * @swagger
 * /api/audit/security/metrics:
 *   get:
 *     summary: Security-Metriken abrufen
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Security-Metriken erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/security/metrics', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        const metrics = await securityMonitoring.generateSecurityMetrics(new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate security metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate security metrics'
        });
    }
});
/**
 * @swagger
 * /api/audit/compliance/report:
 *   get:
 *     summary: Compliance-Report generieren
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compliance-Report erfolgreich generiert
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/compliance/report', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, tenantId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        const report = await complianceReporting.generateDetailedReport(new Date(startDate), new Date(endDate), tenantId);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate compliance report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate compliance report'
        });
    }
});
/**
 * @swagger
 * /api/audit/compliance/report/export:
 *   get:
 *     summary: Compliance-Report exportieren
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compliance-Report erfolgreich exportiert
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/compliance/report/export', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate, tenantId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        const report = await complianceReporting.generateDetailedReport(new Date(startDate), new Date(endDate), tenantId);
        let exportData;
        let contentType;
        let fileExtension;
        if (format === 'pdf') {
            exportData = await complianceReporting.exportReportAsPDF(report);
            contentType = 'application/pdf';
            fileExtension = 'pdf';
        }
        else {
            exportData = await complianceReporting.exportReportAsCSV(report);
            contentType = 'text/csv';
            fileExtension = 'csv';
        }
        const filename = `compliance-report-${startDate}-${endDate}.${fileExtension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
    }
    catch (error) {
        logger_1.logger.error('Failed to export compliance report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export compliance report'
        });
    }
});
/**
 * @swagger
 * /api/audit/enhanced/logs:
 *   get:
 *     summary: Erweiterte Audit-Logs abfragen
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: blockHeight
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minBlockHeight
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxBlockHeight
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Erweiterte Audit-Logs erfolgreich abgerufen
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/enhanced/logs', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { userId, eventType, startDate, endDate, blockHeight, minBlockHeight, maxBlockHeight, limit, offset } = req.query;
        const filters = {};
        if (userId)
            filters.userId = userId;
        if (eventType)
            filters.eventType = eventType;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (blockHeight)
            filters.blockHeight = parseInt(blockHeight);
        if (minBlockHeight)
            filters.minBlockHeight = parseInt(minBlockHeight);
        if (maxBlockHeight)
            filters.maxBlockHeight = parseInt(maxBlockHeight);
        if (limit)
            filters.limit = parseInt(limit);
        if (offset)
            filters.offset = parseInt(offset);
        const logs = await enhancedAuditService.queryEnhancedLogs(filters);
        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to query enhanced audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to query enhanced audit logs'
        });
    }
});
/**
 * @swagger
 * /api/audit/enhanced/chain/verify:
 *   post:
 *     summary: Audit-Kette verifizieren
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit-Kettenverifizierung erfolgreich
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.post('/enhanced/chain/verify', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const result = await enhancedAuditService.verifyAuditChain();
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to verify audit chain:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify audit chain'
        });
    }
});
/**
 * @swagger
 * /api/audit/enhanced/anomalies:
 *   get:
 *     summary: Erweiterte Anomalien erkennen
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Erweiterte Anomalien erfolgreich erkannt
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 */
router.get('/enhanced/anomalies', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, tenantId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        const anomalies = await enhancedAuditService.detectEnhancedAnomalies(new Date(startDate), new Date(endDate), tenantId);
        res.json({
            success: true,
            data: anomalies,
            count: anomalies.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to detect enhanced anomalies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect enhanced anomalies'
        });
    }
});
exports.default = router;
