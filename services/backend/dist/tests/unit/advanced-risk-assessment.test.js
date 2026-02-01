"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const advancedRiskAssessment_1 = require("../../../scripts/ml/advancedRiskAssessment");
describe('Advanced Risk Assessment', () => {
    describe('analyzeHistoricalPatterns', () => {
        it('should analyze historical patterns correctly', () => {
            const historicalData = {
                cases: [
                    {
                        type: 'mietrecht',
                        outcome: 'successful',
                        duration: 45,
                        riskFactors: ['weak_evidence', 'late_filing']
                    },
                    {
                        type: 'mietrecht',
                        outcome: 'unsuccessful',
                        duration: 60,
                        riskFactors: ['weak_evidence', 'tenant_history']
                    },
                    {
                        type: 'mietrecht',
                        outcome: 'successful',
                        duration: 30,
                        riskFactors: ['strong_evidence']
                    }
                ]
            };
            const result = (0, advancedRiskAssessment_1.analyzeHistoricalPatterns)(historicalData, 'mietrecht');
            expect(result).toEqual({
                successRate: 2 / 3,
                averageDuration: 45,
                commonRiskFactors: ['weak_evidence'],
                trendingFactors: [],
                totalCases: 3
            });
        });
        it('should handle empty historical data', () => {
            const result = (0, advancedRiskAssessment_1.analyzeHistoricalPatterns)(null, 'mietrecht');
            expect(result).toEqual({
                successRate: 0.5,
                averageDuration: 90,
                commonRiskFactors: [],
                trendingFactors: [],
                totalCases: 0
            });
        });
    });
    describe('calculateEnhancedRiskScore', () => {
        it('should calculate enhanced risk score correctly', () => {
            const caseAnalysis = {
                riskScore: 0.6
            };
            const clientProfile = {
                riskHistory: {
                    negativeOutcomes: 1,
                    totalCases: 5
                },
                financialStability: 0.7
            };
            const historicalPatterns = {
                successRate: 0.6,
                trendingFactors: ['new_regulation']
            };
            const result = (0, advancedRiskAssessment_1.calculateEnhancedRiskScore)(caseAnalysis, clientProfile, historicalPatterns);
            // Base risk: 0.6
            // Client history adjustment: (1/5) * 0.2 = 0.04
            // Financial stability adjustment: (1-0.7) * 0.15 = 0.045
            // Historical success rate adjustment: (1-0.6) * 0.25 = 0.1
            // Trending factors adjustment: 1 * 0.1 = 0.1
            // Total: 0.6 + 0.04 + 0.045 + 0.1 + 0.1 = 0.885
            expect(result).toBeCloseTo(0.885);
        });
    });
    describe('identifyRiskFactors', () => {
        it('should identify risk factors correctly', () => {
            const caseAnalysis = {
                riskFactors: ['weak_evidence', 'complex_case']
            };
            const clientProfile = {
                riskTolerance: 'low',
                financialStability: 0.2
            };
            const historicalPatterns = {
                trendingFactors: ['new_regulation'],
                successRate: 0.3
            };
            const result = (0, advancedRiskAssessment_1.identifyRiskFactors)(caseAnalysis, clientProfile, historicalPatterns);
            expect(result).toEqual([
                'weak_evidence',
                'complex_case',
                'Klient mit niedriger Risikobereitschaft',
                'Geringe finanzielle Stabilität des Klienten',
                'Zunehmendes Risiko durch folgende Faktoren: new_regulation',
                'Historisch niedrige Erfolgsrate bei ähnlichen Fällen'
            ]);
        });
    });
    describe('generateRiskMitigationStrategies', () => {
        it('should generate risk mitigation strategies', () => {
            const riskFactors = [
                'Klient mit niedriger Risikobereitschaft',
                'Geringe finanzielle Stabilität des Klienten',
                'Historisch niedrige Erfolgsrate bei ähnlichen Fällen'
            ];
            const result = (0, advancedRiskAssessment_1.generateRiskMitigationStrategies)(riskFactors);
            expect(result).toEqual([
                {
                    id: "communication_plan",
                    title: "Angepasster Kommunikationsplan",
                    description: "Regelmäßige Updates und transparente Kommunikation über Fortschritte und Herausforderungen, um die Erwartungen des Klienten zu managen.",
                    priority: "high"
                },
                {
                    id: "cost_management",
                    title: "Kostenmanagement",
                    description: "Kosteneffiziente Herangehensweise mit klaren Budgetgrenzen und regelmäßiger Kostenüberprüfung.",
                    priority: "high"
                },
                {
                    id: "alternative_approaches",
                    title: "Alternative Ansätze prüfen",
                    description: "Prüfung außergerichtlicher Lösungen und alternativer Strategien zur Risikominderung.",
                    priority: "high"
                },
                {
                    id: "specialist_consultation",
                    title: "Konsultation von Fachexperten",
                    description: "Einbindung von Spezialisten für komplexe Aspekte des Falls zur Stärkung der Strategie.",
                    priority: "medium"
                }
            ]);
        });
    });
    describe('determineRiskLevel', () => {
        it('should determine risk level correctly', () => {
            expect((0, advancedRiskAssessment_1.determineRiskLevel)(0.2)).toBe('low');
            expect((0, advancedRiskAssessment_1.determineRiskLevel)(0.5)).toBe('medium');
            expect((0, advancedRiskAssessment_1.determineRiskLevel)(0.8)).toBe('high');
        });
    });
    describe('calculateRiskAssessmentConfidence', () => {
        it('should calculate confidence correctly', () => {
            const caseAnalysis = {
                confidence: 0.8
            };
            const historicalPatterns = {
                totalCases: 100
            };
            const result = (0, advancedRiskAssessment_1.calculateRiskAssessmentConfidence)(caseAnalysis, historicalPatterns);
            // Base confidence: 0.5
            // Case analysis confidence: 0.8 * 0.3 = 0.24
            // Historical data confidence: 0.2 (because totalCases > 50)
            // Total: 0.5 + 0.24 + 0.2 = 0.94
            expect(result).toBeCloseTo(0.94);
        });
    });
    describe('assessEnhancedCaseRisk', () => {
        it('should assess enhanced case risk correctly', async () => {
            const caseData = {
                id: 'case123',
                documents: []
            };
            const clientData = {
                id: 'client123'
            };
            const historicalData = {
                cases: []
            };
            const result = await (0, advancedRiskAssessment_1.assessEnhancedCaseRisk)(caseData, clientData, historicalData);
            expect(result).toEqual({
                caseId: 'case123',
                clientId: 'client123',
                riskScore: expect.any(Number),
                riskLevel: expect.any(String),
                riskFactors: expect.any(Array),
                mitigationStrategies: expect.any(Array),
                confidence: expect.any(Number),
                assessmentTimestamp: expect.any(String)
            });
        });
    });
});
