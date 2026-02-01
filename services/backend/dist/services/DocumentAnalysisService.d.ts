import { PrismaClient, DocumentType } from '@prisma/client';
export interface DocumentAnalysis {
    documentId: string;
    documentType: DocumentType;
    extractedData: Record<string, any>;
    issues: Issue[];
    recommendations: Recommendation[];
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
    analyzedAt: Date;
}
export interface Issue {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
    legalBasis?: string;
    suggestedAction?: string;
}
export interface Recommendation {
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionRequired: boolean;
    legalReferences?: string[];
}
export declare class DocumentAnalysisService {
    private prisma;
    private knowledgeService;
    constructor(prisma: PrismaClient);
    /**
     * Analysiert ein hochgeladenes Dokument
     */
    analyzeDocument(documentId: string): Promise<DocumentAnalysis>;
    /**
     * Analysiert einen Mietvertrag
     */
    private analyzeRentalContract;
    /**
     * Analysiert eine Nebenkostenabrechnung
     */
    private analyzeUtilityBill;
    /**
     * Analysiert eine Abmahnung
     */
    private analyzeWarningLetter;
    /**
     * Analysiert ein generisches Dokument
     */
    private analyzeGenericDocument;
    /**
     * Hilfsmethoden für die Analyse
     */
    private detectInvalidClauses;
    private checkRentPrice;
    private checkMissingMandatoryFields;
    private checkTerminationClauses;
    private checkRenovationClauses;
    private checkBillingPeriod;
    private detectNonDeductibleCosts;
    private checkBillingDeadline;
    private detectCalculationErrors;
    private checkWarningLetterValidity;
    private extractLegalTerms;
    private calculateConfidence;
    private parseGermanDate;
    private calculateDaysUntil;
    private extractTextFromDocument;
    private saveAnalysis;
    /**
     * Ruft eine gespeicherte Analyse ab
     */
    getAnalysis(documentId: string): Promise<DocumentAnalysis | null>;
    /**
     * Ruft alle Analysen eines Nutzers ab
     */
    getUserAnalyses(userId: string): Promise<DocumentAnalysis[]>;
}
