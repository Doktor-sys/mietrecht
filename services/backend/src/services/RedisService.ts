import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { config } from '../config/config';

/**
 * Redis Service for caching
 * Provides a simple interface for cache operations
 */
export class RedisService {
    private static instance: RedisService;
    private client: RedisClientType;
    private isConnected: boolean = false;

    private constructor() {
        const redisUrl = config.redis.url;
        this.client = createClient({ 
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Max retries reached for Redis connection');
                        return new Error('Max retries reached');
                    }
                    // Exponential backoff: 50ms * 2^retries
                    return Math.min(retries * 50, 1000);
                }
            }
        });

        this.client.on('error', (err) => {
            logger.error('Redis Client Error:', err);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            logger.info('Redis Client Connected');
            this.isConnected = true;
        });

        this.client.on('ready', () => {
            logger.info('Redis Client Ready');
            this.isConnected = true;
        });
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    /**
     * Connect to Redis
     */
    async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            if (!this.isConnected) {
                logger.warn('Redis not connected, skipping cache get');
                return null;
            }

            const value = await this.client.get(key);
            if (!value) {
                logger.debug('Cache miss', { key });
                return null;
            }

            logger.debug('Cache hit', { key });
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Redis get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttlSeconds Time to live in seconds (default: 3600 = 1 hour)
     */
    async set(key: string, value: any, ttlSeconds: number = config.redis.cache.defaultTTL): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Redis not connected, skipping cache set');
                return;
            }

            await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
            logger.debug('Cache set', { key, ttl: ttlSeconds });
        } catch (error) {
            logger.error('Redis set error:', error);
        }
    }

    /**
     * Set value in cache with advanced options
     * @param key Cache key
     * @param value Value to cache
     * @param options Advanced caching options
     */
    async setAdvanced(key: string, value: any, options: { ttlSeconds?: number; nx?: boolean; xx?: boolean; get?: boolean }): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Redis not connected, skipping cache set');
                return;
            }

            const ttl = options.ttlSeconds || config.redis.cache.defaultTTL;
            const args: any[] = [key, JSON.stringify(value), 'EX', ttl];
            
            if (options.nx) args.push('NX');
            if (options.xx) args.push('XX');
            if (options.get) args.push('GET');
            
            await this.client.sendCommand(['SET', ...args]);
            logger.debug('Cache set with advanced options', { key, ttl, options });
        } catch (error) {
            logger.error('Redis set advanced error:', error);
        }
    }

    /**
     * Get or set value with automatic population
     * @param key Cache key
     * @param fetchFunction Function to fetch data if not in cache
     * @param ttlSeconds Time to live in seconds
     */
    async getOrSet<T>(key: string, fetchFunction: () => Promise<T>, ttlSeconds?: number): Promise<T> {
        try {
            // Try to get from cache first
            const cached = await this.get<T>(key);
            if (cached !== null) {
                return cached;
            }

            // Not in cache, fetch and store
            const value = await fetchFunction();
            await this.set(key, value, ttlSeconds);
            return value;
        } catch (error) {
            logger.error('Redis getOrSet error:', error);
            throw error;
        }
    }

    /**
     * Increment a counter in cache
     * @param key Counter key
     * @param amount Amount to increment by (default: 1)
     * @param ttlSeconds Time to live in seconds
     */
    async incrBy(key: string, amount: number = 1, ttlSeconds?: number): Promise<number> {
        try {
            if (!this.isConnected) {
                logger.warn('Redis not connected, skipping cache incr');
                return 0;
            }

            const result = await this.client.incrBy(key, amount);
            
            // Set TTL if provided
            if (ttlSeconds) {
                await this.client.expire(key, ttlSeconds);
            }
            
            logger.debug('Cache incremented', { key, amount, result });
            return result;
        } catch (error) {
            logger.error('Redis incr error:', error);
            return 0;
        }
    }

    /**
     * Delete value from cache
     */
    async del(key: string): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Redis not connected, skipping cache delete');
                return;
            }

            await this.client.del(key);
            logger.debug('Cache deleted', { key });
        } catch (error) {
            logger.error('Redis delete error:', error);
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    async delPattern(pattern: string): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Redis not connected, skipping cache delete pattern');
                return;
            }

            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                logger.debug('Cache pattern deleted', { pattern, count: keys.length });
            }
        } catch (error) {
            logger.error('Redis delete pattern error:', error);
        }
    }

    /**
     * Flush all cache
     */
    async flush(): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Redis not connected, skipping cache flush');
                return;
            }

            await this.client.flushAll();
            logger.info('Cache flushed');
        } catch (error) {
            logger.error('Redis flush error:', error);
        }
    }

    /**
     * Check if Redis is connected
     */
    isReady(): boolean {
        return this.isConnected;
    }

    /**
     * Ping Redis server
     */
    async ping(): Promise<string> {
        if (!this.isConnected) {
            throw new Error('Redis not connected');
        }
        return await this.client.ping();
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<any> {
        try {
            if (!this.isConnected) {
                return null;
            }
            
            const info = await this.client.info();
            const lines = info.split('\n');
            const stats: any = {};
            
            for (const line of lines) {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    stats[key.trim()] = value ? value.trim() : '';
                }
            }
            
            return stats;
        } catch (error) {
            logger.error('Redis stats error:', error);
            return null;
        }
    }

    /**
     * Get cache size information
     */
    async getCacheInfo(): Promise<{ usedMemory: string; connectedClients: string; totalCommands: string; keySpaceHits: string; keySpaceMisses: string; hitRate: number } | null> {
        try {
            if (!this.isConnected) {
                return null;
            }
            
            const stats = await this.getStats();
            if (!stats) return null;
            
            const keySpaceHits = parseInt(stats.keyspace_hits || '0');
            const keySpaceMisses = parseInt(stats.keyspace_misses || '0');
            const totalRequests = keySpaceHits + keySpaceMisses;
            const hitRate = totalRequests > 0 ? (keySpaceHits / totalRequests) * 100 : 0;
            
            return {
                usedMemory: stats.used_memory_human || '0B',
                connectedClients: stats.connected_clients || '0',
                totalCommands: stats.total_commands_processed || '0',
                keySpaceHits: stats.keyspace_hits || '0',
                keySpaceMisses: stats.keyspace_misses || '0',
                hitRate: parseFloat(hitRate.toFixed(2))
            };
        } catch (error) {
            logger.error('Redis cache info error:', error);
            return null;
        }
    }

    /**
     * Get client for direct access
     */
    getClient(): RedisClientType {
        return this.client;
    }
}
