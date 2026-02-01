"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apiKeyAuth_1 = require("../middleware/apiKeyAuth");
const B2BController_1 = require("../controllers/B2BController");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const b2bController = new B2BController_1.B2BController();
// Middleware für alle B2B-Routen
router.use(apiKeyAuth_1.authenticateApiKey);
router.use(apiKeyAuth_1.apiKeyRateLimit);
router.use(apiKeyAuth_1.checkQuota);
router.use(apiKeyAuth_1.updateQuota);
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
router.post('/analyze/document', (0, apiKeyAuth_1.requirePermission)('document:analyze'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('documentType').isIn(['rental_contract', 'utility_bill', 'warning_letter', 'termination']),
]), b2bController.analyzeDocument);
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
router.post('/analyze/batch', (0, apiKeyAuth_1.requirePermission)('document:batch'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('documents').isArray({ min: 1, max: 100 }),
    (0, express_validator_1.body)('documents.*.id').isString(),
    (0, express_validator_1.body)('documents.*.type').isIn(['rental_contract', 'utility_bill', 'warning_letter', 'termination']),
]), b2bController.batchAnalyze);
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
router.post('/chat/query', (0, apiKeyAuth_1.requirePermission)('chat:query'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('query').isString().isLength({ min: 1, max: 5000 }),
    (0, express_validator_1.body)('sessionId').optional().isString(),
]), b2bController.chatQuery);
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
router.post('/templates/generate', (0, apiKeyAuth_1.requirePermission)('template:generate'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('templateType').isString(),
    (0, express_validator_1.body)('data').isObject(),
]), b2bController.generateTemplate);
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
router.get('/lawyers/search', (0, apiKeyAuth_1.requirePermission)('lawyer:search'), (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('location').optional().isString(),
    (0, express_validator_1.query)('specialization').optional().isString(),
]), b2bController.searchLawyers);
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
router.get('/analytics/usage', (0, apiKeyAuth_1.requirePermission)('analytics:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('period').optional().isIn(['day', 'week', 'month']),
]), b2bController.getUsageAnalytics);
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
router.post('/webhooks', (0, apiKeyAuth_1.requirePermission)('webhook:manage'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('url').isURL(),
    (0, express_validator_1.body)('events').isArray(),
]), b2bController.configureWebhook);
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
router.post('/chat/bulk', (0, apiKeyAuth_1.requirePermission)('chat:bulk'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('queries').isArray({ min: 1, max: 100 }),
    (0, express_validator_1.body)('queries.*.query').isString().isLength({ min: 1, max: 5000 }),
    (0, express_validator_1.body)('webhookUrl').optional().isURL(),
]), b2bController.bulkChatQuery);
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
router.get('/bulk/status/:jobId', (0, apiKeyAuth_1.requirePermission)('bulk:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.param)('jobId').isString(),
]), b2bController.getBulkJobStatus);
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
router.post('/bulk/cancel/:jobId', (0, apiKeyAuth_1.requirePermission)('bulk:manage'), (0, validation_1.validateRequest)([
    (0, express_validator_1.param)('jobId').isString(),
]), b2bController.cancelBulkJob);
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
router.get('/bulk/jobs', (0, apiKeyAuth_1.requirePermission)('bulk:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    (0, express_validator_1.query)('type').optional().isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
]), b2bController.listBulkJobs);
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
router.get('/analytics/advanced', (0, apiKeyAuth_1.requirePermission)('analytics:advanced'), (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('groupBy').optional().isIn(['day', 'week', 'month']),
]), b2bController.getAdvancedAnalytics);
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
router.get('/analytics/report', (0, apiKeyAuth_1.requirePermission)('analytics:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('period').optional().isIn(['week', 'month', 'quarter']),
]), b2bController.generateUsageReport);
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
router.get('/analytics/export', (0, apiKeyAuth_1.requirePermission)('analytics:export'), (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('format').optional().isIn(['json', 'csv', 'pdf']),
]), b2bController.exportAnalytics);
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
router.get('/bulk/performance/:jobId', (0, apiKeyAuth_1.requirePermission)('bulk:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.param)('jobId').isString(),
]), b2bController.getBulkJobPerformance);
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
router.get('/bulk/stats', (0, apiKeyAuth_1.requirePermission)('bulk:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 365 }),
]), b2bController.getBulkProcessingStats);
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
router.post('/analyze/optimized-batch', (0, apiKeyAuth_1.requirePermission)('document:batch'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('documents').isArray({ min: 1, max: 1000 }),
    (0, express_validator_1.body)('documents.*.id').isString(),
    (0, express_validator_1.body)('documents.*.type').isIn(['rental_contract', 'utility_bill', 'warning_letter', 'termination']),
    (0, express_validator_1.body)('documents.*.content').isString(),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'normal', 'high']),
    (0, express_validator_1.body)('maxRetries').optional().isInt({ min: 0, max: 10 }),
    (0, express_validator_1.body)('batchSize').optional().isInt({ min: 1, max: 20 }),
    (0, express_validator_1.body)('timeoutPerItem').optional().isInt({ min: 5, max: 300 }),
    (0, express_validator_1.body)('webhookUrl').optional().isURL(),
]), b2bController.optimizedBatchAnalyze);
/**
 * @swagger
 * /api/b2b/partnerships:
 *   post:
 *     summary: Neue Partnerschaft erstellen (B2B)
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
 *               partnerName:
 *                 type: string
 *               partnerType:
 *                 type: string
 *                 enum: [LAW_FIRM, ACCOUNTING, CALENDAR, OTHER]
 *               partnerId:
 *                 type: string
 *               integrationType:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               config:
 *                 type: object
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Partnerschaft erfolgreich erstellt
 */
router.post('/partnerships', (0, apiKeyAuth_1.requirePermission)('partnership:create'), (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('partnerName').isString().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('partnerType').isIn(['LEGAL_TECH', 'REAL_ESTATE', 'FINANCIAL_SERVICES', 'INSURANCE', 'PROPERTY_MANAGEMENT', 'GOVERNMENT', 'NON_PROFIT', 'OTHER']),
    (0, express_validator_1.body)('partnerId').optional().isString(),
    (0, express_validator_1.body)('integrationType').optional().isString(),
    (0, express_validator_1.body)('apiKey').optional().isString(),
    (0, express_validator_1.body)('config').optional().isObject(),
    (0, express_validator_1.body)('contactEmail').optional().isEmail(),
    (0, express_validator_1.body)('contactPhone').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString()
]), b2bController.createPartnership);
/**
 * @swagger
 * /api/b2b/partnerships:
 *   get:
 *     summary: Alle Partnerschaften abrufen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Liste der Partnerschaften
 */
router.get('/partnerships', (0, apiKeyAuth_1.requirePermission)('partnership:read'), b2bController.getPartnerships);
/**
 * @swagger
 * /api/b2b/partnerships/{id}:
 *   get:
 *     summary: Eine spezifische Partnerschaft abrufen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partnerschaftsdaten
 */
router.get('/partnerships/:id', (0, apiKeyAuth_1.requirePermission)('partnership:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.param)('id').isString()
]), b2bController.getPartnershipById);
/**
 * @swagger
 * /api/b2b/partnerships/{id}:
 *   put:
 *     summary: Eine Partnerschaft aktualisieren (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               partnerName:
 *                 type: string
 *               partnerType:
 *                 type: string
 *                 enum: [LAW_FIRM, ACCOUNTING, CALENDAR, OTHER]
 *               partnerId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *               integrationType:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               config:
 *                 type: object
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Partnerschaft erfolgreich aktualisiert
 */
router.put('/partnerships/:id', (0, apiKeyAuth_1.requirePermission)('partnership:update'), (0, validation_1.validateRequest)([
    (0, express_validator_1.param)('id').isString(),
    (0, express_validator_1.body)('partnerName').optional().isString().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('partnerType').optional().isIn(['LEGAL_TECH', 'REAL_ESTATE', 'FINANCIAL_SERVICES', 'INSURANCE', 'PROPERTY_MANAGEMENT', 'GOVERNMENT', 'NON_PROFIT', 'OTHER']),
    (0, express_validator_1.body)('partnerId').optional().isString(),
    (0, express_validator_1.body)('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    (0, express_validator_1.body)('integrationType').optional().isString(),
    (0, express_validator_1.body)('apiKey').optional().isString(),
    (0, express_validator_1.body)('config').optional().isObject(),
    (0, express_validator_1.body)('contactEmail').optional().isEmail(),
    (0, express_validator_1.body)('contactPhone').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString()
]), b2bController.updatePartnership);
/**
 * @swagger
 * /api/b2b/partnerships/{id}:
 *   delete:
 *     summary: Eine Partnerschaft löschen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partnerschaft erfolgreich gelöscht
 */
router.delete('/partnerships/:id', (0, apiKeyAuth_1.requirePermission)('partnership:delete'), (0, validation_1.validateRequest)([
    (0, express_validator_1.param)('id').isString()
]), b2bController.deletePartnership);
/**
 * @swagger
 * /api/b2b/partnerships/{id}/interactions:
 *   get:
 *     summary: Interaktionen einer Partnerschaft abrufen (B2B)
 *     tags: [B2B]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Liste der Interaktionen
 */
router.get('/partnerships/:id/interactions', (0, apiKeyAuth_1.requirePermission)('partnership:read'), (0, validation_1.validateRequest)([
    (0, express_validator_1.param)('id').isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
]), b2bController.getPartnershipInteractions);
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
exports.default = router;
