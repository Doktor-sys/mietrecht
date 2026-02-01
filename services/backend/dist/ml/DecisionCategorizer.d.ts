import { PrismaClient } from '@prisma/client';
interface LegalDocument {
    id: string;
    title: string;
    content: string;
    category?: string;
    tags: string[];
    createdAt: Date;
}
interface CategorizationResult {
    documentId: string;
    predictedCategory: string;
    confidence: number;
    suggestedTags: string[];
    keyTerms: string[];
}
export declare class DecisionCategorizer {
    private prisma;
    private predefinedCategories;
    constructor(prisma: PrismaClient);
    /**
     * Kategorisiert ein neues Dokument
     */
    categorizeDocument(document: Omit<LegalDocument, 'category' | 'tags'>): Promise<CategorizationResult>;
    /**
     * Berechnet die Kategorisierung basierend auf Regeln
     */
    private calculateCategorization;
    /**
     * Bestimmt die Kategorie basierend auf Schlüsselwörtern
     */
    private determineCategory;
    /**
     * Gibt Schlüsselwörter für eine Kategorie zurück
     */
    private getCategoryKeywords;
    /**
     * Extrahiert Schlüsselbegriffe aus dem Text
     */
    private extractKeyTerms;
    /**
     * Schlägt Tags basierend auf Kategorie und Schlüsselbegriffen vor
     */
    private suggestTags;
}
export {};
