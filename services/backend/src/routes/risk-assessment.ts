import { Router } from 'express';
import RiskAssessmentController from '../controllers/RiskAssessmentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

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
router.post('/document/:documentId', RiskAssessmentController.assessDocumentRisk);

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
router.post('/case/:caseId', RiskAssessmentController.assessCaseRisk);

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
router.post('/document/:documentId/enhanced', RiskAssessmentController.assessEnhancedDocumentRisk);

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
router.post('/case/:caseId/enhanced', RiskAssessmentController.assessEnhancedCaseRisk);

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
router.get('/job/:jobId', RiskAssessmentController.getJobStatus);

export default router;