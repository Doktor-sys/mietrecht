"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StrategyRecommendationsController_1 = require("../controllers/StrategyRecommendationsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * @swagger
 * /api/strategy-recommendations/document/{documentId}:
 *   post:
 *     summary: Strategieempfehlungen für ein Dokument generieren
 *     tags: [Strategy Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Strategieempfehlungen erfolgreich generiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/document/:documentId', StrategyRecommendationsController_1.StrategyRecommendationsController.generateDocumentRecommendations);
/**
 * @swagger
 * /api/strategy-recommendations/case/{caseId}:
 *   post:
 *     summary: Strategieempfehlungen für einen Fall generieren
 *     tags: [Strategy Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
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
 *               clientData:
 *                 type: object
 *               lawyerData:
 *                 type: object
 *               riskAssessment:
 *                 type: object
 *               historicalData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Fall-Strategieempfehlungen erfolgreich generiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Fall nicht gefunden
 */
router.post('/case/:caseId', StrategyRecommendationsController_1.StrategyRecommendationsController.generateCaseRecommendations);
/**
 * @swagger
 * /api/strategy-recommendations/document/{documentId}/enhanced:
 *   post:
 *     summary: Erweiterte Strategieempfehlungen für ein Dokument generieren
 *     tags: [Strategy Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Erweiterte Strategieempfehlungen erfolgreich generiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/document/:documentId/enhanced', StrategyRecommendationsController_1.StrategyRecommendationsController.generateEnhancedDocumentRecommendations);
/**
 * @swagger
 * /api/strategy-recommendations/case/{caseId}/enhanced:
 *   post:
 *     summary: Erweiterte Strategieempfehlungen für einen Fall generieren
 *     tags: [Strategy Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
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
 *               clientData:
 *                 type: object
 *               lawyerData:
 *                 type: object
 *               riskAssessment:
 *                 type: object
 *               historicalData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Erweiterte Fall-Strategieempfehlungen erfolgreich generiert
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Fall nicht gefunden
 */
router.post('/case/:caseId/enhanced', StrategyRecommendationsController_1.StrategyRecommendationsController.generateEnhancedCaseRecommendations);
exports.default = router;
