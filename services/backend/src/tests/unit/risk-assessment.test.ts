import { RiskAssessmentController } from '../../controllers/RiskAssessmentController';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { assessEnhancedCaseRisk } from '../../../../scripts/ml/advancedRiskAssessment';
import { analyzeCase } from '../../../../scripts/ml/caseAnalyzer';
import { createClientProfile } from '../../../../scripts/ml/clientProfiler';
import { summarizeLegalDocument } from '../../../../scripts/nlp/documentSummarizer';

// Mock the modules
jest.mock('@prisma/client');
jest.mock('../../utils/logger');
jest.mock('../../../../scripts/ml/advancedRiskAssessment');
jest.mock('../../../../scripts/ml/caseAnalyzer');
jest.mock('../../../../scripts/ml/clientProfiler');
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

describe('RiskAssessmentController', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    (prisma as any).document = {
      findUnique: jest.fn(),
      findMany: jest.fn()
    };
    (prisma as any).riskAssessment = {
      create: jest.fn()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('assessDocumentRisk', () => {
    it('should assess risk for a document successfully', async () => {
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
        confidence: 0.8,
        entities: { totalEntities: 5 },
        topics: ['Mietvertrag', 'Kündigung']
      });
      
      // Mock risk assessment creation
      (prisma.riskAssessment.create as jest.Mock).mockResolvedValue({
        id: 'risk123',
        documentId: 'doc123',
        userId: 'user123',
        riskScore: 0.7,
        riskLevel: 'high'
      });
      
      await RiskAssessmentController.assessDocumentRisk(req, res, next);
      
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
      
      expect(prisma.riskAssessment.create).toHaveBeenCalledWith({
        data: {
          documentId: 'doc123',
          userId: 'user123',
          riskScore: 0.7,
          riskLevel: 'high',
          details: {
            summary: {
              confidence: 0.8,
              entities: { totalEntities: 5 },
              topics: ['Mietvertrag', 'Kündigung']
            },
            confidence: 0.8
          }
        }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'risk123',
          documentId: 'doc123',
          userId: 'user123',
          riskScore: 0.7,
          riskLevel: 'high'
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
      
      await RiskAssessmentController.assessDocumentRisk(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Document not found'
      }));
    });
  });
  
  describe('assessCaseRisk', () => {
    it('should assess risk for a case successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      req.params.caseId = 'case123';
      req.body = {
        clientData: { id: 'client123' },
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
      
      // Mock case analysis
      (analyzeCase as jest.Mock).mockReturnValue({
        riskScore: 0.6
      });
      
      // Mock client profile creation
      (createClientProfile as jest.Mock).mockReturnValue({
        id: 'client123',
        riskTolerance: 'medium'
      });
      
      // Mock risk assessment creation
      (prisma.riskAssessment.create as jest.Mock).mockResolvedValue({
        id: 'risk123',
        caseId: 'case123',
        userId: 'user123',
        riskScore: 0.6,
        riskLevel: 'medium'
      });
      
      await RiskAssessmentController.assessCaseRisk(req, res, next);
      
      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: {
          caseId: 'case123',
          userId: 'user123'
        }
      });
      
      expect(analyzeCase).toHaveBeenCalledWith({
        id: 'case123',
        documents: [
          {
            id: 'doc123',
            content: 'Sample document content',
            type: 'RENTAL_CONTRACT'
          }
        ]
      });
      
      expect(prisma.riskAssessment.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case123',
          userId: 'user123',
          riskScore: 0.6,
          riskLevel: 'medium',
          details: {
            caseAnalysis: {
              riskScore: 0.6
            },
            clientProfile: {
              id: 'client123',
              riskTolerance: 'medium'
            }
          }
        }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'risk123',
          caseId: 'case123',
          userId: 'user123',
          riskScore: 0.6,
          riskLevel: 'medium'
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
      
      await RiskAssessmentController.assessCaseRisk(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No documents found for this case'
      }));
    });
  });
  
  describe('assessEnhancedCaseRisk', () => {
    it('should assess enhanced risk for a case successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      
      req.params.caseId = 'case123';
      req.body = {
        clientData: { id: 'client123' },
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
      
      // Mock enhanced risk assessment
      (assessEnhancedCaseRisk as jest.Mock).mockResolvedValue({
        riskScore: 0.8,
        riskLevel: 'high',
        confidence: 0.9
      });
      
      // Mock risk assessment creation
      (prisma.riskAssessment.create as jest.Mock).mockResolvedValue({
        id: 'risk123',
        caseId: 'case123',
        userId: 'user123',
        riskScore: 0.8,
        riskLevel: 'high',
        isEnhanced: true
      });
      
      await RiskAssessmentController.assessEnhancedCaseRisk(req, res, next);
      
      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: {
          caseId: 'case123',
          userId: 'user123'
        }
      });
      
      expect(assessEnhancedCaseRisk).toHaveBeenCalledWith(
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
        { cases: [] }
      );
      
      expect(prisma.riskAssessment.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case123',
          userId: 'user123',
          riskScore: 0.8,
          riskLevel: 'high',
          isEnhanced: true,
          details: {
            riskScore: 0.8,
            riskLevel: 'high',
            confidence: 0.9
          }
        }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'risk123',
          caseId: 'case123',
          userId: 'user123',
          riskScore: 0.8,
          riskLevel: 'high',
          isEnhanced: true
        }
      });
    });
  });
});
