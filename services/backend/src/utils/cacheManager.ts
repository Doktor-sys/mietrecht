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

import NodeCache from 'node-cache';
import { logger } from './logger';

// Definiere Typen für den Cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Zeit in Millisekunden
}

// Konfiguration für verschiedene Cachegrößen
const CACHE_CONFIG = {
  SMALL: { stdTTL: 600, checkperiod: 60 },    // 10 Minuten TTL, 1 Minute Check
  MEDIUM: { stdTTL: 1800, checkperiod: 120 }, // 30 Minuten TTL, 2 Minuten Check
  LARGE: { stdTTL: 3600, checkperiod: 300 },  // 60 Minuten TTL, 5 Minuten Check
  XLARGE: { stdTTL: 7200, checkperiod: 600 }  // 120 Minuten TTL, 10 Minuten Check
};

// Cache-Statistiken
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  expired: number;
}

// Strategien für das Caching
type CacheStrategy = 'LRU' | 'LFU' | 'FIFO' | 'TTL';

class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, NodeCache> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private strategies: Map<string, CacheStrategy> = new Map();

  private constructor() {
    // Privater Konstruktor für Singleton-Muster
  }

  // Singleton-Instanz abrufen
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Erstelle einen neuen Cache mit Konfiguration
  public createCache(cacheName: string, config: keyof typeof CACHE_CONFIG = 'MEDIUM', strategy: CacheStrategy = 'TTL'): NodeCache {
    if (this.caches.has(cacheName)) {
      logger.warn(`Cache ${cacheName} existiert bereits und wird überschrieben`);
      this.caches.get(cacheName)?.close();
    }

    const cache = new NodeCache(CACHE_CONFIG[config]);
    this.caches.set(cacheName, cache);
    this.stats.set(cacheName, { hits: 0, misses: 0, sets: 0, deletes: 0, expired: 0 });
    this.strategies.set(cacheName, strategy);

    // Ereignis-Handler für Cache-Statistiken
    cache.on('set', (key: string, value: any) => {
      const stats = this.stats.get(cacheName);
      if (stats) {
        stats.sets++;
      }
    });

    cache.on('del', (key: string, value: any) => {
      const stats = this.stats.get(cacheName);
      if (stats) {
        stats.deletes++;
      }
    });

    cache.on('expired', (key: string, value: any) => {
      const stats = this.stats.get(cacheName);
      if (stats) {
        stats.expired++;
      }
    });

    logger.info(`Cache ${cacheName} erstellt mit Konfiguration ${config} und Strategie ${strategy}`);
    return cache;
  }

  // Hole einen existierenden Cache
  public getCache(cacheName: string): NodeCache | undefined {
    return this.caches.get(cacheName);
  }

  // Hole oder erstelle einen Cache
  public getOrCreateCache(cacheName: string, config: keyof typeof CACHE_CONFIG = 'MEDIUM', strategy: CacheStrategy = 'TTL'): NodeCache {
    if (!this.caches.has(cacheName)) {
      return this.createCache(cacheName, config, strategy);
    }
    return this.caches.get(cacheName)!;
  }

  // Setze einen Wert in den Cache mit benutzerdefinierter TTL
  public set<T>(cacheName: string, key: string, value: T, ttl?: number): boolean {
    const cache = this.getOrCreateCache(cacheName);
    const result = cache.set(key, value, ttl);

    const stats = this.stats.get(cacheName);
    if (stats) {
      stats.sets++;
    }

    return result;
  }

  // Hole einen Wert aus dem Cache
  public get<T>(cacheName: string, key: string): T | undefined {
    const cache = this.getOrCreateCache(cacheName);
    const value = cache.get<T>(key);

    const stats = this.stats.get(cacheName);
    if (stats) {
      if (value !== undefined) {
        stats.hits++;
      } else {
        stats.misses++;
      }
    }

    return value;
  }

  // Lösche einen Wert aus dem Cache
  public del(cacheName: string, key: string): number {
    const cache = this.getOrCreateCache(cacheName);
    const count = cache.del(key);

    const stats = this.stats.get(cacheName);
    if (stats) {
      stats.deletes += count;
    }

    return count;
  }

  // Prüfe ob ein Schlüssel existiert
  public has(cacheName: string, key: string): boolean {
    const cache = this.getOrCreateCache(cacheName);
    return cache.has(key);
  }

  // Hole die Anzahl der Schlüssel im Cache
  public getKeysCount(cacheName: string): number {
    const cache = this.getOrCreateCache(cacheName);
    return cache.keys().length;
  }

  // Hole alle Schlüssel im Cache
  public getKeys(cacheName: string): string[] {
    const cache = this.getOrCreateCache(cacheName);
    return cache.keys();
  }

  // Lösche alle Schlüssel im Cache
  public flush(cacheName: string): void {
    const cache = this.getOrCreateCache(cacheName);
    cache.flushAll();
  }

  // Hole Cache-Statistiken
  public getStats(cacheName: string): CacheStats | undefined {
    return this.stats.get(cacheName);
  }

  // Hole alle Cache-Statistiken
  public getAllStats(): Map<string, CacheStats> {
    return new Map(this.stats);
  }

  // Hole Cache-Informationen
  public getCacheInfo(cacheName: string): {
    name: string;
    keys: number;
    stats: CacheStats | undefined;
    config: any;
    strategy: CacheStrategy | undefined;
  } {
    const cache = this.getCache(cacheName);
    return {
      name: cacheName,
      keys: cache ? cache.keys().length : 0,
      stats: this.getStats(cacheName),
      config: cache ? (cache as any).options : null,
      strategy: this.strategies.get(cacheName)
    };
  }

  // Hole Informationen zu allen Caches
  public getAllCacheInfo(): Array<ReturnType<CacheManager['getCacheInfo']>> {
    return Array.from(this.caches.keys()).map(cacheName => this.getCacheInfo(cacheName));
  }

  // Schließe alle Caches
  public closeAll(): void {
    for (const [name, cache] of this.caches) {
      cache.close();
      logger.info(`Cache ${name} geschlossen`);
    }
    this.caches.clear();
    this.stats.clear();
    this.strategies.clear();
  }

  // Implementierung von Cache-Warmup für häufig genutzte Daten
  public async warmUpCache(cacheName: string, warmUpFunction: () => Promise<any>): Promise<void> {
    try {
      const data = await warmUpFunction();
      this.set(cacheName, 'warmup_data', data);
      logger.info(`Cache ${cacheName} erfolgreich aufgewärmt`);
    } catch (error) {
      logger.error(`Fehler beim Aufwärmen des Caches ${cacheName}:`, error);
    }
  }

  // Implementierung von Cache-Prefetching für bekannte Anfragen
  public async prefetchCache(cacheName: string, keys: string[], fetchFunction: (key: string) => Promise<any>): Promise<void> {
    try {
      const promises = keys.map(async (key) => {
        const data = await fetchFunction(key);
        this.set(cacheName, key, data);
      });

      await Promise.all(promises);
      logger.info(`Cache ${cacheName} erfolgreich mit ${keys.length} Einträgen vorab geladen`);
    } catch (error) {
      logger.error(`Fehler beim Prefetching des Caches ${cacheName}:`, error);
    }
  }
}

// Exportiere die Singleton-Instanz
export default CacheManager.getInstance();

// Hilfsfunktionen für spezifische Caches
export const createAICache = (cacheName: string, config: keyof typeof CACHE_CONFIG = 'MEDIUM'): NodeCache => {
  const cacheManager = CacheManager.getInstance();
  return cacheManager.createCache(`ai_${cacheName}`, config, 'LRU');
};

export const getAICache = (cacheName: string): NodeCache | undefined => {
  const cacheManager = CacheManager.getInstance();
  return cacheManager.getCache(`ai_${cacheName}`);
};

// Standard-Caches für KI/ML-Anfragen
export const documentAnalysisCache = createAICache('document_analysis', 'XLARGE');
export const riskAssessmentCache = createAICache('risk_assessment', 'LARGE');
export const recommendationCache = createAICache('recommendations', 'LARGE');
export const nlpProcessingCache = createAICache('nlp_processing', 'LARGE');

// Neue Caches für verbesserte Strategien
export const predictiveAnalysisCache = createAICache('predictive_analysis', 'LARGE');
export const legalResearchCache = createAICache('legal_research', 'XLARGE');
export const strategyRecommendationsCache = createAICache('strategy_recommendations', 'LARGE');