import { PrismaClient } from '@prisma/client';
import { AIResponseGenerator } from '../services/AIResponseGenerator';
import { ClassificationResult } from '../services/LegalCaseClassifier';
import { LegalCategory } from '../services/NLPService';

// Mock dependencies
jest.mock('../services/KnowledgeService');
jest.mock('../utils/logger');

describe('AI Confidence & Escalation Tests', () => {
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

    describe('Confidence Handling', () => {
        it('should flag response as low confidence when classification confidence is low', async () => {
            const lowConfClassification: ClassificationResult = {
                classification: {
                    category: 'other' as LegalCategory,
                    confidence: 0.4, // Low confidence
                    riskLevel: 'low',
                    escalationRecommended: false,
                    estimatedComplexity: 'simple'
                },
                intent: {
                    intent: 'Unklar',
                    category: 'other' as LegalCategory,
                    confidence: 0.4,
                    entities: []
                },
                context: { facts: [], legalIssues: [], urgency: 'low' },
                recommendations: []
            };

            const response = await generator.generateResponse(lowConfClassification, 'Was ist das?');

            expect(response.confidence).toBeLessThan(0.7);
            // Should probably include a disclaimer or ask for clarification
            expect(response.message.toLowerCase()).toMatch(/(nicht sicher|unklar|präzisieren|verstehe nicht)/);
        });

        it('should accept high confidence classifications without disclaimers', async () => {
            const highConfClassification: ClassificationResult = {
                classification: {
                    category: 'rent_reduction' as LegalCategory,
                    confidence: 0.95,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mietminderung',
                    category: 'rent_reduction' as LegalCategory,
                    confidence: 0.95,
                    entities: []
                },
                context: { facts: [], legalIssues: [], urgency: 'medium' },
                recommendations: []
            };

            const response = await generator.generateResponse(highConfClassification, 'Mietminderung');

            expect(response.confidence).toBeGreaterThan(0.9);
            expect(response.message.toLowerCase()).not.toMatch(/(nicht sicher|unklar)/);
        });
    });

    describe('Escalation Logic', () => {
        it('should recommend escalation for high risk cases regardless of confidence', async () => {
            const highRiskClassification: ClassificationResult = {
                classification: {
                    category: 'termination' as LegalCategory,
                    confidence: 0.8,
                    riskLevel: 'high', // High Risk
                    escalationRecommended: true,
                    escalationReason: 'risk_of_homelessness',
                    estimatedComplexity: 'complex'
                },
                intent: {
                    intent: 'Räumungsklage',
                    category: 'termination' as LegalCategory,
                    confidence: 0.8,
                    entities: []
                },
                context: { facts: [], legalIssues: [], urgency: 'high' },
                recommendations: []
            };

            const response = await generator.generateResponse(highRiskClassification, 'Räumungsklage erhalten');

            expect(response.escalationRecommended).toBe(true);
            expect(response.escalationReason).toBe('risk_of_homelessness');
            expect(response.actionRecommendations.some(a => a.action.includes('Rechtliche Beratung') || (a.details && a.details.includes('Fachanwalt')))).toBe(true);
        });

        it('should recommend escalation for complex cases', async () => {
            const complexClassification: ClassificationResult = {
                classification: {
                    category: 'modernization' as LegalCategory,
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: true,
                    escalationReason: 'complexity',
                    estimatedComplexity: 'complex' // Complex
                },
                intent: {
                    intent: 'Umfangreiche Modernisierung',
                    category: 'modernization' as LegalCategory,
                    confidence: 0.85,
                    entities: []
                },
                context: { facts: [], legalIssues: [], urgency: 'medium' },
                recommendations: []
            };

            const response = await generator.generateResponse(complexClassification, 'Große Modernisierung');

            expect(response.escalationRecommended).toBe(true);
            expect(response.escalationReason).toBe('complexity');
        });

        it('should NOT recommend escalation for simple, low risk cases', async () => {
            const simpleClassification: ClassificationResult = {
                classification: {
                    category: 'deposit' as LegalCategory,
                    confidence: 0.9,
                    riskLevel: 'low',
                    escalationRecommended: false,
                    estimatedComplexity: 'simple'
                },
                intent: {
                    intent: 'Kaution',
                    category: 'deposit' as LegalCategory,
                    confidence: 0.9,
                    entities: []
                },
                context: { facts: [], legalIssues: [], urgency: 'low' },
                recommendations: []
            };

            const response = await generator.generateResponse(simpleClassification, 'Kaution');

            expect(response.escalationRecommended).toBe(false);
        });
    });
});
