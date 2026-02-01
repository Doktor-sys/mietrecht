"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const logger_1 = require("../utils/logger");
const redis_1 = require("../config/redis");
// Einfache Performance-Konfiguration
const PERFORMANCE_CONFIG = {
    DATABASE_CACHE: {
        TTL_SECONDS: 3600 // 1 Stunde Standard-TTL
    }
};
class RedisCacheService {
    constructor() {
        this.isConnected = false;
        // Verwende den bereits erstellten Redis-Client
        this.client = redis_1.redis.getClient();
        this.isConnected = true;
    }
    static getInstance() {
        if (!RedisCacheService.instance) {
            RedisCacheService.instance = new RedisCacheService();
        }
        return RedisCacheService.instance;
    }
    /**
     * Holt einen Wert aus dem Cache
     */
    async get(key) {
        try {
            const value = await this.client.get(key);
            if (value === null) {
                logger_1.logger.debug(`Cache MISS: ${key}`);
                return null;
            }
            // Parse den zwischengespeicherten Wert
            const cacheEntry = JSON.parse(value);
            // Prüfe, ob der Eintrag abgelaufen ist
            if (Date.now() > cacheEntry.expiry) {
                // Entferne den abgelaufenen Eintrag
                await this.del(key);
                logger_1.logger.debug(`Cache EXPIRED: ${key}`);
                return null;
            }
            logger_1.logger.debug(`Cache HIT: ${key}`);
            return cacheEntry.value;
        }
        catch (error) {
            logger_1.logger.error(`Error getting cache entry for key: ${key}`, { error: error.message });
            return null;
        }
    }
    /**
     * Speichert einen Wert im Cache
     */
    async set(key, value, ttlSeconds) {
        try {
            const ttl = ttlSeconds || PERFORMANCE_CONFIG.DATABASE_CACHE.TTL_SECONDS;
            // Erstelle einen Cache-Eintrag
            const cacheEntry = {
                value,
                expiry: Date.now() + (ttl * 1000),
                createdAt: Date.now()
            };
            // Speichere den Eintrag im Cache
            if (ttl) {
                await this.client.setEx(key, ttl, JSON.stringify(cacheEntry));
            }
            else {
                await this.client.set(key, JSON.stringify(cacheEntry));
            }
            logger_1.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error setting cache entry for key: ${key}`, { error: error.message });
            return false;
        }
    }
    /**
     * Löscht einen Wert aus dem Cache
     */
    async del(key) {
        try {
            const result = await this.client.del(key);
            logger_1.logger.debug(`Cache DEL: ${key}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting cache entry for key: ${key}`, { error: error.message });
            return 0;
        }
    }
    /**
     * Prüft, ob ein Schlüssel im Cache existiert
     */
    async has(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Error checking cache entry existence for key: ${key}`, { error: error.message });
            return false;
        }
    }
    /**
     * Holt mehrere Werte aus dem Cache
     */
    async mget(keys) {
        try {
            const values = await this.client.mGet(keys);
            const results = [];
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (value === null) {
                    results.push(null);
                    continue;
                }
                try {
                    const cacheEntry = JSON.parse(value);
                    // Prüfe, ob der Eintrag abgelaufen ist
                    if (Date.now() > cacheEntry.expiry) {
                        // Entferne den abgelaufenen Eintrag
                        await this.del(keys[i]);
                        results.push(null);
                    }
                    else {
                        results.push(cacheEntry.value);
                    }
                }
                catch (parseError) {
                    logger_1.logger.error(`Error parsing cache entry for key: ${keys[i]}`, { error: parseError.message });
                    results.push(null);
                }
            }
            logger_1.logger.debug(`Cache MGET: ${keys.length} keys`);
            return results;
        }
        catch (error) {
            logger_1.logger.error(`Error getting multiple cache entries`, { error: error.message, keys: keys.slice(0, 5) });
            return keys.map(() => null);
        }
    }
    /**
     * Speichert mehrere Werte im Cache
     */
    async mset(entries) {
        try {
            // Erstelle einen Batch für effiziente Operationen
            const batch = [];
            for (const entry of entries) {
                const ttl = entry.ttl || PERFORMANCE_CONFIG.DATABASE_CACHE.TTL_SECONDS;
                // Erstelle einen Cache-Eintrag
                const cacheEntry = {
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
                }
                else {
                    await this.client.set(item.key, item.value);
                }
            }
            logger_1.logger.debug(`Cache MSET: ${entries.length} entries`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error setting multiple cache entries`, { error: error.message, entries: entries.slice(0, 5) });
            return false;
        }
    }
    /**
     * Prüft die Verbindung zum Redis-Server
     */
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis ping failed', { error: error.message });
            return false;
        }
    }
}
exports.RedisCacheService = RedisCacheService;
