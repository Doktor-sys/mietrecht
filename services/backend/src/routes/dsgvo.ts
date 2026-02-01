import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { EnhancedDSGVOComplianceService } from '../services/EnhancedDSGVOComplianceService';
import { AuditService } from '../services/AuditService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const auditService = new AuditService(prisma);
const dsgvoService = new EnhancedDSGVOComplianceService(prisma, auditService);

/**
 * @swagger
 * /api/dsgvo/data-subject-requests:
 *   post:
 *     summary: Erstellt eine neue Datensubjektanfrage (DSGVO Art. 15-20)
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestType:
 *                 type: string
 *                 enum: [access, rectification, erasure, restriction, portability]
 *               requestData:
 *                 type: object
 *                 description: Zusätzliche Daten für die Anfrage
 *     responses:
 *       201:
 *         description: Datensubjektanfrage erfolgreich erstellt
 *       401:
 *         description: Nicht autorisiert
 */
router.post('/data-subject-requests', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { requestType, requestData } = req.body;

    const request = await dsgvoService.createDataSubjectRequest(userId, requestType, requestData);

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    logger.error('Failed to create data subject request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create data subject request'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/data-subject-requests/{requestId}/process:
 *   post:
 *     summary: Verarbeitet eine Datensubjektanfrage
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response:
 *                 type: object
 *                 description: Antwortdaten für die Anfrage
 *     responses:
 *       200:
 *         description: Datensubjektanfrage erfolgreich verarbeitet
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Nur für Administratoren
 */
router.post('/data-subject-requests/:requestId/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response } = req.body;

    const request = await dsgvoService.processDataSubjectRequest(requestId, response);

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    logger.error('Failed to process data subject request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process data subject request'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/data-subject-requests/{requestId}/reject:
 *   post:
 *     summary: Lehnt eine Datensubjektanfrage ab
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Grund für die Ablehnung
 *     responses:
 *       200:
 *         description: Datensubjektanfrage erfolgreich abgelehnt
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Nur für Administratoren
 */
router.post('/data-subject-requests/:requestId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await dsgvoService.rejectDataSubjectRequest(requestId, reason);

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    logger.error('Failed to reject data subject request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject data subject request'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/data-subject-requests:
 *   get:
 *     summary: Ruft alle Datensubjektanfragen eines Benutzers ab
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datensubjektanfragen erfolgreich abgerufen
 *       401:
 *         description: Nicht autorisiert
 */
router.get('/data-subject-requests', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const requests = await dsgvoService.getDataSubjectRequestsForUser(userId);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    logger.error('Failed to get data subject requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data subject requests'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/data-subject-requests/pending:
 *   get:
 *     summary: Ruft alle ausstehenden Datensubjektanfragen ab (Admin-only)
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ausstehende Datensubjektanfragen erfolgreich abgerufen
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Nur für Administratoren
 */
router.get('/data-subject-requests/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requests = await dsgvoService.getPendingDataSubjectRequests();

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    logger.error('Failed to get pending data subject requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending data subject requests'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/consents:
 *   post:
 *     summary: Gibt eine Einwilligung (DSGVO Art. 7)
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               consentType:
 *                 type: string
 *               consentText:
 *                 type: string
 *               version:
 *                 type: string
 *     responses:
 *       201:
 *         description: Einwilligung erfolgreich erteilt
 *       401:
 *         description: Nicht autorisiert
 */
router.post('/consents', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { consentType, consentText, version } = req.body;

    const consent = await dsgvoService.giveConsent(userId, consentType, consentText, version);

    res.status(201).json({
      success: true,
      data: consent
    });
  } catch (error) {
    logger.error('Failed to give consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to give consent'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/consents/{consentId}/withdraw:
 *   post:
 *     summary: Widerruft eine Einwilligung (DSGVO Art. 7)
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Einwilligung erfolgreich widerrufen
 *       401:
 *         description: Nicht autorisiert
 */
router.post('/consents/:consentId/withdraw', authenticateToken, async (req, res) => {
  try {
    const { consentId } = req.params;

    const consent = await dsgvoService.withdrawConsent(consentId);

    res.json({
      success: true,
      data: consent
    });
  } catch (error) {
    logger.error('Failed to withdraw consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw consent'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/consents:
 *   get:
 *     summary: Ruft alle Einwilligungen eines Benutzers ab
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Einwilligungen erfolgreich abgerufen
 *       401:
 *         description: Nicht autorisiert
 */
router.get('/consents', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const consents = await dsgvoService.getConsentsForUser(userId);

    res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    logger.error('Failed to get consents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consents'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/data-breaches:
 *   post:
 *     summary: Meldet eine Datenschutzverletzung (DSGVO Art. 33)
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               affectedUsers:
 *                 type: integer
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       201:
 *         description: Datenschutzverletzung erfolgreich gemeldet
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Nur für Administratoren
 */
router.post('/data-breaches', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { description, affectedUsers, severity } = req.body;

    await dsgvoService.reportDataBreach(description, affectedUsers, severity);

    res.status(201).json({
      success: true,
      message: 'Data breach reported successfully'
    });
  } catch (error) {
    logger.error('Failed to report data breach:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report data breach'
    });
  }
});

/**
 * @swagger
 * /api/dsgvo/compliance-report:
 *   get:
 *     summary: Generiert einen erweiterten DSGVO-Compliance-Bericht (Admin-only)
 *     tags: [DSGVO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Compliance-Bericht erfolgreich generiert
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Nur für Administratoren
 */
router.get('/compliance-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await dsgvoService.generateEnhancedDSGVOComplianceReport(
      startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate as string) : new Date()
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

export default router;