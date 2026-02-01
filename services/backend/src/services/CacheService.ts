import { logger } from '../utils/logger';
import { PERFORMANCE_CONFIG } from '../config/performance.config';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { value: any; expiry: number | null }>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0
  };

  private constructor() {
    this.cache = new Map();
    // Periodically clean up expired entries
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 600000); // Clean up every 10 minutes
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && entry.expiry < now) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      logger.debug(`Cache cleanup: removed ${deletedCount} expired entries`);
      this.stats.keys = this.cache.size;
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Holt einen Wert aus dem Cache
   */
  public get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return undefined;
    }
    
    // Check if entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.stats.keys = this.cache.size;
      this.stats.misses++;
      logger.debug(`Cache MISS (expired): ${key}`);
      return undefined;
    }
    
    this.stats.hits++;
    logger.debug(`Cache HIT: ${key}`);
    return entry.value;
  }

  /**
   * Speichert einen Wert im Cache
   */
  public set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    const ttl = ttlSeconds || PERFORMANCE_CONFIG.DATABASE_CACHE.TTL_SECONDS;
    const expiry = ttl > 0 ? Date.now() + (ttl * 1000) : null;
    
    this.cache.set(key, { value, expiry });
    this.stats.keys = this.cache.size;
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  }

  /**
   * Löscht einen Wert aus dem Cache
   */
  public del(key: string): number {
    const hadKey = this.cache.has(key);
    this.cache.delete(key);
    this.stats.keys = this.cache.size;
    
    if (hadKey) {
      logger.debug(`Cache DELETE: ${key}`);
      return 1;
    }
    
    logger.debug(`Cache DELETE: ${key} (not found)`);
    return 0;
  }

  /**
   * Löscht mehrere Werte aus dem Cache
   */
  public delMultiple(keys: string[]): number {
    let deletedCount = 0;
    
    for (const key of keys) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.keys = this.cache.size;
    logger.debug(`Cache DELETE MULTIPLE: ${keys.length} keys (${deletedCount} items deleted)`);
    return deletedCount;
  }

  /**
   * Prüft ob ein Schlüssel im Cache existiert
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.stats.keys = this.cache.size;
      return false;
    }
    
    return true;
  }

  /**
   * Löscht alle Werte aus dem Cache
   */
  public flushAll(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0
    };
    logger.info('Cache FLUSH ALL');
  }

  /**
   * Holt Cache-Statistiken
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Holt alle Schlüssel aus dem Cache
   */
  public getKeys(): string[] {
    // Filter out expired entries
    const now = Date.now();
    const keys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (!entry.expiry || entry.expiry >= now) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * Holt die Anzahl der Elemente im Cache
   */
  public getKeyCount(): number {
    return this.getKeys().length;
  }

  /**
   * Verlängert die Gültigkeit eines Cache-Eintrags
   */
  public extendTTL(key: string, ttlSeconds: number): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.stats.keys = this.cache.size;
      return false;
    }
    
    entry.expiry = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
    this.cache.set(key, entry);
    logger.debug(`Cache TTL EXTENDED: ${key} (new TTL: ${ttlSeconds}s)`);
    return true;
  }
}