import { PrismaClient } from '@prisma/client';
export declare class MLService {
    private prisma;
    private decisionPredictor;
    private decisionCategorizer;
    private personalizedRecommender;
    private isInitialized;
    constructor(prisma: PrismaClient);
    /**
     * Initialisiert alle ML-Komponenten
     */
    initialize(): Promise<void>;
    /**
     * Sagt das Ergebnis eines Falls voraus
     */
    predictCaseOutcome(caseData: any): Promise<any>;
    /**
     * Kategorisiert ein Dokument
     */
    categorizeDocument(document: any): Promise<any>;
    /**
     * Generiert personalisierte Empfehlungen für einen Anwalt
     */
    recommendCasesForLawyer(lawyerId: string, limit?: number): Promise<any[]>;
    /**
     * Aktualisiert das Empfehlungsmodell basierend auf einer Interaktion
     */
    updateRecommendationModel(interaction: {
        lawyerId: string;
        caseId: string;
        rating: number;
    }): Promise<void>;
    /**
     * Speichert alle Modelle
     */
    saveModels(basePath: string): Promise<void>;
    /**
     * Lädt alle Modelle
     */
    loadModels(basePath: string): Promise<void>;
}
