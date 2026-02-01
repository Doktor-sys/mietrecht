"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RiskAssessmentController_1 = __importDefault(require("../controllers/RiskAssessmentController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * @swagger
 * /api/risk-assessment/document/{documentId}:
 *   post:
 *     summary: Risikobewertung für ein Dokument durchführen
 *     tags: [Risk Assessment]
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
 *         description: Risikobewertung erfolgreich durchgeführt
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/document/:documentId', RiskAssessmentController_1.default.assessDocumentRisk);
/**
 * @swagger
 * /api/risk-assessment/case/{caseId}:
 *   post:
 *     summary: Risikobewertung für einen Fall durchführen
 *     tags: [Risk Assessment]
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
 *               historicalData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Fall-Risikobewertung erfolgreich durchgeführt
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Fall nicht gefunden
 */
router.post('/case/:caseId', RiskAssessmentController_1.default.assessCaseRisk);
/**
 * @swagger
 * /api/risk-assessment/document/{documentId}/enhanced:
 *   post:
 *     summary: Erweiterte Risikobewertung für ein Dokument durchführen
 *     tags: [Risk Assessment]
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
 *         description: Erweiterte Risikobewertung erfolgreich durchgeführt
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Dokument nicht gefunden
 */
router.post('/document/:documentId/enhanced', RiskAssessmentController_1.default.assessEnhancedDocumentRisk);
/**
 * @swagger
 * /api/risk-assessment/case/{caseId}/enhanced:
 *   post:
 *     summary: Erweiterte Risikobewertung für einen Fall durchführen
 *     tags: [Risk Assessment]
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
 *               historicalData:
 *                 type: object
 *     responses:
 *       202:
 *         description: Aufgabe zur Hintergrundverarbeitung eingereiht
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Fall nicht gefunden
 */
router.post('/case/:caseId/enhanced', RiskAssessmentController_1.default.assessEnhancedCaseRisk);
/**
 * @swagger
 * /api/risk-assessment/job/{jobId}:
 *   get:
 *     summary: Status einer Hintergrundaufgabe abrufen
 *     tags: [Risk Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status der Hintergrundaufgabe
 *       401:
 *         description: Nicht authentifiziert
 *       404:
 *         description: Aufgabe nicht gefunden
 */
router.get('/job/:jobId', RiskAssessmentController_1.default.getJobStatus);
exports.default = router;
