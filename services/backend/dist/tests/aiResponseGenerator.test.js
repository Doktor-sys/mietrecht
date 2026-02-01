"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AIResponseGenerator_1 = require("../services/AIResponseGenerator");
// Mock dependencies
jest.mock('../services/KnowledgeService');
jest.mock('../utils/logger');
describe('AIResponseGenerator', () => {
    let generator;
    let mockPrisma;
    beforeEach(() => {
        mockPrisma = {
            legalKnowledge: {
                findMany: jest.fn(),
                findUnique: jest.fn()
            }
        };
        generator = new AIResponseGenerator_1.AIResponseGenerator(mockPrisma);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('generateResponse', () => {
        it('should generate response with legal references for rent reduction', async () => {
            const classification = {
                classification: {
                    category: 'rent_reduction',
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mietminderung wegen Heizungsausfall',
                    category: 'rent_reduction',
                    confidence: 0.85,
                    entities: []
                },
                context: {
                    facts: ['Heizung seit 2 Wochen defekt', 'Vermieter informiert'],
                    legalIssues: ['Mietminderung möglich'],
                    urgency: 'medium'
                },
                recommendations: ['Mangel dokumentieren', 'Frist setzen']
            };
            const response = await generator.generateResponse(classification, 'Meine Heizung ist seit 2 Wochen kaputt');
            expect(response).toBeDefined();
            expect(response.message).toBeTruthy();
            expect(response.confidence).toBe(0.85);
            expect(response.legalReferences).toBeDefined();
            expect(response.legalReferences.length).toBeGreaterThan(0);
            // Check for § 536 BGB reference
            const bgb536 = response.legalReferences.find(ref => ref.reference === '§ 536 BGB');
            expect(bgb536).toBeDefined();
            expect(bgb536?.title).toContain('Mietminderung');
        });
        it('should include action recommendations', async () => {
            const classification = {
                classification: {
                    category: 'rent_reduction',
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mietminderung',
                    category: 'rent_reduction',
                    confidence: 0.85,
                    entities: []
                },
                context: {
                    facts: ['Heizung defekt'],
                    legalIssues: [],
                    urgency: 'medium'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Heizung kaputt');
            expect(response.actionRecommendations).toBeDefined();
            expect(response.actionRecommendations.length).toBeGreaterThan(0);
            // Check for documentation action
            const docAction = response.actionRecommendations.find(action => action.action.includes('dokumentieren'));
            expect(docAction).toBeDefined();
            expect(docAction?.priority).toBe('high');
        });
        it('should include template references for rent reduction', async () => {
            const classification = {
                classification: {
                    category: 'rent_reduction',
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mietminderung',
                    category: 'rent_reduction',
                    confidence: 0.85,
                    entities: []
                },
                context: {
                    facts: [],
                    legalIssues: [],
                    urgency: 'medium'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Mietminderung');
            expect(response.templateReferences).toBeDefined();
            expect(response.templateReferences.length).toBeGreaterThan(0);
            // Check for rent reduction template
            const template = response.templateReferences.find(t => t.templateId === 'rent_reduction_notice');
            expect(template).toBeDefined();
            expect(template?.templateName).toContain('Mietminderungsanzeige');
        });
        it('should recommend escalation for termination cases', async () => {
            const classification = {
                classification: {
                    category: 'termination',
                    confidence: 0.9,
                    riskLevel: 'high',
                    escalationRecommended: true,
                    escalationReason: 'high_stakes_case',
                    estimatedComplexity: 'complex'
                },
                intent: {
                    intent: 'Kündigung',
                    category: 'termination',
                    confidence: 0.9,
                    entities: []
                },
                context: {
                    facts: ['Kündigung erhalten'],
                    legalIssues: ['Kündigungsschutz prüfen'],
                    urgency: 'high'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Ich habe eine Kündigung erhalten');
            expect(response.escalationRecommended).toBe(true);
            expect(response.escalationReason).toBe('high_stakes_case');
            // Check for termination-specific legal references
            const bgb573 = response.legalReferences.find(ref => ref.reference === '§ 573 BGB');
            expect(bgb573).toBeDefined();
        });
        it('should handle utility costs category', async () => {
            const classification = {
                classification: {
                    category: 'utility_costs',
                    confidence: 0.8,
                    riskLevel: 'low',
                    escalationRecommended: false,
                    estimatedComplexity: 'simple'
                },
                intent: {
                    intent: 'Nebenkostenabrechnung prüfen',
                    category: 'utility_costs',
                    confidence: 0.8,
                    entities: []
                },
                context: {
                    facts: ['Nebenkostenabrechnung erhalten'],
                    legalIssues: [],
                    urgency: 'low'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Nebenkostenabrechnung zu hoch');
            expect(response.legalReferences).toBeDefined();
            // Check for § 556 BGB reference
            const bgb556 = response.legalReferences.find(ref => ref.reference === '§ 556 BGB');
            expect(bgb556).toBeDefined();
            // Check for utility costs template
            const template = response.templateReferences.find(t => t.templateId === 'utility_objection');
            expect(template).toBeDefined();
        });
        it('should add urgent action for high urgency cases', async () => {
            const classification = {
                classification: {
                    category: 'termination',
                    confidence: 0.9,
                    riskLevel: 'high',
                    escalationRecommended: true,
                    estimatedComplexity: 'complex'
                },
                intent: {
                    intent: 'Fristlose Kündigung',
                    category: 'termination',
                    confidence: 0.9,
                    entities: []
                },
                context: {
                    facts: ['Fristlose Kündigung'],
                    legalIssues: [],
                    urgency: 'high'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Fristlose Kündigung erhalten');
            expect(response.actionRecommendations).toBeDefined();
            // Check for urgent action
            const urgentAction = response.actionRecommendations.find(action => action.priority === 'high' && action.deadline === 'Dringend');
            expect(urgentAction).toBeDefined();
        });
        it('should handle rent increase category', async () => {
            const classification = {
                classification: {
                    category: 'rent_increase',
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mieterhöhung',
                    category: 'rent_increase',
                    confidence: 0.85,
                    entities: []
                },
                context: {
                    facts: ['Mieterhöhung angekündigt'],
                    legalIssues: [],
                    urgency: 'medium'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Vermieter will Miete erhöhen');
            // Check for § 558 BGB reference
            const bgb558 = response.legalReferences.find(ref => ref.reference === '§ 558 BGB');
            expect(bgb558).toBeDefined();
            // Check for 2-month deadline action
            const deadlineAction = response.actionRecommendations.find(action => action.deadline === '2 Monate');
            expect(deadlineAction).toBeDefined();
        });
        it('should handle deposit category', async () => {
            const classification = {
                classification: {
                    category: 'deposit',
                    confidence: 0.8,
                    riskLevel: 'low',
                    escalationRecommended: false,
                    estimatedComplexity: 'simple'
                },
                intent: {
                    intent: 'Kaution zurückfordern',
                    category: 'deposit',
                    confidence: 0.8,
                    entities: []
                },
                context: {
                    facts: ['Ausgezogen', 'Kaution nicht zurück'],
                    legalIssues: [],
                    urgency: 'low'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Kaution nicht zurückerhalten');
            // Check for § 551 BGB reference
            const bgb551 = response.legalReferences.find(ref => ref.reference === '§ 551 BGB');
            expect(bgb551).toBeDefined();
            // Check for deposit return template
            const template = response.templateReferences.find(t => t.templateId === 'deposit_return_request');
            expect(template).toBeDefined();
        });
        it('should generate fallback response when OpenAI is not available', async () => {
            // Remove OpenAI API key
            delete process.env.OPENAI_API_KEY;
            const classification = {
                classification: {
                    category: 'rent_reduction',
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mietminderung',
                    category: 'rent_reduction',
                    confidence: 0.85,
                    entities: []
                },
                context: {
                    facts: [],
                    legalIssues: [],
                    urgency: 'medium'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Heizung kaputt');
            expect(response.message).toBeTruthy();
            expect(response.message).toContain('Mietminderung');
            expect(response.legalReferences.length).toBeGreaterThan(0);
        });
    });
    describe('Legal References', () => {
        it('should include all mandatory references for rent reduction', async () => {
            const classification = {
                classification: {
                    category: 'rent_reduction',
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mietminderung',
                    category: 'rent_reduction',
                    confidence: 0.85,
                    entities: []
                },
                context: {
                    facts: [],
                    legalIssues: [],
                    urgency: 'medium'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Test');
            const references = response.legalReferences.map(ref => ref.reference);
            expect(references).toContain('§ 536 BGB');
            expect(references).toContain('§ 536a BGB');
        });
        it('should include all mandatory references for termination', async () => {
            const classification = {
                classification: {
                    category: 'termination',
                    confidence: 0.9,
                    riskLevel: 'high',
                    escalationRecommended: true,
                    estimatedComplexity: 'complex'
                },
                intent: {
                    intent: 'Kündigung',
                    category: 'termination',
                    confidence: 0.9,
                    entities: []
                },
                context: {
                    facts: [],
                    legalIssues: [],
                    urgency: 'high'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Test');
            const references = response.legalReferences.map(ref => ref.reference);
            expect(references).toContain('§ 573 BGB');
            expect(references).toContain('§ 543 BGB');
            expect(references).toContain('§ 574 BGB');
        });
    });
    describe('Action Recommendations', () => {
        it('should prioritize actions correctly', async () => {
            const classification = {
                classification: {
                    category: 'rent_reduction',
                    confidence: 0.85,
                    riskLevel: 'medium',
                    escalationRecommended: false,
                    estimatedComplexity: 'moderate'
                },
                intent: {
                    intent: 'Mietminderung',
                    category: 'rent_reduction',
                    confidence: 0.85,
                    entities: []
                },
                context: {
                    facts: [],
                    legalIssues: [],
                    urgency: 'medium'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Test');
            const highPriorityActions = response.actionRecommendations.filter(action => action.priority === 'high');
            expect(highPriorityActions.length).toBeGreaterThan(0);
        });
        it('should include deadlines where applicable', async () => {
            const classification = {
                classification: {
                    category: 'utility_costs',
                    confidence: 0.8,
                    riskLevel: 'low',
                    escalationRecommended: false,
                    estimatedComplexity: 'simple'
                },
                intent: {
                    intent: 'Nebenkostenabrechnung',
                    category: 'utility_costs',
                    confidence: 0.8,
                    entities: []
                },
                context: {
                    facts: [],
                    legalIssues: [],
                    urgency: 'low'
                },
                recommendations: []
            };
            const response = await generator.generateResponse(classification, 'Test');
            const actionsWithDeadlines = response.actionRecommendations.filter(action => action.deadline);
            expect(actionsWithDeadlines.length).toBeGreaterThan(0);
        });
    });
    describe('Template References', () => {
        it('should return appropriate templates for each category', async () => {
            const categories = [
                'rent_reduction',
                'termination',
                'utility_costs',
                'rent_increase',
                'deposit'
            ];
            for (const category of categories) {
                const classification = {
                    classification: {
                        category,
                        confidence: 0.8,
                        riskLevel: 'medium',
                        escalationRecommended: false,
                        estimatedComplexity: 'moderate'
                    },
                    intent: {
                        intent: 'Test',
                        category,
                        confidence: 0.8,
                        entities: []
                    },
                    context: {
                        facts: [],
                        legalIssues: [],
                        urgency: 'medium'
                    },
                    recommendations: []
                };
                const response = await generator.generateResponse(classification, 'Test');
                if (category !== 'other' && category !== 'defects' && category !== 'modernization') {
                    expect(response.templateReferences.length).toBeGreaterThan(0);
                }
            }
        });
    });
});
