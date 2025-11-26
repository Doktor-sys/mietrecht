import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { GDPRComplianceService } from '../services/GDPRComplianceService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const gdprService = new GDPRComplianceService(prisma);

/**
 * @swagger
 * /api/gdpr/export:
 *   post:
 *     summary: Export user data (GDPR Art. 15)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv, pdf]
 *               includeDocuments:
 *                 type: boolean
 *               includeMessages:
 *                 type: boolean
 *               includeAnalytics:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Data export successful
 *       401:
 *         description: Unauthorized
 */
router.post('/export', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { format = 'json', includeDocuments, includeMessages, includeAnalytics } = req.body;

    const result = await gdprService.exportUserData({
      userId,
      format,
      includeDocuments,
      includeMessages,
      includeAnalytics
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('GDPR export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Data export failed'
    });
  }
});

/**
 * @swagger
 * /api/gdpr/delete:
 *   post:
 *     summary: Delete user data (GDPR Art. 17)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               deleteDocuments:
 *                 type: boolean
 *               deleteMessages:
 *                 type: boolean
 *               anonymizeInstead:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Data deletion successful
 *       401:
 *         description: Unauthorized
 */
router.post('/delete', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { reason, deleteDocuments, deleteMessages, anonymizeInstead } = req.body;

    const result = await gdprService.deleteUserData({
      userId,
      reason,
      deleteDocuments,
      deleteMessages,
      anonymizeInstead
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('GDPR deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Data deletion failed'
    });
  }
});

/**
 * @swagger
 * /api/gdpr/consent:
 *   get:
 *     summary: Get user consent settings
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consent settings retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/consent', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const consent = await gdprService.getConsent(userId);

    res.json({
      success: true,
      data: consent
    });
  } catch (error) {
    logger.error('Failed to get consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve consent'
    });
  }
});

/**
 * @swagger
 * /api/gdpr/consent:
 *   put:
 *     summary: Update user consent settings (GDPR Art. 7)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataProcessing:
 *                 type: boolean
 *               analytics:
 *                 type: boolean
 *               marketing:
 *                 type: boolean
 *               thirdPartySharing:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Consent updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/consent', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { dataProcessing, analytics, marketing, thirdPartySharing } = req.body;

    await gdprService.updateConsent({
      userId,
      dataProcessing: dataProcessing !== undefined ? dataProcessing : true,
      analytics: analytics !== undefined ? analytics : false,
      marketing: marketing !== undefined ? marketing : false,
      thirdPartySharing: thirdPartySharing !== undefined ? thirdPartySharing : false,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Consent updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update consent:', error);
    res.status(500).json({
      success: false,
      error: 'Consent update failed'
    });
  }
});

/**
 * @swagger
 * /api/gdpr/compliance-report:
 *   get:
 *     summary: Generate GDPR compliance report (Admin only)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compliance report generated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/compliance-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const report = await gdprService.generateComplianceReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to generate compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Compliance report generation failed'
    });
  }
});

export default router;
