import NodeCache from 'node-cache';
declare const CACHE_CONFIG: {
    SMALL: {
        stdTTL: number;
        checkperiod: number;
    };
    MEDIUM: {
        stdTTL: number;
        checkperiod: number;
    };
    LARGE: {
        stdTTL: number;
        checkperiod: number;
    };
    XLARGE: {
        stdTTL: number;
        checkperiod: number;
    };
};
interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    expired: number;
}
type CacheStrategy = 'LRU' | 'LFU' | 'FIFO' | 'TTL';
declare class CacheManager {
    private static instance;
    private caches;
    private stats;
    private strategies;
    private constructor();
    static getInstance(): CacheManager;
    createCache(cacheName: string, config?: keyof typeof CACHE_CONFIG, strategy?: CacheStrategy): NodeCache;
    getCache(cacheName: string): NodeCache | undefined;
    getOrCreateCache(cacheName: string, config?: keyof typeof CACHE_CONFIG, strategy?: CacheStrategy): NodeCache;
    set<T>(cacheName: string, key: string, value: T, ttl?: number): boolean;
    get<T>(cacheName: string, key: string): T | undefined;
    del(cacheName: string, key: string): number;
    has(cacheName: string, key: string): boolean;
    getKeysCount(cacheName: string): number;
    getKeys(cacheName: string): string[];
    flush(cacheName: string): void;
    getStats(cacheName: string): CacheStats | undefined;
    getAllStats(): Map<string, CacheStats>;
    getCacheInfo(cacheName: string): {
        name: string;
        keys: number;
        stats: CacheStats | undefined;
        config: any;
        strategy: CacheStrategy | undefined;
    };
    getAllCacheInfo(): Array<ReturnType<CacheManager['getCacheInfo']>>;
    closeAll(): void;
    warmUpCache(cacheName: string, warmUpFunction: () => Promise<any>): Promise<void>;
    prefetchCache(cacheName: string, keys: string[], fetchFunction: (key: string) => Promise<any>): Promise<void>;
}
declare const _default: CacheManager;
export default _default;
export declare const createAICache: (cacheName: string, config?: keyof typeof CACHE_CONFIG) => NodeCache;
export declare const getAICache: (cacheName: string) => NodeCache | undefined;
export declare const documentAnalysisCache: NodeCache;
export declare const riskAssessmentCache: NodeCache;
export declare const recommendationCache: NodeCache;
export declare const nlpProcessingCache: NodeCache;
export declare const predictiveAnalysisCache: NodeCache;
export declare const legalResearchCache: NodeCache;
export declare const strategyRecommendationsCache: NodeCache;
