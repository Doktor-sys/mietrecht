"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const MonitoringController_1 = __importDefault(require("./MonitoringController"));
const aiErrorHandler_1 = __importStar(require("../utils/aiErrorHandler"));
const cacheManager_1 = __importDefault(require("../utils/cacheManager"));
const mlJobProcessor_1 = require("../jobs/mlJobProcessor");
const prisma = new client_1.PrismaClient();
class RiskAssessmentController {
    /**
     * Assess risk for a document with monitoring and caching
     */
    static async assessDocumentRisk(req, res, next) {
        const startTime = Date.now();
        let success = false;
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { documentId } = req.params;
            // Prüfe zuerst den Cache
            const cacheKey = `document_risk_${documentId}`;
            const cachedResult = cacheManager_1.default.get('risk_assessment', cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Document risk assessment retrieved from cache', {
                    userId,
                    documentId,
                    cacheKey
                });
                // Aktualisiere die Monitoring-Metriken
                const duration = Date.now() - startTime;
                MonitoringController_1.default.recordApiCall('/api/risk-assessment/document/:id', duration, true);
                return res.json({
                    success: true,
                    data: cachedResult,
                    fromCache: true
                });
            }
            // Get document from storage
            const document = await prisma.document.findUnique({
                where: {
                    id: documentId,
                    userId: userId
                }
            });
            if (!document) {
                throw new errorHandler_1.ValidationError('Document not found');
            }
            // For now, we'll create a simple risk assessment without ML
            // In a real implementation, this would call the ML functions
            const riskScore = Math.random();
            let riskLevel = "medium";
            if (riskScore > 0.7) {
                riskLevel = "high";
            }
            else if (riskScore < 0.3) {
                riskLevel = "low";
            }
            // Save risk assessment
            const riskAssessment = await prisma.documentAnalysis.create({
                data: {
                    documentId: document.id,
                    extractedData: {},
                    riskLevel: riskLevel,
                    confidence: riskScore
                }
            });
            // Speichere das Ergebnis im Cache für 30 Minuten
            cacheManager_1.default.set('risk_assessment', cacheKey, riskAssessment, 1800);
            logger_1.logger.info('Document risk assessment completed', {
                userId,
                documentId,
                riskScore,
                riskLevel
            });
            success = true;
            res.json({
                success: true,
                data: riskAssessment
            });
        }
        catch (error) {
            // Behandle KI/ML-spezifische Fehler
            if (error instanceof aiErrorHandler_1.AIProcessingError) {
                const { shouldRetry, retryDelay, userMessage } = aiErrorHandler_1.default.handleAIError(error, {
                    userId: req.user?.id,
                    processType: 'document_risk_assessment',
                    modelName: 'document-risk-model'
                });
                // Wenn eine Wiederholung sinnvoll ist, sende einen entsprechenden Hinweis
                if (shouldRetry) {
                    return res.status(503).json({
                        success: false,
                        error: {
                            message: userMessage,
                            retryAfter: retryDelay
                        }
                    });
                }
                // Andernfalls sende eine allgemeine Fehlermeldung
                return res.status(500).json({
                    success: false,
                    error: {
                        message: userMessage
                    }
                });
            }
            // Für alle anderen Fehler verwenden wir den Standardfehlerhandler
            next(error);
        }
        finally {
            // Record the API call for monitoring
            const duration = Date.now() - startTime;
            MonitoringController_1.default.recordApiCall('/api/risk-assessment/document/:id', duration, success);
        }
    }
    /**
     * Assess risk for a case with monitoring and caching
     */
    static async assessCaseRisk(req, res, next) {
        const startTime = Date.now();
        let success = false;
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { caseId } = req.params;
            const { clientData, historicalData } = req.body;
            // Prüfe zuerst den Cache
            const cacheKey = `case_risk_${caseId}`;
            const cachedResult = cacheManager_1.default.get('risk_assessment', cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Case risk assessment retrieved from cache', {
                    userId,
                    caseId,
                    cacheKey
                });
                // Aktualisiere die Monitoring-Metriken
                const duration = Date.now() - startTime;
                MonitoringController_1.default.recordApiCall('/api/risk-assessment/case/:id', duration, true);
                return res.json({
                    success: true,
                    data: cachedResult,
                    fromCache: true
                });
            }
            // Get case documents
            const documents = await prisma.document.findMany({
                where: {
                    caseId: caseId,
                    userId: userId
                }
            });
            if (documents.length === 0) {
                throw new errorHandler_1.ValidationError('No documents found for this case');
            }
            // For now, we'll create a simple risk assessment without ML
            // In a real implementation, this would call the ML functions
            const riskScore = Math.random();
            let riskLevel = "medium";
            if (riskScore > 0.7) {
                riskLevel = "high";
            }
            else if (riskScore < 0.3) {
                riskLevel = "low";
            }
            // For case risk assessment, we'll create a dummy analysis record
            // In a real implementation, we would have a separate CaseAnalysis model
            const riskAssessment = {
                id: `case-${caseId}`,
                riskScore,
                riskLevel,
                createdAt: new Date()
            };
            // Speichere das Ergebnis im Cache für 30 Minuten
            cacheManager_1.default.set('risk_assessment', cacheKey, riskAssessment, 1800);
            logger_1.logger.info('Case risk assessment completed', {
                userId,
                caseId,
                riskScore,
                riskLevel
            });
            success = true;
            res.json({
                success: true,
                data: riskAssessment
            });
        }
        catch (error) {
            // Behandle KI/ML-spezifische Fehler
            if (error instanceof aiErrorHandler_1.AIProcessingError) {
                const { shouldRetry, retryDelay, userMessage } = aiErrorHandler_1.default.handleAIError(error, {
                    userId: req.user?.id,
                    processType: 'case_risk_assessment',
                    modelName: 'case-risk-model'
                });
                // Wenn eine Wiederholung sinnvoll ist, sende einen entsprechenden Hinweis
                if (shouldRetry) {
                    return res.status(503).json({
                        success: false,
                        error: {
                            message: userMessage,
                            retryAfter: retryDelay
                        }
                    });
                }
                // Andernfalls sende eine allgemeine Fehlermeldung
                return res.status(500).json({
                    success: false,
                    error: {
                        message: userMessage
                    }
                });
            }
            // Für alle anderen Fehler verwenden wir den Standardfehlerhandler
            next(error);
        }
        finally {
            // Record the API call for monitoring
            const duration = Date.now() - startTime;
            MonitoringController_1.default.recordApiCall('/api/risk-assessment/case/:id', duration, success);
        }
    }
    /**
     * Assess enhanced risk for a document with monitoring and caching
     */
    static async assessEnhancedDocumentRisk(req, res, next) {
        const startTime = Date.now();
        let success = false;
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { documentId } = req.params;
            // Prüfe zuerst den Cache
            const cacheKey = `enhanced_document_risk_${documentId}`;
            const cachedResult = cacheManager_1.default.get('risk_assessment', cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Enhanced document risk assessment retrieved from cache', {
                    userId,
                    documentId,
                    cacheKey
                });
                // Aktualisiere die Monitoring-Metriken
                const duration = Date.now() - startTime;
                MonitoringController_1.default.recordApiCall('/api/risk-assessment/document/:id/enhanced', duration, true);
                return res.json({
                    success: true,
                    data: cachedResult,
                    fromCache: true
                });
            }
            // Get document from storage
            const document = await prisma.document.findUnique({
                where: {
                    id: documentId,
                    userId: userId
                }
            });
            if (!document) {
                throw new errorHandler_1.ValidationError('Document not found');
            }
            // For now, we'll create a simple risk assessment without ML
            // In a real implementation, this would call the ML functions
            const riskScore = Math.random();
            let riskLevel = "medium";
            if (riskScore > 0.7) {
                riskLevel = "high";
            }
            else if (riskScore < 0.3) {
                riskLevel = "low";
            }
            // Save risk assessment
            const riskAssessment = await prisma.documentAnalysis.create({
                data: {
                    documentId: document.id,
                    extractedData: {},
                    riskLevel: riskLevel,
                    confidence: riskScore
                }
            });
            // Speichere das Ergebnis im Cache für 30 Minuten
            cacheManager_1.default.set('risk_assessment', cacheKey, riskAssessment, 1800);
            logger_1.logger.info('Enhanced document risk assessment completed', {
                userId,
                documentId,
                riskScore,
                riskLevel
            });
            success = true;
            res.json({
                success: true,
                data: riskAssessment
            });
        }
        catch (error) {
            // Behandle KI/ML-spezifische Fehler
            if (error instanceof aiErrorHandler_1.AIProcessingError) {
                const { shouldRetry, retryDelay, userMessage } = aiErrorHandler_1.default.handleAIError(error, {
                    userId: req.user?.id,
                    processType: 'enhanced_document_risk_assessment',
                    modelName: 'enhanced-document-risk-model'
                });
                // Wenn eine Wiederholung sinnvoll ist, sende einen entsprechenden Hinweis
                if (shouldRetry) {
                    return res.status(503).json({
                        success: false,
                        error: {
                            message: userMessage,
                            retryAfter: retryDelay
                        }
                    });
                }
                // Andernfalls sende eine allgemeine Fehlermeldung
                return res.status(500).json({
                    success: false,
                    error: {
                        message: userMessage
                    }
                });
            }
            // Für alle anderen Fehler verwenden wir den Standardfehlerhandler
            next(error);
        }
        finally {
            // Record the API call for monitoring
            const duration = Date.now() - startTime;
            MonitoringController_1.default.recordApiCall('/api/risk-assessment/document/:id/enhanced', duration, success);
        }
    }
    /**
     * Assess enhanced risk for a case with monitoring, caching and async job processing
     */
    static async assessEnhancedCaseRisk(req, res, next) {
        const startTime = Date.now();
        let success = false;
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { caseId } = req.params;
            const { clientData, historicalData } = req.body;
            // Prüfe zuerst den Cache
            const cacheKey = `enhanced_case_risk_${caseId}`;
            const cachedResult = cacheManager_1.default.get('risk_assessment', cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Enhanced case risk assessment retrieved from cache', {
                    userId,
                    caseId,
                    cacheKey
                });
                // Aktualisiere die Monitoring-Metriken
                const duration = Date.now() - startTime;
                MonitoringController_1.default.recordApiCall('/api/risk-assessment/case/:id/enhanced', duration, true);
                MonitoringController_1.default.recordMLProcessing('assessEnhancedCaseRisk', duration, true);
                return res.json({
                    success: true,
                    data: cachedResult,
                    fromCache: true
                });
            }
            // Get case documents
            const documents = await prisma.document.findMany({
                where: {
                    caseId: caseId,
                    userId: userId
                }
            });
            if (documents.length === 0) {
                throw new errorHandler_1.ValidationError('No documents found for this case');
            }
            // Für komplexe Berechnungen verwenden wir asynchrone Job-Verarbeitung
            // Füge den Job zur Warteschlange hinzu
            const jobId = (0, mlJobProcessor_1.addCaseRiskAssessmentJob)({
                id: caseId,
                type: 'mietrecht',
                documents: documents.map(doc => ({
                    id: doc.id,
                    content: doc.metadata?.textContent || '',
                    type: doc.documentType
                }))
            }, clientData, historicalData, 'HIGH', // Hohe Priorität
            userId);
            logger_1.logger.info('Enhanced case risk assessment job queued', {
                userId,
                caseId,
                jobId
            });
            success = true;
            // Gib eine sofortige Antwort mit der Job-ID zurück
            res.status(202).json({
                success: true,
                message: 'Die Risikobewertung wird im Hintergrund verarbeitet',
                jobId: jobId,
                statusUrl: `/api/risk-assessment/job/${jobId}`
            });
        }
        catch (error) {
            // Behandle KI/ML-spezifische Fehler
            if (error instanceof aiErrorHandler_1.AIProcessingError) {
                const { shouldRetry, retryDelay, userMessage } = aiErrorHandler_1.default.handleAIError(error, {
                    userId: req.user?.id,
                    processType: 'enhanced_case_risk_assessment',
                    modelName: 'enhanced-case-risk-model'
                });
                // Wenn eine Wiederholung sinnvoll ist, sende einen entsprechenden Hinweis
                if (shouldRetry) {
                    return res.status(503).json({
                        success: false,
                        error: {
                            message: userMessage,
                            retryAfter: retryDelay
                        }
                    });
                }
                // Andernfalls sende eine allgemeine Fehlermeldung
                return res.status(500).json({
                    success: false,
                    error: {
                        message: userMessage
                    }
                });
            }
            // Für alle anderen Fehler verwenden wir den Standardfehlerhandler
            next(error);
        }
        finally {
            // Record the API call and ML processing for monitoring
            const duration = Date.now() - startTime;
            MonitoringController_1.default.recordApiCall('/api/risk-assessment/case/:id/enhanced', duration, success);
            // Beachte: Wir zeichnen die ML-Verarbeitung nicht hier auf, da sie asynchron erfolgt
        }
    }
    /**
     * Get the status of an ML job
     */
    static async getJobStatus(req, res, next) {
        try {
            const { jobId } = req.params;
            // In einer echten Implementierung würden wir den Job-Status aus der Datenbank laden
            // Für dieses Beispiel verwenden wir eine vereinfachte Implementierung
            res.json({
                success: true,
                data: {
                    jobId,
                    status: 'PROCESSING',
                    progress: 0.5,
                    estimatedCompletion: new Date(Date.now() + 30000) // 30 Sekunden in der Zukunft
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = RiskAssessmentController;
