import { PrismaClient } from '@prisma/client';
export interface LegalTrend {
    id: string;
    title: string;
    description: string;
    category: string;
    relevanceScore: number;
    trendType: 'emerging' | 'established' | 'declining';
    startDate: Date;
    endDate?: Date;
    jurisdiction: string;
    source: string;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface LegalTrendAnalysis {
    period: {
        start: Date;
        end: Date;
    };
    trends: LegalTrend[];
    trendCategories: Record<string, number>;
    jurisdictionDistribution: Record<string, number>;
    trendTypes: Record<string, number>;
    topTrends: LegalTrend[];
    emergingTrends: LegalTrend[];
    recommendations: string[];
}
export interface TrendQuery {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    jurisdiction?: string;
    minRelevance?: number;
    limit?: number;
}
export declare class TrendAnalysisService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Analysiert Rechtstrends über einen bestimmten Zeitraum
     */
    analyzeTrends(query?: TrendQuery): Promise<LegalTrendAnalysis>;
    /**
     * Filtert Trends nach Query-Parametern
     */
    private filterTrends;
    /**
     * Generiert eine Trendanalyse aus den Rohdaten
     */
    private generateTrendAnalysis;
    /**
     * Generiert Empfehlungen basierend auf den Trends
     */
    private generateTrendRecommendations;
    /**
     * Erstellt einen neuen Rechtstrend
     */
    createTrend(trendData: Omit<LegalTrend, 'id' | 'createdAt' | 'updatedAt'>): Promise<LegalTrend>;
    /**
     * Aktualisiert einen bestehenden Rechtstrend
     */
    updateTrend(id: string, trendData: Partial<LegalTrend>): Promise<LegalTrend>;
    /**
     * Löscht einen Rechtstrend
     */
    deleteTrend(id: string): Promise<void>;
    /**
     * Findet ähnliche Trends basierend auf Kategorie und Jurisdiktion
     */
    findSimilarTrends(trendId: string, limit?: number): Promise<LegalTrend[]>;
}
