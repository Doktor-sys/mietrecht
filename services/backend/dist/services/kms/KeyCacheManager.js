"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyCacheManager = void 0;
const logger_1 = require("../../utils/logger");
const kms_1 = require("../../types/kms");
/**
 * Key Cache Manager
 *
 * Verwaltet das Caching von Verschlüsselungsschlüsseln in Redis
 * mit LRU-Eviction und Cache-Hit-Rate-Tracking
 */
class KeyCacheManager {
    constructor(redis) {
        this.cachePrefix = 'kms:key:';
        this.statsPrefix = 'kms:stats:';
        this.defaultTTL = 300; // 5 Minuten in Sekunden
        // Cache-Statistiken (in-memory für schnellen Zugriff)
        this.hits = 0;
        this.misses = 0;
        this.redis = redis;
    }
    /**
     * Speichert einen Schlüssel im Cache
     */
    async cacheKey(keyData, ttlSeconds) {
        try {
            const cacheKey = this.getCacheKey(keyData.id, keyData.tenantId);
            const ttl = ttlSeconds || this.defaultTTL;
            // Serialisiere Schlüsseldaten
            const serializedData = JSON.stringify(keyData);
            // Speichere im Cache mit TTL
            await this.redis.setEx(cacheKey, ttl, serializedData);
            logger_1.logger.debug(`Key cached: ${keyData.id} for tenant ${keyData.tenantId} (TTL: ${ttl}s)`);
        }
        catch (error) {
            logger_1.logger.error('Failed to cache key:', error);
            throw new kms_1.KeyManagementError('Failed to cache encryption key', kms_1.KeyManagementErrorCode.CACHE_ERROR, keyData.id, keyData.tenantId);
        }
    }
    /**
     * Ruft einen Schlüssel aus dem Cache ab
     */
    async getCachedKey(keyId, tenantId) {
        try {
            const cacheKey = this.getCacheKey(keyId, tenantId);
            // Versuche aus Cache zu lesen
            const cachedData = await this.redis.get(cacheKey);
            if (cachedData) {
                // Cache Hit
                this.hits++;
                await this.updateCacheStats('hit');
                const keyData = JSON.parse(cachedData);
                // Konvertiere Date-Strings zurück zu Date-Objekten
                keyData.createdAt = new Date(keyData.createdAt);
                keyData.updatedAt = new Date(keyData.updatedAt);
                if (keyData.expiresAt) {
                    keyData.expiresAt = new Date(keyData.expiresAt);
                }
                logger_1.logger.debug(`Cache hit for key: ${keyId}`);
                return keyData;
            }
            // Cache Miss
            this.misses++;
            await this.updateCacheStats('miss');
            logger_1.logger.debug(`Cache miss for key: ${keyId}`);
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get cached key:', error);
            // Bei Cache-Fehlern nicht werfen, sondern null zurückgeben
            // damit der Fallback zur Datenbank funktioniert
            return null;
        }
    }
    /**
     * Invalidiert einen Schlüssel im Cache
     */
    async invalidateKey(keyId, tenantId) {
        try {
            const cacheKey = this.getCacheKey(keyId, tenantId);
            await this.redis.del(cacheKey);
            logger_1.logger.debug(`Cache invalidated for key: ${keyId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate cached key:', error);
            throw new kms_1.KeyManagementError('Failed to invalidate cached key', kms_1.KeyManagementErrorCode.CACHE_ERROR, keyId, tenantId);
        }
    }
    /**
     * Invalidiert alle Schlüssel eines Tenants
     */
    async invalidateTenantKeys(tenantId) {
        try {
            const pattern = `${this.cachePrefix}${tenantId}:*`;
            // Finde alle Keys für diesen Tenant
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                // Lösche alle gefundenen Keys
                await this.redis.del(keys);
                logger_1.logger.info(`Invalidated ${keys.length} cached keys for tenant ${tenantId}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate tenant keys:', error);
            throw new kms_1.KeyManagementError('Failed to invalidate tenant keys', kms_1.KeyManagementErrorCode.CACHE_ERROR, undefined, tenantId);
        }
    }
    /**
     * Gibt Cache-Statistiken zurück
     */
    async getCacheStats() {
        try {
            // Hole persistierte Statistiken aus Redis
            const statsKey = `${this.statsPrefix}global`;
            const statsData = await this.redis.get(statsKey);
            let persistedHits = 0;
            let persistedMisses = 0;
            if (statsData) {
                const stats = JSON.parse(statsData);
                persistedHits = stats.hits || 0;
                persistedMisses = stats.misses || 0;
            }
            // Kombiniere mit in-memory Statistiken
            const totalHits = persistedHits + this.hits;
            const totalMisses = persistedMisses + this.misses;
            const total = totalHits + totalMisses;
            const hitRate = total > 0 ? totalHits / total : 0;
            // Zähle gecachte Keys
            const pattern = `${this.cachePrefix}*`;
            const keys = await this.redis.keys(pattern);
            const cachedKeys = keys.length;
            return {
                hits: totalHits,
                misses: totalMisses,
                hitRate: Math.round(hitRate * 10000) / 100, // Prozent mit 2 Dezimalstellen
                cachedKeys
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get cache stats:', error);
            // Gebe zumindest in-memory Stats zurück
            const total = this.hits + this.misses;
            const hitRate = total > 0 ? this.hits / total : 0;
            return {
                hits: this.hits,
                misses: this.misses,
                hitRate: Math.round(hitRate * 10000) / 100,
                cachedKeys: 0
            };
        }
    }
    /**
     * Setzt die Cache-Statistiken zurück
     */
    async resetCacheStats() {
        try {
            this.hits = 0;
            this.misses = 0;
            const statsKey = `${this.statsPrefix}global`;
            await this.redis.del(statsKey);
            logger_1.logger.info('Cache statistics reset');
        }
        catch (error) {
            logger_1.logger.error('Failed to reset cache stats:', error);
            throw new kms_1.KeyManagementError('Failed to reset cache statistics', kms_1.KeyManagementErrorCode.CACHE_ERROR);
        }
    }
    /**
     * Löscht alle gecachten Schlüssel
     */
    async clearCache() {
        try {
            const pattern = `${this.cachePrefix}*`;
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(keys);
                logger_1.logger.info(`Cleared ${keys.length} keys from cache`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to clear cache:', error);
            throw new kms_1.KeyManagementError('Failed to clear cache', kms_1.KeyManagementErrorCode.CACHE_ERROR);
        }
    }
    /**
     * Prüft ob ein Schlüssel im Cache existiert
     */
    async isCached(keyId, tenantId) {
        try {
            const cacheKey = this.getCacheKey(keyId, tenantId);
            const exists = await this.redis.exists(cacheKey);
            return exists === 1;
        }
        catch (error) {
            logger_1.logger.error('Failed to check if key is cached:', error);
            return false;
        }
    }
    /**
     * Aktualisiert die TTL eines gecachten Schlüssels
     */
    async refreshTTL(keyId, tenantId, ttlSeconds) {
        try {
            const cacheKey = this.getCacheKey(keyId, tenantId);
            const ttl = ttlSeconds || this.defaultTTL;
            await this.redis.expire(cacheKey, ttl);
            logger_1.logger.debug(`TTL refreshed for key: ${keyId} (${ttl}s)`);
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh TTL:', error);
            // Nicht kritisch, daher nur loggen
        }
    }
    /**
     * Generiert den Cache-Key
     */
    getCacheKey(keyId, tenantId) {
        return `${this.cachePrefix}${tenantId}:${keyId}`;
    }
    /**
     * Aktualisiert die Cache-Statistiken in Redis
     */
    async updateCacheStats(type) {
        try {
            const statsKey = `${this.statsPrefix}global`;
            // Hole aktuelle Stats
            const statsData = await this.redis.get(statsKey);
            let stats = { hits: 0, misses: 0 };
            if (statsData) {
                stats = JSON.parse(statsData);
            }
            // Aktualisiere Stats
            if (type === 'hit') {
                stats.hits++;
            }
            else {
                stats.misses++;
            }
            // Speichere zurück (mit 24h TTL)
            await this.redis.setEx(statsKey, 86400, JSON.stringify(stats));
        }
        catch (error) {
            // Fehler beim Stats-Update sollten nicht kritisch sein
            logger_1.logger.warn('Failed to update cache stats in Redis:', error);
        }
    }
    /**
     * Health Check für den Cache
     */
    async healthCheck() {
        try {
            const testKey = `${this.cachePrefix}health:check`;
            const testValue = 'ok';
            // Schreibe Test-Wert
            await this.redis.setEx(testKey, 10, testValue);
            // Lese Test-Wert
            const result = await this.redis.get(testKey);
            // Lösche Test-Wert
            await this.redis.del(testKey);
            return result === testValue;
        }
        catch (error) {
            logger_1.logger.error('Cache health check failed:', error);
            return false;
        }
    }
}
exports.KeyCacheManager = KeyCacheManager;
