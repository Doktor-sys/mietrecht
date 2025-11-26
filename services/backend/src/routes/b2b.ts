import { Router } from 'express';
import { authenticateApiKey, requirePermission, apiKeyRateLimit, checkQuota, updateQuota } from '../middleware/apiKeyAuth';
import { B2BController } from '../controllers/B2BController';
import { validateRequest } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router: Router = Router();
const b2bController = new B2BController();

// Middleware für alle B2B-Routen
router.use(authenticateApiKey);
router.use(apiKeyRateLimit);
router.use(checkQuota);
router.use(updateQuota);

/**
 * @swagger
 * /api/b2b/analyze/document:
 *   post:
 *     summary: Analysiere ein Dokument (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [rental_contract, utility_bill, warning_letter, termination]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Dokument erfolgreich analysiert
 *       401:
 *         description: Ungültiger API-Key
 *       429:
 *         description: Rate Limit oder Quota überschritten
 */
router.post('/analyze/document',
  requirePermission('document:analyze'),
  validateRequest([
    body('documentType').isIn(['rental_contract', 'utility_bill', 'warning_letter', 'termination']),
  ]),
  b2bController.analyzeDocument
);

/**
 * @swagger
 * /api/b2b/analyze/batch:
 *   post:
 *     summary: Batch-Analyse mehrerer Dokumente (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     url:
 *                       type: string
 *     responses:
 *       200:
 *         description: Batch-Analyse gestartet
 */
router.post('/analyze/batch',
  requirePermission('document:batch'),
  validateRequest([
    body('documents').isArray({ min: 1, max: 100 }),
    body('documents.*.id').isString(),
    body('documents.*.type').isIn(['rental_contract', 'utility_bill', 'warning_letter', 'termination']),
  ]),
  b2bController.batchAnalyze
);

/**
 * @swagger
 * /api/b2b/chat/query:
 *   post:
 *     summary: KI-Chat-Anfrage (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               context:
 *                 type: object
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: KI-Antwort generiert
 */
router.post('/chat/query',
  requirePermission('chat:query'),
  validateRequest([
    body('query').isString().isLength({ min: 1, max: 5000 }),
    body('sessionId').optional().isString(),
  ]),
  b2bController.chatQuery
);

/**
 * @swagger
 * /api/b2b/templates/generate:
 *   post:
 *     summary: Generiere Musterdokument (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateType:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Dokument generiert
 */
router.post('/templates/generate',
  requirePermission('template:generate'),
  validateRequest([
    body('templateType').isString(),
    body('data').isObject(),
  ]),
  b2bController.generateTemplate
);

/**
 * @swagger
 * /api/b2b/lawyers/search:
 *   get:
 *     summary: Anwaltssuche (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Anwälte gefunden
 */
router.get('/lawyers/search',
  requirePermission('lawyer:search'),
  validateRequest([
    query('location').optional().isString(),
    query('specialization').optional().isString(),
  ]),
  b2bController.searchLawyers
);

/**
 * @swagger
 * /api/b2b/analytics/usage:
 *   get:
 *     summary: Nutzungsstatistiken (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Nutzungsstatistiken
 */
router.get('/analytics/usage',
  requirePermission('analytics:read'),
  validateRequest([
    query('period').optional().isIn(['day', 'week', 'month']),
  ]),
  b2bController.getUsageAnalytics
);

/**
 * @swagger
 * /api/b2b/webhooks:
 *   post:
 *     summary: Webhook-Konfiguration (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Webhook konfiguriert
 */
router.post('/webhooks',
  requirePermission('webhook:manage'),
  validateRequest([
    body('url').isURL(),
    body('events').isArray(),
  ]),
  b2bController.configureWebhook
);

/**
 * @swagger
 * /api/b2b/chat/bulk:
 *   post:
 *     summary: Bulk Chat-Anfragen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               queries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     query:
 *                       type: string
 *                     context:
 *                       type: object
 *               webhookUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk Chat-Job gestartet
 */
router.post('/chat/bulk',
  requirePermission('chat:bulk'),
  validateRequest([
    body('queries').isArray({ min: 1, max: 100 }),
    body('queries.*.query').isString().isLength({ min: 1, max: 5000 }),
    body('webhookUrl').optional().isURL(),
  ]),
  b2bController.bulkChatQuery
);

/**
 * @swagger
 * /api/b2b/bulk/status/{jobId}:
 *   get:
 *     summary: Bulk-Job-Status abrufen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job-Status
 */
router.get('/bulk/status/:jobId',
  requirePermission('bulk:read'),
  validateRequest([
    param('jobId').isString(),
  ]),
  b2bController.getBulkJobStatus
);

/**
 * @swagger
 * /api/b2b/bulk/cancel/{jobId}:
 *   post:
 *     summary: Bulk-Job abbrechen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job abgebrochen
 */
router.post('/bulk/cancel/:jobId',
  requirePermission('bulk:manage'),
  validateRequest([
    param('jobId').isString(),
  ]),
  b2bController.cancelBulkJob
);

/**
 * @swagger
 * /api/b2b/bulk/jobs:
 *   get:
 *     summary: Alle Bulk-Jobs auflisten (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
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
 *         description: Liste der Bulk-Jobs
 */
router.get('/bulk/jobs',
  requirePermission('bulk:read'),
  validateRequest([
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    query('type').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ]),
  b2bController.listBulkJobs
);

/**
 * @swagger
 * /api/b2b/analytics/advanced:
 *   get:
 *     summary: Erweiterte Analytics (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Erweiterte Analytics-Daten
 */
router.get('/analytics/advanced',
  requirePermission('analytics:advanced'),
  validateRequest([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ]),
  b2bController.getAdvancedAnalytics
);

/**
 * @swagger
 * /api/b2b/analytics/report:
 *   get:
 *     summary: Nutzungsbericht generieren (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter]
 *           default: month
 *     responses:
 *       200:
 *         description: Nutzungsbericht
 */
router.get('/analytics/report',
  requirePermission('analytics:read'),
  validateRequest([
    query('period').optional().isIn(['week', 'month', 'quarter']),
  ]),
  b2bController.generateUsageReport
);

/**
 * @swagger
 * /api/b2b/analytics/export:
 *   get:
 *     summary: Analytics exportieren (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Exportierte Analytics-Daten
 */
router.get('/analytics/export',
  requirePermission('analytics:export'),
  validateRequest([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('format').optional().isIn(['json', 'csv', 'pdf']),
  ]),
  b2bController.exportAnalytics
);

/**
 * @swagger
 * /api/b2b/bulk/performance/{jobId}:
 *   get:
 *     summary: Performance-Metriken für Bulk-Job abrufen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance-Metriken
 */
router.get('/bulk/performance/:jobId',
  requirePermission('bulk:read'),
  validateRequest([
    param('jobId').isString(),
  ]),
  b2bController.getBulkJobPerformance
);

/**
 * @swagger
 * /api/b2b/bulk/stats:
 *   get:
 *     summary: Bulk-Processing-Statistiken abrufen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Bulk-Processing-Statistiken
 */
router.get('/bulk/stats',
  requirePermission('bulk:read'),
  validateRequest([
    query('days').optional().isInt({ min: 1, max: 365 }),
  ]),
  b2bController.getBulkProcessingStats
);

/**
 * @swagger
 * /api/b2b/analyze/optimized-batch:
 *   post:
 *     summary: Optimierte Batch-Analyse mit erweiterten Optionen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     content:
 *                       type: string
 *                       format: base64
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *                 default: normal
 *               maxRetries:
 *                 type: integer
 *                 default: 3
 *               batchSize:
 *                 type: integer
 *                 default: 5
 *               timeoutPerItem:
 *                 type: integer
 *                 default: 30
 *               webhookUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Optimierte Batch-Analyse gestartet
 */
router.post('/analyze/optimized-batch',
  requirePermission('document:batch'),
  validateRequest([
    body('documents').isArray({ min: 1, max: 1000 }),
    body('documents.*.id').isString(),
    body('documents.*.type').isIn(['rental_contract', 'utility_bill', 'warning_letter', 'termination']),
    body('documents.*.content').isString(),
    body('priority').optional().isIn(['low', 'normal', 'high']),
    body('maxRetries').optional().isInt({ min: 0, max: 10 }),
    body('batchSize').optional().isInt({ min: 1, max: 20 }),
    body('timeoutPerItem').optional().isInt({ min: 5, max: 300 }),
    body('webhookUrl').optional().isURL(),
  ]),
  b2bController.optimizedBatchAnalyze
);

/**
 * @swagger
 * /api/b2b/status:
 *   get:
 *     summary: API-Status und Limits (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: API-Status
 */
router.get('/status', b2bController.getApiStatus);

export default router;