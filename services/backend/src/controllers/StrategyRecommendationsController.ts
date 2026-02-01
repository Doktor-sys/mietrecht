import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';
import { generateRecommendations } from '../../../scripts/ml/recommendationEngine';
import { generateEnhancedStrategyRecommendations } from '../../../scripts/ml/enhancedStrategyRecommendations';
import { summarizeLegalDocument } from '../../../scripts/nlp/documentSummarizer';

const prisma = new PrismaClient();

export class StrategyRecommendationsController {
  /**
   * Generate recommendations for a document
   */
  static async generateDocumentRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
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
        throw new ValidationError('Document not found');
      }

      // Create document object for analysis
      const documentObj = {
        id: document.id,
        content: document.metadata?.textContent || '',
        type: document.documentType
      };

      // Summarize document
      const summary = summarizeLegalDocument(documentObj);

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

      logger.info('Document recommendations generated', {
        userId,
        documentId,
        recommendationCount: recommendations.length
      });

      res.json({
        success: true,
        data: savedRecommendations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate recommendations for a case
   */
  static async generateCaseRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
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
        throw new ValidationError('No documents found for this case');
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
      const recommendations = generateRecommendations(caseData, clientData, lawyerData);

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

      logger.info('Case recommendations generated', {
        userId,
        caseId,
        recommendationCount: recommendations.recommendations.length
      });

      res.json({
        success: true,
        data: savedRecommendations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate enhanced recommendations for a document
   */
  static async generateEnhancedDocumentRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
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
        throw new ValidationError('Document not found');
      }

      // Create document object for analysis
      const documentObj = {
        id: document.id,
        content: document.metadata?.textContent || '',
        type: document.documentType
      };

      // Summarize document
      const summary = summarizeLegalDocument(documentObj);

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

      logger.info('Enhanced document recommendations generated', {
        userId,
        documentId,
        recommendationCount: recommendations.length
      });

      res.json({
        success: true,
        data: savedRecommendations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate enhanced recommendations for a case
   */
  static async generateEnhancedCaseRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
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
        throw new ValidationError('No documents found for this case');
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
      const enhancedRecommendations = generateEnhancedStrategyRecommendations(
        caseData,
        clientData,
        lawyerData,
        riskAssessment,
        historicalData || mockHistoricalData
      );

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

      logger.info('Enhanced case recommendations generated', {
        userId,
        caseId,
        recommendationCount: enhancedRecommendations.recommendations.length
      });

      res.json({
        success: true,
        data: savedRecommendations
      });
    } catch (error) {
      next(error);
    }
  }
}