/**
 * Datenbank-Optimierungsklasse für Performance-Verbesserungen
 */
declare class DatabaseOptimizer {
    /**
     * Optimiert häufige Abfragen durch Caching und effizientere Query-Struktur
     */
    static optimizeDocumentQueries(): Promise<void>;
    /**
     * Optimiert Case-Abfragen durch effizientere Query-Struktur
     */
    static optimizeCaseQueries(): Promise<void>;
    /**
     * Führt Datenbank-Wartung durch (VACUUM, ANALYZE, etc.)
     */
    static performMaintenance(): Promise<void>;
    /**
     * Analysiert langsame Abfragen und gibt Optimierungsvorschläge
     */
    static analyzeSlowQueries(): Promise<string[]>;
    /**
     * Implementiert Connection Pooling-Optimierungen
     */
    static optimizeConnectionPooling(): Promise<void>;
    /**
     * Optimiert komplexe Abfragen mit Pagination
     */
    static optimizePaginationQueries(): Promise<void>;
}
export default DatabaseOptimizer;
