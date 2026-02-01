import { StrategyRecommendationsController } from '../../controllers/StrategyRecommendationsController';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { generateRecommendations } from '../../../../scripts/ml/recommendationEngine';
import { generateEnhancedStrategyRecommendations } from '../../../../scripts/ml/enhancedStrategyRecommendations';
import { summarizeLegalDocument } from '../../../../scripts/nlp/documentSummarizer';

// Mock the modules
jest.mock('@prisma/client');
jest.mock('../../utils/logger');
jest.mock('../../../../scripts/ml/recommendationEngine');
jest.mock('../../../../scripts/ml/enhancedStrategyRecommendations');
jest.mock('../../../../scripts/nlp/documentSummarizer');

// Mock the express request and response objects
const mockRequest = () => {
  const req: any = {};
  req.user = { id: 'user123' };
  req.params = {};
  req.body = {};
  return req;
};

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('StrategyRecommendationsController', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    (prisma as any).document = {
      findUnique: jest.fn(),
      findMany: jest.fn()
    };
    (prisma as any).recommendation = {
      create: jest.fn()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateDocumentRecommendations', () => {
    it('should generate recommendations for a document successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      req.params.documentId = 'doc123';
      
      // Mock document retrieval
      (prisma.document.findUnique as jest.Mock).mockResolvedValue({
        id: 'doc123',
        metadata: { textContent: 'Sample document content' },
        documentType: 'RENTAL_CONTRACT'
      });
      
      // Mock document summarization
      (summarizeLegalDocument as jest.Mock).mockReturnValue({
        summary: 'Document summary',
        confidence: 0.8,
        entities: { totalEntities: 5 },
        topics: [{ name: 'Mietvertrag' }]
      });
      
      // Mock recommendation creation
      (prisma.recommendation.create as jest.Mock).mockResolvedValue({
        id: 'rec123',
        documentId: 'doc123',
        userId: 'user123',
        strategy: 'Document-based strategy: Document summary',
        confidence: 0.8
      });
      
      await StrategyRecommendationsController.generateDocumentRecommendations(req, res, next);
      
      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'doc123',
          userId: 'user123'
        },
        include: {
          analysis: true
        }
      });
      
      expect(summarizeLegalDocument).toHaveBeenCalledWith({
        id: 'doc123',
        content: 'Sample document content',
        type: 'RENTAL_CONTRACT'
      });
      
      expect(prisma.recommendation.create).toHaveBeenCalledWith({
        data: {
          documentId: 'doc123',
          userId: 'user123',
          strategy: 'Document-based strategy: Document summary',
          confidence: 0.8,
          recommendations: {
            create: [
              {
                id: "document_review",
                title: "Dokumentenüberprüfung",
                description: "Gründliche Überprüfung des Dokuments auf rechtliche Aspekte",
                priority: "high",
                confidence: 0.8
              },
              {
                id: "entity_analysis",
                title: "Entitätenanalyse",
                description: "Analyse der identifizierten Entitäten: 5 gefunden",
                priority: "medium",
                confidence: 0.8
              }
            ]
          }
        }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'rec123',
          documentId: 'doc123',
          userId: 'user123',
          strategy: 'Document-based strategy: Document summary',
          confidence: 0.8
        }
      });
    });
    
    it('should handle document not found error', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      req.params.documentId = 'doc123';
      
      // Mock document not found
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);
      
      await StrategyRecommendationsController.generateDocumentRecommendations(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Document not found'
      }));
    });
  });
  
  describe('generateCaseRecommendations', () => {
    it('should generate recommendations for a case successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      req.params.caseId = 'case123';
      req.body = {
        clientData: { id: 'client123' },
        lawyerData: { id: 'lawyer123' },
        riskAssessment: { score: 0.6 },
        historicalData: { cases: [] }
      };
      
      // Mock document retrieval
      (prisma.document.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'doc123',
          metadata: { textContent: 'Sample document content' },
          documentType: 'RENTAL_CONTRACT'
        }
      ]);
      
      // Mock recommendation generation
      (generateRecommendations as jest.Mock).mockReturnValue({
        strategy: 'Case strategy',
        confidence: 0.7,
        recommendations: [
          {
            id: 'rec1',
            title: 'Recommendation 1',
            description: 'Description 1',
            priority: 'high',
            confidence: 0.7
          }
        ]
      });
      
      // Mock recommendation creation
      (prisma.recommendation.create as jest.Mock).mockResolvedValue({
        id: 'rec123',
        caseId: 'case123',
        userId: 'user123',
        strategy: 'Case strategy',
        confidence: 0.7
      });
      
      await StrategyRecommendationsController.generateCaseRecommendations(req, res, next);
      
      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: {
          caseId: 'case123',
          userId: 'user123'
        }
      });
      
      expect(generateRecommendations).toHaveBeenCalledWith(
        {
          id: 'case123',
          documents: [
            {
              id: 'doc123',
              content: 'Sample document content',
              type: 'RENTAL_CONTRACT'
            }
          ]
        },
        { id: 'client123' },
        { id: 'lawyer123' }
      );
      
      expect(prisma.recommendation.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case123',
          userId: 'user123',
          strategy: 'Case strategy',
          confidence: 0.7,
          recommendations: {
            create: [
              {
                id: 'rec1',
                title: 'Recommendation 1',
                description: 'Description 1',
                priority: 'high',
                confidence: 0.7
              }
            ]
          }
        }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'rec123',
          caseId: 'case123',
          userId: 'user123',
          strategy: 'Case strategy',
          confidence: 0.7
        }
      });
    });
    
    it('should handle no documents found error', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      req.params.caseId = 'case123';
      
      // Mock no documents found
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);
      
      await StrategyRecommendationsController.generateCaseRecommendations(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No documents found for this case'
      }));
    });
  });
  
  describe('generateEnhancedCaseRecommendations', () => {
    it('should generate enhanced recommendations for a case successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      req.params.caseId = 'case123';
      req.body = {
        clientData: { id: 'client123' },
        lawyerData: { id: 'lawyer123' },
        riskAssessment: { score: 0.6 },
        historicalData: { cases: [] }
      };
      
      // Mock document retrieval
      (prisma.document.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'doc123',
          metadata: { textContent: 'Sample document content' },
          documentType: 'RENTAL_CONTRACT'
        }
      ]);
      
      // Mock enhanced recommendation generation
      (generateEnhancedStrategyRecommendations as jest.Mock).mockReturnValue({
        strategy: 'Enhanced case strategy',
        confidence: 0.9,
        recommendations: [
          {
            id: 'en_rec1',
            title: 'Enhanced Recommendation 1',
            description: 'Enhanced Description 1',
            priority: 'high',
            confidence: 0.9
          }
        ]
      });
      
      // Mock recommendation creation
      (prisma.recommendation.create as jest.Mock).mockResolvedValue({
        id: 'rec123',
        caseId: 'case123',
        userId: 'user123',
        strategy: 'Enhanced case strategy',
        confidence: 0.9,
        isEnhanced: true
      });
      
      await StrategyRecommendationsController.generateEnhancedCaseRecommendations(req, res, next);
      
      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: {
          caseId: 'case123',
          userId: 'user123'
        }
      });
      
      expect(generateEnhancedStrategyRecommendations).toHaveBeenCalledWith(
        {
          id: 'case123',
          documents: [
            {
              id: 'doc123',
              content: 'Sample document content',
              type: 'RENTAL_CONTRACT'
            }
          ]
        },
        { id: 'client123' },
        { id: 'lawyer123' },
        { score: 0.6 },
        { cases: [] }
      );
      
      expect(prisma.recommendation.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case123',
          userId: 'user123',
          strategy: 'Enhanced case strategy',
          confidence: 0.9,
          isEnhanced: true,
          recommendations: {
            create: [
              {
                id: 'en_rec1',
                title: 'Enhanced Recommendation 1',
                description: 'Enhanced Description 1',
                priority: 'high',
                confidence: 0.9
              }
            ]
          }
        }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'rec123',
          caseId: 'case123',
          userId: 'user123',
          strategy: 'Enhanced case strategy',
          confidence: 0.9,
          isEnhanced: true
        }
      });
    });
  });
});
