"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enhancedStrategyRecommendations_1 = require("../../../scripts/ml/enhancedStrategyRecommendations");
describe('Enhanced Strategy Recommendations', () => {
    describe('analyzeCaseDocuments', () => {
        it('should analyze case documents correctly', () => {
            const documents = [
                {
                    content: 'This is a sample rental contract with some issues related to rent reduction and maintenance.'
                }
            ];
            const result = (0, enhancedStrategyRecommendations_1.analyzeCaseDocuments)(documents);
            expect(result).toEqual({
                topics: expect.any(Array),
                entities: expect.any(Object),
                sentiment: expect.any(Object),
                topicModeling: expect.any(Object),
                keyIssues: expect.any(Array)
            });
        });
        it('should handle empty documents', () => {
            const result = (0, enhancedStrategyRecommendations_1.analyzeCaseDocuments)([]);
            expect(result).toEqual({
                topics: [],
                entities: {},
                sentiment: {},
                keyIssues: []
            });
        });
    });
    describe('assessCaseStrength', () => {
        it('should assess case strength correctly', () => {
            const documentAnalysis = {
                sentiment: { polarity: 0.5 },
                keyIssues: ['issue1', 'issue2'],
                topics: ['topic1', 'topic2', 'topic3', 'topic4', 'topic5', 'topic6']
            };
            const caseData = {};
            const result = (0, enhancedStrategyRecommendations_1.assessCaseStrength)(documentAnalysis, caseData);
            expect(result).toEqual({
                score: expect.any(Number),
                assessment: expect.any(String),
                confidence: expect.any(Number)
            });
        });
    });
    describe('identifyKeyIssues', () => {
        it('should identify key issues correctly', () => {
            const topics = ['rent', 'maintenance', 'contract'];
            const topicModeling = {
                topics: [
                    { label: 'rent', score: 0.8 },
                    { label: 'eviction', score: 0.6 }
                ]
            };
            const result = (0, enhancedStrategyRecommendations_1.identifyKeyIssues)(topics, topicModeling);
            expect(result).toEqual(['rent', 'eviction', 'maintenance', 'contract']);
        });
    });
    describe('analyzeHistoricalPatterns', () => {
        it('should analyze historical patterns correctly', () => {
            const historicalData = {
                cases: [
                    {
                        type: 'mietrecht',
                        outcome: 'successful',
                        strategies: ['negotiation', 'documentation'],
                        challenges: ['evidence', 'timing'],
                        duration: 45
                    },
                    {
                        type: 'mietrecht',
                        outcome: 'unsuccessful',
                        strategies: ['litigation'],
                        challenges: ['evidence', 'expertise'],
                        duration: 75
                    }
                ]
            };
            const result = (0, enhancedStrategyRecommendations_1.analyzeHistoricalPatterns)(historicalData, 'mietrecht');
            expect(result).toEqual({
                successStrategies: expect.any(Array),
                commonChallenges: ['evidence'],
                averageDuration: 60,
                trendingStrategies: expect.any(Array),
                totalCases: 2
            });
        });
    });
    describe('generateEnhancedRecommendations', () => {
        it('should generate enhanced recommendations correctly', () => {
            const caseData = {};
            const clientProfile = {};
            const lawyerProfile = {};
            const documentAnalysis = {};
            const caseStrength = { assessment: 'medium' };
            const riskTolerance = 'medium';
            const riskAssessment = { riskLevel: 'medium' };
            const historicalPatterns = {};
            const result = (0, enhancedStrategyRecommendations_1.generateEnhancedRecommendations)(caseData, clientProfile, lawyerProfile, documentAnalysis, caseStrength, riskTolerance, riskAssessment, historicalPatterns);
            expect(result).toEqual([
                {
                    id: "approach",
                    title: "Empfohlene Vorgehensweise",
                    description: expect.any(String),
                    priority: "high",
                    confidence: 0.9
                },
                {
                    id: "documents",
                    title: "Dokumentenstrategie",
                    description: expect.any(String),
                    priority: "high",
                    confidence: 0.85
                },
                {
                    id: "timeline",
                    title: "Zeitlicher Ablauf",
                    description: expect.any(String),
                    priority: "medium",
                    confidence: 0.8
                },
                {
                    id: "evidence",
                    title: "Beweissicherung",
                    description: expect.any(String),
                    priority: "high",
                    confidence: 0.9
                },
                {
                    id: "settlement",
                    title: "Außergerichtliche Beilegung",
                    description: expect.any(String),
                    priority: "medium",
                    confidence: 0.85
                },
                {
                    id: "risk_mitigation",
                    title: "Risikominderung",
                    description: expect.any(String),
                    priority: "high",
                    confidence: expect.any(Number)
                }
            ]);
        });
    });
    describe('determineEnhancedApproach', () => {
        it('should determine enhanced approach correctly', () => {
            const caseStrength = { assessment: 'strong' };
            const riskTolerance = 'low';
            const riskAssessment = { riskLevel: 'high' };
            const result = (0, enhancedStrategyRecommendations_1.determineEnhancedApproach)(caseStrength, riskTolerance, riskAssessment);
            expect(result).toContain('Stärke des Falls nutzen, aber risikobewusst vorgehen');
            expect(result).toContain('erhöhten Risikos');
        });
    });
    describe('calculateEnhancedConfidence', () => {
        it('should calculate enhanced confidence correctly', () => {
            const caseData = {
                documents: ['doc1', 'doc2', 'doc3', 'doc4']
            };
            const documentAnalysis = {
                topics: ['topic1', 'topic2', 'topic3', 'topic4', 'topic5', 'topic6'],
                sentiment: { confidence: 0.8 }
            };
            const riskAssessment = {
                confidence: 0.7
            };
            const historicalPatterns = {
                totalCases: 100
            };
            const result = (0, enhancedStrategyRecommendations_1.calculateEnhancedConfidence)(caseData, documentAnalysis, riskAssessment, historicalPatterns);
            // Base confidence: 0.5
            // Document count adjustment: 0.15 (because 4 documents > 3)
            // Topic count adjustment: 0.1 (because 6 topics > 5)
            // Sentiment confidence adjustment: 0.1 * 0.8 = 0.08
            // Risk assessment confidence adjustment: 0.7 * 0.1 = 0.07
            // Historical data adjustment: 0.05 (because totalCases > 50)
            // Total: 0.5 + 0.15 + 0.1 + 0.08 + 0.07 + 0.05 = 0.95
            expect(result).toBeCloseTo(0.95);
        });
    });
    describe('generateEnhancedStrategyRecommendations', () => {
        it('should generate enhanced strategy recommendations correctly', () => {
            const caseData = {
                id: 'case123',
                documents: []
            };
            const clientProfile = {
                riskTolerance: 'medium'
            };
            const lawyerProfile = {};
            const riskAssessment = {
                riskLevel: 'medium'
            };
            const historicalData = {
                cases: []
            };
            const result = (0, enhancedStrategyRecommendations_1.generateEnhancedStrategyRecommendations)(caseData, clientProfile, lawyerProfile, riskAssessment, historicalData);
            expect(result).toEqual({
                strategy: expect.any(String),
                confidence: expect.any(Number),
                caseStrength: expect.any(Object),
                recommendations: expect.any(Array),
                documentAnalysis: expect.any(Object),
                generationTimestamp: expect.any(String)
            });
        });
        it('should handle missing inputs gracefully', () => {
            const result = (0, enhancedStrategyRecommendations_1.generateEnhancedStrategyRecommendations)(null, null, null, null, null);
            expect(result).toEqual({
                strategy: "Keine Empfehlungen verfügbar.",
                confidence: 0,
                recommendations: []
            });
        });
    });
});
