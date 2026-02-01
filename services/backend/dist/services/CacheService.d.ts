interface CacheStats {
    hits: number;
    misses: number;
    keys: number;
}
export declare class CacheService {
    private static instance;
    private cache;
    private stats;
    private constructor();
    private cleanupExpiredEntries;
    static getInstance(): CacheService;
    /**
     * Holt einen Wert aus dem Cache
     */
    get<T>(key: string): T | undefined;
    /**
     * Speichert einen Wert im Cache
     */
    set<T>(key: string, value: T, ttlSeconds?: number): boolean;
    /**
     * Löscht einen Wert aus dem Cache
     */
    del(key: string): number;
    /**
     * Löscht mehrere Werte aus dem Cache
     */
    delMultiple(keys: string[]): number;
    /**
     * Prüft ob ein Schlüssel im Cache existiert
     */
    has(key: string): boolean;
    /**
     * Löscht alle Werte aus dem Cache
     */
    flushAll(): void;
    /**
     * Holt Cache-Statistiken
     */
    getStats(): CacheStats;
    /**
     * Holt alle Schlüssel aus dem Cache
     */
    getKeys(): string[];
    /**
     * Holt die Anzahl der Elemente im Cache
     */
    getKeyCount(): number;
    /**
     * Verlängert die Gültigkeit eines Cache-Eintrags
     */
    extendTTL(key: string, ttlSeconds: number): boolean;
}
export {};
