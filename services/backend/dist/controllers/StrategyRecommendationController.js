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
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const MonitoringController_1 = __importDefault(require("../controllers/MonitoringController"));
const aiErrorHandler_1 = __importStar(require("../utils/aiErrorHandler"));
const cacheManager_1 = __importDefault(require("../utils/cacheManager"));
const mlJobProcessor_1 = require("../jobs/mlJobProcessor");
class StrategyRecommendationController {
    /**
     * Generate basic strategy recommendations with error handling and caching
     */
    static async generateBasicRecommendations(req, res, next) {
        const startTime = Date.now();
        let success = false;
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { caseData } = req.body;
            // Prüfe zuerst den Cache
            const cacheKey = `basic_recommendations_${caseData?.id}`;
            const cachedResult = cacheManager_1.default.get('recommendations', cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Basic strategy recommendations retrieved from cache', {
                    userId,
                    caseId: caseData?.id,
                    cacheKey
                });
                // Aktualisiere die Monitoring-Metriken
                const duration = Date.now() - startTime;
                MonitoringController_1.default.recordApiCall('/api/strategy-recommendations/basic', duration, true);
                return res.json({
                    success: true,
                    data: cachedResult,
                    fromCache: true
                });
            }
            // For now, we'll create simple recommendations without ML
            // In a real implementation, this would call the ML functions
            const recommendations = [
                {
                    id: 'rec-1',
                    title: 'Dokumentensammlung',
                    description: 'Sammeln Sie alle relevanten Dokumente für Ihren Fall.',
                    priority: 'high'
                },
                {
                    id: 'rec-2',
                    title: 'Rechtliche Beratung',
                    description: 'Konsultieren Sie einen Anwalt für detaillierte Beratung.',
                    priority: 'medium'
                }
            ];
            const result = {
                recommendations,
                confidence: 0.75
            };
            // Speichere das Ergebnis im Cache für 15 Minuten
            cacheManager_1.default.set('recommendations', cacheKey, result, 900);
            logger_1.logger.info('Basic strategy recommendations generated', {
                userId,
                caseId: caseData?.id,
                recommendationCount: recommendations.length
            });
            success = true;
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            // Behandle KI/ML-spezifische Fehler
            if (error instanceof aiErrorHandler_1.AIProcessingError) {
                const { shouldRetry, retryDelay, userMessage } = aiErrorHandler_1.default.handleAIError(error, {
                    userId: req.user?.id,
                    processType: 'basic_strategy_recommendations',
                    modelName: 'basic-recommendation-model'
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
            MonitoringController_1.default.recordApiCall('/api/strategy-recommendations/basic', duration, success);
        }
    }
    /**
     * Generate enhanced strategy recommendations with error handling and caching
     */
    static async generateEnhancedRecommendations(req, res, next) {
        const startTime = Date.now();
        let success = false;
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { caseData, clientProfile, lawyerProfile, riskAssessment, historicalData } = req.body;
            // Prüfe zuerst den Cache
            const cacheKey = `enhanced_recommendations_${caseData?.id}_${riskAssessment?.id}`;
            const cachedResult = cacheManager_1.default.get('recommendations', cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Enhanced strategy recommendations retrieved from cache', {
                    userId,
                    caseId: caseData?.id,
                    cacheKey
                });
                // Aktualisiere die Monitoring-Metriken
                const duration = Date.now() - startTime;
                MonitoringController_1.default.recordApiCall('/api/strategy-recommendations/enhanced', duration, true);
                MonitoringController_1.default.recordMLProcessing('generateEnhancedRecommendations', duration, true);
                return res.json({
                    success: true,
                    data: cachedResult,
                    fromCache: true
                });
            }
            // Für komplexe Berechnungen verwenden wir asynchrone Job-Verarbeitung
            // Füge den Job zur Warteschlange hinzu
            const jobId = (0, mlJobProcessor_1.addStrategyRecommendationsJob)(caseData, clientProfile, lawyerProfile, riskAssessment, historicalData, 'HIGH', // Hohe Priorität
            userId);
            logger_1.logger.info('Enhanced strategy recommendations job queued', {
                userId,
                caseId: caseData?.id,
                jobId
            });
            success = true;
            // Gib eine sofortige Antwort mit der Job-ID zurück
            res.status(202).json({
                success: true,
                message: 'Die Strategieempfehlungen werden im Hintergrund verarbeitet',
                jobId: jobId,
                statusUrl: `/api/strategy-recommendations/job/${jobId}`
            });
        }
        catch (error) {
            // Behandle KI/ML-spezifische Fehler
            if (error instanceof aiErrorHandler_1.AIProcessingError) {
                const { shouldRetry, retryDelay, userMessage } = aiErrorHandler_1.default.handleAIError(error, {
                    userId: req.user?.id,
                    processType: 'enhanced_strategy_recommendations',
                    modelName: 'enhanced-recommendation-model'
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
            MonitoringController_1.default.recordApiCall('/api/strategy-recommendations/enhanced', duration, success);
            // Beachte: Wir zeichnen die ML-Verarbeitung nicht hier auf, da sie asynchron erfolgt
        }
    }
    /**
     * Generate personalized strategy recommendations with error handling and caching
     */
    static async generatePersonalizedRecommendations(req, res, next) {
        const startTime = Date.now();
        let success = false;
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { caseData, clientProfile, lawyerProfile, riskAssessment, historicalData } = req.body;
            // Prüfe zuerst den Cache
            const cacheKey = `personalized_recommendations_${caseData?.id}_${clientProfile?.id}`;
            const cachedResult = cacheManager_1.default.get('recommendations', cacheKey);
            if (cachedResult) {
                logger_1.logger.info('Personalized strategy recommendations retrieved from cache', {
                    userId,
                    caseId: caseData?.id,
                    cacheKey
                });
                // Aktualisiere die Monitoring-Metriken
                const duration = Date.now() - startTime;
                MonitoringController_1.default.recordApiCall('/api/strategy-recommendations/personalized', duration, true);
                MonitoringController_1.default.recordMLProcessing('generatePersonalizedRecommendations', duration, true);
                return res.json({
                    success: true,
                    data: cachedResult,
                    fromCache: true
                });
            }
            // Für komplexe Berechnungen verwenden wir asynchrone Job-Verarbeitung
            // Füge den Job zur Warteschlange hinzu
            const jobId = (0, mlJobProcessor_1.addStrategyRecommendationsJob)(caseData, clientProfile, lawyerProfile, riskAssessment, historicalData, 'HIGH', // Hohe Priorität
            userId);
            logger_1.logger.info('Personalized strategy recommendations job queued', {
                userId,
                caseId: caseData?.id,
                jobId
            });
            success = true;
            // Gib eine sofortige Antwort mit der Job-ID zurück
            res.status(202).json({
                success: true,
                message: 'Die personalisierten Strategieempfehlungen werden im Hintergrund verarbeitet',
                jobId: jobId,
                statusUrl: `/api/strategy-recommendations/job/${jobId}`
            });
        }
        catch (error) {
            // Behandle KI/ML-spezifische Fehler
            if (error instanceof aiErrorHandler_1.AIProcessingError) {
                const { shouldRetry, retryDelay, userMessage } = aiErrorHandler_1.default.handleAIError(error, {
                    userId: req.user?.id,
                    processType: 'personalized_strategy_recommendations',
                    modelName: 'personalized-recommendation-model'
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
            MonitoringController_1.default.recordApiCall('/api/strategy-recommendations/personalized', duration, success);
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
exports.default = StrategyRecommendationController;
