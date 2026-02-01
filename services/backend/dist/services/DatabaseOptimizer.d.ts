import { PrismaClient } from '@prisma/client';
export declare class DatabaseOptimizer {
    private prisma;
    private performanceMonitor;
    private slowQueries;
    private optimizations;
    constructor(prisma: PrismaClient);
    /**
     * Erfasst eine langsame Abfrage
     */
    recordSlowQuery(query: string, duration: number, userId?: string): void;
    /**
     * Analysiert langsame Abfragen und schlägt Optimierungen vor
     */
    private analyzeSlowQueries;
    /**
     * Schlägt eine Optimierung für eine Abfrage vor
     */
    private suggestOptimization;
    /**
     * Wendet eine Optimierung auf eine Abfrage an
     */
    applyOptimization(queryText: string): string;
    /**
     * Erstellt Datenbank-Indizes basierend auf Abfrageanalysen
     */
    suggestIndexes(): Promise<void>;
    /**
     * Extrahiert WHERE-Muster aus langsamen Abfragen
     */
    private extractWherePatterns;
    /**
     * Extrahiert JOIN-Muster aus langsamen Abfragen
     */
    private extractJoinPatterns;
    /**
     * Extrahiert ORDER BY-Muster aus langsamen Abfragen
     */
    private extractOrderByPatterns;
    /**
     * Holt Statistiken über langsamen Abfragen
     */
    getSlowQueryStats(): {
        totalSlowQueries: number;
        averageDuration: number;
        longestQuery: number;
        optimizationsSuggested: number;
    };
    /**
     * Löscht alte Abfrage-Daten
     */
    clearOldData(): void;
}
