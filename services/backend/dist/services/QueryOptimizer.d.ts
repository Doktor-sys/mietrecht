import { PrismaClient } from '@prisma/client';
interface QueryAnalysis {
    query: string;
    executionTime: number;
    rowCount: number;
    cost: number;
    recommendations: string[];
    optimizedQuery?: string;
}
interface IndexRecommendation {
    table: string;
    column: string;
    indexType: 'btree' | 'hash' | 'gin' | 'gist';
    reason: string;
}
export declare class QueryOptimizer {
    private prisma;
    private databaseOptimizer;
    constructor(prisma: PrismaClient);
    /**
     * Analysiert eine Datenbankabfrage
     */
    analyzeQuery(query: string): Promise<QueryAnalysis>;
    /**
     * Generiert Empfehlungen für eine Abfrage
     */
    private generateRecommendations;
    /**
     * Optimiert eine Abfrage
     */
    private optimizeQuery;
    /**
     * Schätzt die Kosten einer Abfrage
     */
    private estimateCost;
    /**
     * Analysiert langsame Abfragen aus dem Query Log
     */
    analyzeSlowQueries(): Promise<QueryAnalysis[]>;
    /**
     * Generiert Index-Empfehlungen
     */
    generateIndexRecommendations(): Promise<IndexRecommendation[]>;
    /**
     * Wendet Optimierungen auf eine Abfrage an
     */
    applyOptimizations(query: string, analysis: QueryAnalysis): string;
    /**
     * Validiert eine optimierte Abfrage
     */
    validateOptimizedQuery(originalQuery: string, optimizedQuery: string): Promise<boolean>;
}
export {};
