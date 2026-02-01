import { RedisClientType } from 'redis';
import { EncryptedKeyData, CacheStats } from '../../types/kms';
/**
 * Key Cache Manager
 *
 * Verwaltet das Caching von Verschlüsselungsschlüsseln in Redis
 * mit LRU-Eviction und Cache-Hit-Rate-Tracking
 */
export declare class KeyCacheManager {
    private redis;
    private readonly cachePrefix;
    private readonly statsPrefix;
    private readonly defaultTTL;
    private hits;
    private misses;
    constructor(redis: RedisClientType);
    /**
     * Speichert einen Schlüssel im Cache
     */
    cacheKey(keyData: EncryptedKeyData, ttlSeconds?: number): Promise<void>;
    /**
     * Ruft einen Schlüssel aus dem Cache ab
     */
    getCachedKey(keyId: string, tenantId: string): Promise<EncryptedKeyData | null>;
    /**
     * Invalidiert einen Schlüssel im Cache
     */
    invalidateKey(keyId: string, tenantId: string): Promise<void>;
    /**
     * Invalidiert alle Schlüssel eines Tenants
     */
    invalidateTenantKeys(tenantId: string): Promise<void>;
    /**
     * Gibt Cache-Statistiken zurück
     */
    getCacheStats(): Promise<CacheStats>;
    /**
     * Setzt die Cache-Statistiken zurück
     */
    resetCacheStats(): Promise<void>;
    /**
     * Löscht alle gecachten Schlüssel
     */
    clearCache(): Promise<void>;
    /**
     * Prüft ob ein Schlüssel im Cache existiert
     */
    isCached(keyId: string, tenantId: string): Promise<boolean>;
    /**
     * Aktualisiert die TTL eines gecachten Schlüssels
     */
    refreshTTL(keyId: string, tenantId: string, ttlSeconds?: number): Promise<void>;
    /**
     * Generiert den Cache-Key
     */
    private getCacheKey;
    /**
     * Aktualisiert die Cache-Statistiken in Redis
     */
    private updateCacheStats;
    /**
     * Health Check für den Cache
     */
    healthCheck(): Promise<boolean>;
}
