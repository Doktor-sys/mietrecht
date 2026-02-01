"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyRecommendationsController = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
const recommendationEngine_1 = require("../../../scripts/ml/recommendationEngine");
const enhancedStrategyRecommendations_1 = require("../../../scripts/ml/enhancedStrategyRecommendations");
const documentSummarizer_1 = require("../../../scripts/nlp/documentSummarizer");
const prisma = new client_1.PrismaClient();
class StrategyRecommendationsController {
    /**
     * Generate recommendations for a document
     */
    static async generateDocumentRecommendations(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { documentId } = req.params;
            // Get document from storage
            const document = await prisma.document.findUnique({
                where: {
                    id: documentId,
                    userId: userId
                },
                include: {
                    analysis: true
                }
            });
            if (!document) {
                throw new errorHandler_1.ValidationError('Document not found');
            }
            // Create document object for analysis
            const documentObj = {
                id: document.id,
                content: document.metadata?.textContent || '',
                type: document.documentType
            };
            // Summarize document
            const summary = (0, documentSummarizer_1.summarizeLegalDocument)(documentObj);
            // Generate simple recommendations based on document summary
            const recommendations = [
                {
                    id: "document_review",
                    title: "Dokumentenüberprüfung",
                    description: "Gründliche Überprüfung des Dokuments auf rechtliche Aspekte",
                    priority: "high",
                    confidence: summary.confidence
                },
                {
                    id: "entity_analysis",
                    title: "Entitätenanalyse",
                    description: `Analyse der identifizierten Entitäten: ${summary.entities.totalEntities} gefunden`,
                    priority: "medium",
                    confidence: summary.confidence
                }
            ];
            // Save recommendations
            const savedRecommendations = await prisma.recommendation.create({
                data: {
                    documentId: document.id,
                    userId: userId,
                    strategy: `Dokumentbasierte Strategie: ${summary.summary}`,
                    confidence: summary.confidence,
                    recommendations: {
                        create: recommendations.map(rec => ({
                            ...rec,
                            confidence: rec.confidence || 0.5
                        }))
                    }
                }
            });
            logger_1.logger.info('Document recommendations generated', {
                userId,
                documentId,
                recommendationCount: recommendations.length
            });
            res.json({
                success: true,
                data: savedRecommendations
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate recommendations for a case
     */
    static async generateCaseRecommendations(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { caseId } = req.params;
            const { clientData, lawyerData, riskAssessment, historicalData } = req.body;
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
            // Create case data object
            const caseData = {
                id: caseId,
                documents: documents.map(doc => ({
                    id: doc.id,
                    content: doc.metadata?.textContent || '',
                    type: doc.documentType
                }))
            };
            // Generate recommendations using the recommendation engine
            const recommendations = (0, recommendationEngine_1.generateRecommendations)(caseData, clientData, lawyerData);
            // Save recommendations
            const savedRecommendations = await prisma.recommendation.create({
                data: {
                    caseId: caseId,
                    userId: userId,
                    strategy: recommendations.strategy,
                    confidence: recommendations.confidence,
                    recommendations: {
                        create: recommendations.recommendations.map(rec => ({
                            ...rec,
                            confidence: rec.confidence || 0.5
                        }))
                    }
                }
            });
            logger_1.logger.info('Case recommendations generated', {
                userId,
                caseId,
                recommendationCount: recommendations.recommendations.length
            });
            res.json({
                success: true,
                data: savedRecommendations
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate enhanced recommendations for a document
     */
    static async generateEnhancedDocumentRecommendations(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { documentId } = req.params;
            // Get document from storage
            const document = await prisma.document.findUnique({
                where: {
                    id: documentId,
                    userId: userId
                },
                include: {
                    analysis: true
                }
            });
            if (!document) {
                throw new errorHandler_1.ValidationError('Document not found');
            }
            // Create document object for analysis
            const documentObj = {
                id: document.id,
                content: document.metadata?.textContent || '',
                type: document.documentType
            };
            // Summarize document
            const summary = (0, documentSummarizer_1.summarizeLegalDocument)(documentObj);
            // Generate enhanced recommendations
            const recommendations = [
                {
                    id: "enhanced_document_review",
                    title: "Erweiterte Dokumentenüberprüfung",
                    description: `Detaillierte Analyse des Dokuments mit Fokus auf: ${summary.topics.map(t => t.name).join(", ")}`,
                    priority: "high",
                    confidence: summary.confidence
                },
                {
                    id: "entity_analysis",
                    title: "Erweiterte Entitätenanalyse",
                    description: `Analyse der identifizierten Entitäten: ${summary.entities.totalEntities} gefunden`,
                    priority: "medium",
                    confidence: summary.confidence
                },
                {
                    id: "sentiment_analysis",
                    title: "Stimmungsanalyse",
                    description: `Dokument-Stimmung: ${summary.sentiment.sentiment} (Polarität: ${summary.sentiment.polarity})`,
                    priority: "low",
                    confidence: summary.sentiment.confidence
                }
            ];
            // Save enhanced recommendations
            const savedRecommendations = await prisma.recommendation.create({
                data: {
                    documentId: document.id,
                    userId: userId,
                    strategy: `Erweiterte Dokumentbasierte Strategie: ${summary.summary}`,
                    confidence: summary.confidence,
                    isEnhanced: true,
                    recommendations: {
                        create: recommendations.map(rec => ({
                            ...rec,
                            confidence: rec.confidence || 0.5
                        }))
                    }
                }
            });
            logger_1.logger.info('Enhanced document recommendations generated', {
                userId,
                documentId,
                recommendationCount: recommendations.length
            });
            res.json({
                success: true,
                data: savedRecommendations
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate enhanced recommendations for a case
     */
    static async generateEnhancedCaseRecommendations(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.ValidationError('User not authenticated');
            }
            const { caseId } = req.params;
            const { clientData, lawyerData, riskAssessment, historicalData } = req.body;
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
            // Create case data object
            const caseData = {
                id: caseId,
                documents: documents.map(doc => ({
                    id: doc.id,
                    content: doc.metadata?.textContent || '',
                    type: doc.documentType
                }))
            };
            // For enhanced recommendations, we'll use the enhancedStrategyRecommendations module
            // In a real implementation, this would use actual historical data
            const mockHistoricalData = {
                cases: []
            };
            // Generate enhanced recommendations
            const enhancedRecommendations = (0, enhancedStrategyRecommendations_1.generateEnhancedStrategyRecommendations)(caseData, clientData, lawyerData, riskAssessment, historicalData || mockHistoricalData);
            // Save enhanced recommendations
            const savedRecommendations = await prisma.recommendation.create({
                data: {
                    caseId: caseId,
                    userId: userId,
                    strategy: enhancedRecommendations.strategy,
                    confidence: enhancedRecommendations.confidence,
                    isEnhanced: true,
                    recommendations: {
                        create: enhancedRecommendations.recommendations.map(rec => ({
                            ...rec,
                            confidence: rec.confidence || 0.5
                        }))
                    }
                }
            });
            logger_1.logger.info('Enhanced case recommendations generated', {
                userId,
                caseId,
                recommendationCount: enhancedRecommendations.recommendations.length
            });
            res.json({
                success: true,
                data: savedRecommendations
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StrategyRecommendationsController = StrategyRecommendationsController;
