import { ExtendedLegalCategory } from '../types/legal';
export interface LegalReference {
    type: 'law' | 'court_decision' | 'regulation';
    reference: string;
    title: string;
    relevantSection?: string;
    url?: string;
    excerpt?: string;
}
export interface ActionRecommendation {
    action: string;
    priority: 'high' | 'medium' | 'low';
    deadline?: string;
    legalBasis?: string;
    details?: string;
}
export interface TemplateReference {
    templateId: string;
    templateName: string;
    description: string;
    applicableFor: string[];
}
export declare const CATEGORY_NAMES: Record<ExtendedLegalCategory, string>;
export declare const CATEGORY_KEYWORDS: Record<ExtendedLegalCategory, string[]>;
export declare const MANDATORY_REFERENCES: Record<ExtendedLegalCategory, LegalReference[]>;
export declare const TEMPLATE_MAP: Record<ExtendedLegalCategory, TemplateReference[]>;
export declare const ACTION_RECOMMENDATIONS_MAP: Record<ExtendedLegalCategory, ActionRecommendation[]>;
