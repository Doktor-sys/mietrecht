import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { AuditService, AuditEventType } from '../services/AuditService';
import { SecurityMonitoringService } from '../services/SecurityMonitoringService';
import { ComplianceReportingService } from '../services/ComplianceReportingService';
import { logger } from '../utils/logger';

const router: Router = express.Router();
const prisma = new PrismaClient();
const auditService = new AuditService(prisma);
const securityMonitoring = new SecurityMonitoringService(prisma, auditService);
const complianceReporting = new ComplianceReportingService(
  prisma,
  auditService,
  securityMonitoring
);

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
router.get('/logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      eventType,
      startDate,
      endDate,
      limit,
      offset
    } = req.query;

    const filters: any = {};
    
    if (userId) filters.userId = userId as string;
    if (eventType) filters.eventType = eventType as AuditEventType;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const logs = await auditService.queryLogs(filters);

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('Failed to query audit logs:', error);
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
router.get('/logs/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const exportData = await auditService.exportLogs(
      filters,
      format as 'json' | 'csv'
    );

    const contentType = format === 'csv' 
      ? 'text/csv' 
      : 'application/json';
    
    const filename = `audit-logs-${startDate}-${endDate}.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    logger.error('Failed to export audit logs:', error);
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
router.get('/anomalies', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, tenantId, timeWindowMinutes = '60' } = req.query;

    const anomalies = await auditService.detectAnomalies(
      userId as string | undefined,
      tenantId as string | undefined,
      parseInt(timeWindowMinutes as string)
    );

    res.json({
      success: true,
      data: anomalies,
      count: anomalies.length
    });
  } catch (error) {
    logger.error('Failed to detect anomalies:', error);
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
router.get('/security/alerts', authenticate, requireAdmin, async (req, res) => {
  try {
    const { severity } = req.query;

    const alerts = securityMonitoring.getActiveAlerts(
      severity as 'low' | 'medium' | 'high' | 'critical' | undefined
    );

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    logger.error('Failed to get security alerts:', error);
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
router.post('/security/alerts/:alertId/acknowledge', authenticate, requireAdmin, async (req, res) => {
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
  } catch (error) {
    logger.error('Failed to acknowledge alert:', error);
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
router.get('/security/metrics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const metrics = await securityMonitoring.generateSecurityMetrics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to generate security metrics:', error);
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
router.get('/compliance/report', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, tenantId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const report = await complianceReporting.generateDetailedReport(
      new Date(startDate as string),
      new Date(endDate as string),
      tenantId as string | undefined
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to generate compliance report:', error);
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
router.get('/compliance/report/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, tenantId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const report = await complianceReporting.generateDetailedReport(
      new Date(startDate as string),
      new Date(endDate as string),
      tenantId as string | undefined
    );

    let exportData: Buffer | string;
    let contentType: string;
    let fileExtension: string;

    if (format === 'pdf') {
      exportData = await complianceReporting.exportReportAsPDF(report);
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      exportData = await complianceReporting.exportReportAsCSV(report);
      contentType = 'text/csv';
      fileExtension = 'csv';
    }

    const filename = `compliance-report-${startDate}-${endDate}.${fileExtension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    logger.error('Failed to export compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export compliance report'
    });
  }
});

export default router;
