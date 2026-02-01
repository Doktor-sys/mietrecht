export type LegalCategory = 'rent_reduction' | 'termination' | 'utility_costs' | 'rent_increase' | 'defects' | 'deposit' | 'modernization' | 'subletting' | 'ownership_change' | 'handover' | 'landlord_questions' | 'other';
/**
 * Extended legal category including employment law
 */
export type ExtendedLegalCategory = LegalCategory | 'employment_contract' | 'termination_protection' | 'severance' | 'vacation' | 'wage_continuation' | 'discrimination' | 'working_time';
export interface ExtractedEntity {
    type: string;
    value: string;
    confidence: number;
}
export interface IntentRecognitionResult {
    intent: string;
    category: ExtendedLegalCategory;
    confidence: number;
    entities: ExtractedEntity[];
}
export interface ContextExtractionResult {
    facts: string[];
    legalIssues: string[];
    urgency: 'low' | 'medium' | 'high';
    estimatedValue?: number;
}
