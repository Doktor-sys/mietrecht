// Verwende das bereits vorhandene Redis-Modul aus der Konfiguration
import { RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';

// Einfache Performance-Konfiguration
const PERFORMANCE_CONFIG = {
  DATABASE_CACHE: {
    TTL_SECONDS: 3600 // 1 Stunde Standard-TTL
  }
};

interface CacheEntry<T> {
  value: T;
  expiry: number; // Timestamp in milliseconds
  createdAt: number; // Timestamp in milliseconds
}

export class RedisCacheService {
  private static instance: RedisCacheService;
  private client: any; // Verwende any, da wir das bereits erstellte Redis-Client verwenden
  private isConnected: boolean = false;

  private constructor() {
    // Verwende den bereits erstellten Redis-Client
    this.client = redis.getClient();
    this.isConnected = true;
  }

  public static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }

  /**
   * Holt einen Wert aus dem Cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }

      // Parse den zwischengespeicherten Wert
      const cacheEntry: CacheEntry<T> = JSON.parse(value);
      
      // Prüfe, ob der Eintrag abgelaufen ist
      if (Date.now() > cacheEntry.expiry) {
        // Entferne den abgelaufenen Eintrag
        await this.del(key);
        logger.debug(`Cache EXPIRED: ${key}`);
        return null;
      }

      logger.debug(`Cache HIT: ${key}`);
      return cacheEntry.value;
    } catch (error: any) {
      logger.error(`Error getting cache entry for key: ${key}`, { error: error.message });
      return null;
    }
  }

  /**
   * Speichert einen Wert im Cache
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const ttl = ttlSeconds || PERFORMANCE_CONFIG.DATABASE_CACHE.TTL_SECONDS;
      
      // Erstelle einen Cache-Eintrag
      const cacheEntry: CacheEntry<T> = {
        value,
        expiry: Date.now() + (ttl * 1000),
        createdAt: Date.now()
      };

      // Speichere den Eintrag im Cache
      if (ttl) {
        await this.client.setEx(key, ttl, JSON.stringify(cacheEntry));
      } else {
        await this.client.set(key, JSON.stringify(cacheEntry));
      }

      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error: any) {
      logger.error(`Error setting cache entry for key: ${key}`, { error: error.message });
      return false;
    }
  }

  /**
   * Löscht einen Wert aus dem Cache
   */
  async del(key: string): Promise<number> {
    try {
      const result = await this.client.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return result;
    } catch (error: any) {
      logger.error(`Error deleting cache entry for key: ${key}`, { error: error.message });
      return 0;
    }
  }

  /**
   * Prüft, ob ein Schlüssel im Cache existiert
   */
  async has(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error(`Error checking cache entry existence for key: ${key}`, { error: error.message });
      return false;
    }
  }

  /**
   * Holt mehrere Werte aus dem Cache
   */
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      const values = await this.client.mGet(keys);
      
      const results: Array<T | null> = [];
      
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value === null) {
          results.push(null);
          continue;
        }

        try {
          const cacheEntry: CacheEntry<T> = JSON.parse(value);
          
          // Prüfe, ob der Eintrag abgelaufen ist
          if (Date.now() > cacheEntry.expiry) {
            // Entferne den abgelaufenen Eintrag
            await this.del(keys[i]);
            results.push(null);
          } else {
            results.push(cacheEntry.value);
          }
        } catch (parseError: any) {
          logger.error(`Error parsing cache entry for key: ${keys[i]}`, { error: parseError.message });
          results.push(null);
        }
      }

      logger.debug(`Cache MGET: ${keys.length} keys`);
      return results;
    } catch (error: any) {
      logger.error(`Error getting multiple cache entries`, { error: error.message, keys: keys.slice(0, 5) });
      return keys.map(() => null);
    }
  }

  /**
   * Speichert mehrere Werte im Cache
   */
  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    try {
      // Erstelle einen Batch für effiziente Operationen
      const batch: Array<{key: string, value: string, ttl?: number}> = [];
      
      for (const entry of entries) {
        const ttl = entry.ttl || PERFORMANCE_CONFIG.DATABASE_CACHE.TTL_SECONDS;
        
        // Erstelle einen Cache-Eintrag
        const cacheEntry: CacheEntry<T> = {
          value: entry.value,
          expiry: Date.now() + (ttl * 1000),
          createdAt: Date.now()
        };

        batch.push({
          key: entry.key,
          value: JSON.stringify(cacheEntry),
          ttl: ttl
        });
      }

      // Speichere alle Einträge
      for (const item of batch) {
        if (item.ttl) {
          await this.client.setEx(item.key, item.ttl, item.value);
        } else {
          await this.client.set(item.key, item.value);
        }
      }

      logger.debug(`Cache MSET: ${entries.length} entries`);
      return true;
    } catch (error: any) {
      logger.error(`Error setting multiple cache entries`, { error: error.message, entries: entries.slice(0, 5) });
      return false;
    }
  }

  /**
   * Prüft die Verbindung zum Redis-Server
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error: any) {
      logger.error('Redis ping failed', { error: error.message });
      return false;
    }
  }
}