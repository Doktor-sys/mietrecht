"use strict";
// declare module "node-cache" {
//   interface NodeCache {
//     set<T>(key: string, value: T, ttl?: number): boolean;
//     get<T>(key: string): T | undefined;
//     del(key: string | string[]): number;
//     has(key: string): boolean;
//     keys(): string[];
//     flushAll(): void;
//     close(): void;
//     on(event: 'set', handler: (key: string, value: any) => void): void;
//     on(event: 'del', handler: (key: string, value: any) => void): void;
//     on(event: 'expired', handler: (key: string, value: any) => void): void;
//   }
//   
//   interface NodeCacheOptions {
//     stdTTL?: number;
//     checkperiod?: number;
//   }
//   
//   const NodeCache: {
//     new (options?: NodeCacheOptions): NodeCache;
//   };
//   
//   export default NodeCache;
// }
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyRecommendationsCache = exports.legalResearchCache = exports.predictiveAnalysisCache = exports.nlpProcessingCache = exports.recommendationCache = exports.riskAssessmentCache = exports.documentAnalysisCache = exports.getAICache = exports.createAICache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const logger_1 = require("./logger");
// Konfiguration für verschiedene Cachegrößen
const CACHE_CONFIG = {
    SMALL: { stdTTL: 600, checkperiod: 60 }, // 10 Minuten TTL, 1 Minute Check
    MEDIUM: { stdTTL: 1800, checkperiod: 120 }, // 30 Minuten TTL, 2 Minuten Check
    LARGE: { stdTTL: 3600, checkperiod: 300 }, // 60 Minuten TTL, 5 Minuten Check
    XLARGE: { stdTTL: 7200, checkperiod: 600 } // 120 Minuten TTL, 10 Minuten Check
};
class CacheManager {
    constructor() {
        this.caches = new Map();
        this.stats = new Map();
        this.strategies = new Map();
        // Privater Konstruktor für Singleton-Muster
    }
    // Singleton-Instanz abrufen
    static getInstance() {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }
    // Erstelle einen neuen Cache mit Konfiguration
    createCache(cacheName, config = 'MEDIUM', strategy = 'TTL') {
        if (this.caches.has(cacheName)) {
            logger_1.logger.warn(`Cache ${cacheName} existiert bereits und wird überschrieben`);
            this.caches.get(cacheName)?.close();
        }
        const cache = new node_cache_1.default(CACHE_CONFIG[config]);
        this.caches.set(cacheName, cache);
        this.stats.set(cacheName, { hits: 0, misses: 0, sets: 0, deletes: 0, expired: 0 });
        this.strategies.set(cacheName, strategy);
        // Ereignis-Handler für Cache-Statistiken
        cache.on('set', (key, value) => {
            const stats = this.stats.get(cacheName);
            if (stats) {
                stats.sets++;
            }
        });
        cache.on('del', (key, value) => {
            const stats = this.stats.get(cacheName);
            if (stats) {
                stats.deletes++;
            }
        });
        cache.on('expired', (key, value) => {
            const stats = this.stats.get(cacheName);
            if (stats) {
                stats.expired++;
            }
        });
        logger_1.logger.info(`Cache ${cacheName} erstellt mit Konfiguration ${config} und Strategie ${strategy}`);
        return cache;
    }
    // Hole einen existierenden Cache
    getCache(cacheName) {
        return this.caches.get(cacheName);
    }
    // Hole oder erstelle einen Cache
    getOrCreateCache(cacheName, config = 'MEDIUM', strategy = 'TTL') {
        if (!this.caches.has(cacheName)) {
            return this.createCache(cacheName, config, strategy);
        }
        return this.caches.get(cacheName);
    }
    // Setze einen Wert in den Cache mit benutzerdefinierter TTL
    set(cacheName, key, value, ttl) {
        const cache = this.getOrCreateCache(cacheName);
        const result = cache.set(key, value, ttl);
        const stats = this.stats.get(cacheName);
        if (stats) {
            stats.sets++;
        }
        return result;
    }
    // Hole einen Wert aus dem Cache
    get(cacheName, key) {
        const cache = this.getOrCreateCache(cacheName);
        const value = cache.get(key);
        const stats = this.stats.get(cacheName);
        if (stats) {
            if (value !== undefined) {
                stats.hits++;
            }
            else {
                stats.misses++;
            }
        }
        return value;
    }
    // Lösche einen Wert aus dem Cache
    del(cacheName, key) {
        const cache = this.getOrCreateCache(cacheName);
        const count = cache.del(key);
        const stats = this.stats.get(cacheName);
        if (stats) {
            stats.deletes += count;
        }
        return count;
    }
    // Prüfe ob ein Schlüssel existiert
    has(cacheName, key) {
        const cache = this.getOrCreateCache(cacheName);
        return cache.has(key);
    }
    // Hole die Anzahl der Schlüssel im Cache
    getKeysCount(cacheName) {
        const cache = this.getOrCreateCache(cacheName);
        return cache.keys().length;
    }
    // Hole alle Schlüssel im Cache
    getKeys(cacheName) {
        const cache = this.getOrCreateCache(cacheName);
        return cache.keys();
    }
    // Lösche alle Schlüssel im Cache
    flush(cacheName) {
        const cache = this.getOrCreateCache(cacheName);
        cache.flushAll();
    }
    // Hole Cache-Statistiken
    getStats(cacheName) {
        return this.stats.get(cacheName);
    }
    // Hole alle Cache-Statistiken
    getAllStats() {
        return new Map(this.stats);
    }
    // Hole Cache-Informationen
    getCacheInfo(cacheName) {
        const cache = this.getCache(cacheName);
        return {
            name: cacheName,
            keys: cache ? cache.keys().length : 0,
            stats: this.getStats(cacheName),
            config: cache ? cache.options : null,
            strategy: this.strategies.get(cacheName)
        };
    }
    // Hole Informationen zu allen Caches
    getAllCacheInfo() {
        return Array.from(this.caches.keys()).map(cacheName => this.getCacheInfo(cacheName));
    }
    // Schließe alle Caches
    closeAll() {
        for (const [name, cache] of this.caches) {
            cache.close();
            logger_1.logger.info(`Cache ${name} geschlossen`);
        }
        this.caches.clear();
        this.stats.clear();
        this.strategies.clear();
    }
    // Implementierung von Cache-Warmup für häufig genutzte Daten
    async warmUpCache(cacheName, warmUpFunction) {
        try {
            const data = await warmUpFunction();
            this.set(cacheName, 'warmup_data', data);
            logger_1.logger.info(`Cache ${cacheName} erfolgreich aufgewärmt`);
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Aufwärmen des Caches ${cacheName}:`, error);
        }
    }
    // Implementierung von Cache-Prefetching für bekannte Anfragen
    async prefetchCache(cacheName, keys, fetchFunction) {
        try {
            const promises = keys.map(async (key) => {
                const data = await fetchFunction(key);
                this.set(cacheName, key, data);
            });
            await Promise.all(promises);
            logger_1.logger.info(`Cache ${cacheName} erfolgreich mit ${keys.length} Einträgen vorab geladen`);
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Prefetching des Caches ${cacheName}:`, error);
        }
    }
}
// Exportiere die Singleton-Instanz
exports.default = CacheManager.getInstance();
// Hilfsfunktionen für spezifische Caches
const createAICache = (cacheName, config = 'MEDIUM') => {
    const cacheManager = CacheManager.getInstance();
    return cacheManager.createCache(`ai_${cacheName}`, config, 'LRU');
};
exports.createAICache = createAICache;
const getAICache = (cacheName) => {
    const cacheManager = CacheManager.getInstance();
    return cacheManager.getCache(`ai_${cacheName}`);
};
exports.getAICache = getAICache;
// Standard-Caches für KI/ML-Anfragen
exports.documentAnalysisCache = (0, exports.createAICache)('document_analysis', 'XLARGE');
exports.riskAssessmentCache = (0, exports.createAICache)('risk_assessment', 'LARGE');
exports.recommendationCache = (0, exports.createAICache)('recommendations', 'LARGE');
exports.nlpProcessingCache = (0, exports.createAICache)('nlp_processing', 'LARGE');
// Neue Caches für verbesserte Strategien
exports.predictiveAnalysisCache = (0, exports.createAICache)('predictive_analysis', 'LARGE');
exports.legalResearchCache = (0, exports.createAICache)('legal_research', 'XLARGE');
exports.strategyRecommendationsCache = (0, exports.createAICache)('strategy_recommendations', 'LARGE');
