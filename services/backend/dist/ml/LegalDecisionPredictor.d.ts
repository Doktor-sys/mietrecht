import { PrismaClient } from '@prisma/client';
interface LegalCaseData {
    id: string;
    category: string;
    jurisdiction: string;
    filedDate: Date;
    resolvedDate?: Date;
    outcome: string;
    complexity: number;
    partiesInvolved: number;
    evidenceCount: number;
    legalArguments: string[];
    durationDays?: number;
}
interface PredictionResult {
    caseId: string;
    predictedOutcome: string;
    confidence: number;
    estimatedDuration: number;
    factors: {
        categoryImpact: number;
        jurisdictionImpact: number;
        complexityImpact: number;
        evidenceImpact: number;
    };
}
export declare class LegalDecisionPredictor {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Sagt das Ergebnis eines neuen Falls voraus
     */
    predictOutcome(caseData: Omit<LegalCaseData, 'id' | 'durationDays' | 'resolvedDate' | 'outcome'> & {
        id?: string;
    }): Promise<PredictionResult>;
    /**
     * Berechnet die Vorhersage basierend auf Regeln
     */
    private calculatePrediction;
    /**
     * Sagt das Ergebnis eines Falls voraus
     */
    private predictCaseOutcome;
    /**
     * Schätzt die Dauer eines Falls
     */
    private estimateDuration;
    /**
     * Berechnet die Einflussfaktoren
     */
    private calculateFactors;
}
export {};
