import { RedisClientType } from 'redis';
/**
 * Redis Service for caching
 * Provides a simple interface for cache operations
 */
export declare class RedisService {
    private static instance;
    private client;
    private isConnected;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): RedisService;
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Get value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttlSeconds Time to live in seconds (default: 3600 = 1 hour)
     */
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    /**
     * Set value in cache with advanced options
     * @param key Cache key
     * @param value Value to cache
     * @param options Advanced caching options
     */
    setAdvanced(key: string, value: any, options: {
        ttlSeconds?: number;
        nx?: boolean;
        xx?: boolean;
        get?: boolean;
    }): Promise<void>;
    /**
     * Get or set value with automatic population
     * @param key Cache key
     * @param fetchFunction Function to fetch data if not in cache
     * @param ttlSeconds Time to live in seconds
     */
    getOrSet<T>(key: string, fetchFunction: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    /**
     * Increment a counter in cache
     * @param key Counter key
     * @param amount Amount to increment by (default: 1)
     * @param ttlSeconds Time to live in seconds
     */
    incrBy(key: string, amount?: number, ttlSeconds?: number): Promise<number>;
    /**
     * Delete value from cache
     */
    del(key: string): Promise<void>;
    /**
     * Delete multiple keys matching a pattern
     */
    delPattern(pattern: string): Promise<void>;
    /**
     * Flush all cache
     */
    flush(): Promise<void>;
    /**
     * Check if Redis is connected
     */
    isReady(): boolean;
    /**
     * Ping Redis server
     */
    ping(): Promise<string>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<any>;
    /**
     * Get cache size information
     */
    getCacheInfo(): Promise<{
        usedMemory: string;
        connectedClients: string;
        totalCommands: string;
        keySpaceHits: string;
        keySpaceMisses: string;
        hitRate: number;
    } | null>;
    /**
     * Get client for direct access
     */
    getClient(): RedisClientType;
}
