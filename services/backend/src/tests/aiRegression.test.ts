import { PrismaClient } from '@prisma/client';
import { AIResponseGenerator } from '../services/AIResponseGenerator';
import { ClassificationResult } from '../services/LegalCaseClassifier';
import { LegalCategory } from '../services/NLPService';

// Mock dependencies
jest.mock('../services/KnowledgeService');
jest.mock('../utils/logger');

describe('AI Regression Tests', () => {
  let generator: AIResponseGenerator;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      legalKnowledge: {
        findMany: jest.fn(),
        findUnique: jest.fn()
      }
    } as any;

    generator = new AIResponseGenerator(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const standardScenarios = [
    {
      name: 'Standard Rent Reduction',
      input: 'Heizung ist ausgefallen',
      classification: {
        classification: {
          category: 'rent_reduction' as LegalCategory,
          confidence: 0.9,
          riskLevel: 'medium',
          escalationRecommended: false,
          estimatedComplexity: 'moderate'
        },
        intent: {
          intent: 'Mietminderung',
          category: 'rent_reduction' as LegalCategory,
          confidence: 0.9,
          entities: []
        },
        context: {
          facts: ['Heizung defekt'],
          legalIssues: ['Mangel'],
          urgency: 'medium'
        },
        recommendations: []
      },
      expectedKeywords: ['Mietminderung', 'Mangel', 'anzeigen'],
      expectedReferences: ['§ 536 BGB']
    },
    {
      name: 'Standard Termination Notice',
      input: 'Kündigung wegen Eigenbedarf',
      classification: {
        classification: {
          category: 'termination' as LegalCategory,
          confidence: 0.85,
          riskLevel: 'high',
          escalationRecommended: true,
          estimatedComplexity: 'complex'
        },
        intent: {
          intent: 'Eigenbedarfskündigung',
          category: 'termination' as LegalCategory,
          confidence: 0.85,
          entities: []
        },
        context: {
          facts: ['Eigenbedarf'],
          legalIssues: ['Kündigungsschutz'],
          urgency: 'high'
        },
        recommendations: []
      },
      expectedKeywords: ['Widerspruch', 'Frist', 'Eigenbedarf'],
      expectedReferences: ['§ 573 BGB', '§ 574 BGB']
    },
    {
      name: 'Standard Deposit Return',
      input: 'Wann bekomme ich meine Kaution zurück?',
      classification: {
        classification: {
          category: 'deposit' as LegalCategory,
          confidence: 0.95,
          riskLevel: 'low',
          escalationRecommended: false,
          estimatedComplexity: 'simple'
        },
        intent: {
          intent: 'Kautionsrückzahlung',
          category: 'deposit' as LegalCategory,
          confidence: 0.95,
          entities: []
        },
        context: {
          facts: ['Auszug'],
          legalIssues: ['Fälligkeit'],
          urgency: 'low'
        },
        recommendations: []
      },
      expectedKeywords: ['Kaution', 'Rückzahlung', 'Monate'],
      expectedReferences: ['§ 551 BGB']
    }
  ];

  standardScenarios.forEach(scenario => {
    it(`should maintain consistent response structure for ${scenario.name}`, async () => {
      const response = await generator.generateResponse(
        scenario.classification as ClassificationResult,
        scenario.input
      );

      // 1. Check Response Structure
      expect(response).toBeDefined();
      expect(response.message).toBeTruthy();
      expect(response.legalReferences).toBeDefined();
      expect(response.actionRecommendations).toBeDefined();

      // 2. Check Keywords Presence
      scenario.expectedKeywords.forEach(keyword => {
        expect(response.message.toLowerCase()).toContain(keyword.toLowerCase());
      });

      // 3. Check Legal References
      const references = response.legalReferences.map(ref => ref.reference);
      scenario.expectedReferences.forEach(ref => {
        expect(references).toContain(ref);
      });

      // 4. Check Tone/Style (Basic check)
      expect(response.message.length).toBeGreaterThan(50); // Not too short
      expect(response.message).not.toContain('UNDEFINED'); // No template errors
      expect(response.message).not.toContain('NULL');
    });
  });
});
