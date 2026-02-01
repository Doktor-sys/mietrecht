import { LegalCategory, ExtendedLegalCategory, IntentRecognitionResult, ContextExtractionResult } from '../types/legal';
export type LegalSubCategory = LegalCategory | 'heating_defect' | 'mold' | 'noise' | 'water_damage' | 'general_defect' | 'extraordinary_termination' | 'personal_use' | 'payment_default' | 'ordinary_termination' | 'additional_payment' | 'calculation_error' | 'general_utility' | 'rent_index' | 'modernization_increase' | 'general_increase';
export interface CaseClassification {
    category: ExtendedLegalCategory;
    subCategory?: string;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    escalationRecommended: boolean;
    escalationReason?: string;
    estimatedComplexity: 'simple' | 'moderate' | 'complex';
}
export interface ClassificationResult {
    classification: CaseClassification;
    intent: IntentRecognitionResult;
    context: ContextExtractionResult;
    recommendations: string[];
}
export declare class LegalCaseClassifier {
    private nlpService;
    private readonly CONFIDENCE_THRESHOLD;
    private readonly HIGH_VALUE_THRESHOLD;
    constructor();
    /**
     * Classify a legal case based on user query
     */
    classifyCase(query: string): Promise<ClassificationResult>;
    /**
     * Perform case classification based on intent and context
     */
    private performClassification;
    /**
     * Determine risk level of the case
     */
    private determineRiskLevel;
    /**
     * Determine if case should be escalated to a lawyer
     */
    private determineEscalation;
    /**
     * Determine case complexity
     */
    private determineComplexity;
    /**
     * Determine sub-category based on context
     */
    private determineSubCategory;
    /**
     * Generate recommendations based on classification
     */
    private generateRecommendations;
    /**
     * Get confidence level description
     */
    getConfidenceDescription(confidence: number): string;
    /**
     * Get risk level description
     */
    getRiskLevelDescription(riskLevel: 'low' | 'medium' | 'high'): string;
}
