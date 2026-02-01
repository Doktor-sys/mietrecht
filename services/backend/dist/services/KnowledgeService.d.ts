import { PrismaClient, LegalKnowledge, LegalType } from '@prisma/client';
/**
 * Search Filters Interface
 */
export interface SearchFilters {
    types?: LegalType[];
    jurisdictions?: string[];
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    relevanceThreshold?: number;
    tags?: string[];
}
export interface SearchResult {
    id: string;
    type: LegalType;
    reference: string;
    title: string;
    content: string;
    jurisdiction: string;
    effectiveDate: Date;
    lastUpdated: Date;
    tags: string[];
    score?: number;
    highlights?: {
        title?: string[];
        content?: string[];
    };
}
export interface SearchResponse {
    results: SearchResult[];
    total: number;
    page: number;
    totalPages: number;
    aggregations?: {
        types: Record<string, number>;
        jurisdictions: Record<string, number>;
        tags: Record<string, number>;
    };
}
export interface LegalText {
    id: string;
    reference: string;
    title: string;
    content: string;
    type: LegalType;
    jurisdiction: string;
    effectiveDate: Date;
    lastUpdated: Date;
    tags: string[];
    relatedLaws?: LegalText[];
}
export interface UpdateResult {
    updated: number;
    created: number;
    errors: string[];
}
/**
 * Knowledge Service
 * Manages legal knowledge base with Elasticsearch integration
 */
export declare class KnowledgeService {
    private prisma;
    private elasticsearch;
    private indexName;
    constructor(prisma: PrismaClient);
    /**
     * Initialisiert Elasticsearch Index
     */
    initializeIndex(): Promise<void>;
    /**
     * Fügt neuen Rechtstext hinzu
     */
    addLegalContent(data: {
        reference: string;
        title: string;
        content: string;
        type: LegalType;
        jurisdiction: string;
        effectiveDate: Date;
        tags?: string[];
    }): Promise<LegalKnowledge>;
    /**
     * Durchsucht die Rechtsdatenbank
     */
    searchLegalContent(query: string, filters: SearchFilters, page?: number, limit?: number): Promise<SearchResponse>;
    getLegalText(reference: string): Promise<LegalText | null>;
    findSimilarContent(reference: string, limit?: number): Promise<SearchResult[]>;
    updateLegalContent(reference: string, data: any): Promise<LegalKnowledge>;
    deleteLegalContent(reference: string): Promise<void>;
    updateKnowledgeBase(): Promise<UpdateResult>;
    /**
     * Health Check für Elasticsearch
     */
    healthCheck(): Promise<{
        elasticsearch: boolean;
        database: boolean;
    }>;
    /**
     * Generiert Embeddings für Rechtstext
     * Nutzt OpenAI Service für semantische Suche
     */
    private generateEmbeddings;
    /**
     * Hilfsmethoden
     */
    private indexLegalContent;
    private validateLegalContent;
    private invalidateSearchCache;
}
