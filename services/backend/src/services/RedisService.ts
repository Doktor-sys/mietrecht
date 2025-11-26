import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

/**
 * Redis Service for caching
 * Provides a simple interface for cache operations
 */
export class RedisService {
    private static instance: RedisService;
    private client: RedisClientType;
    private isConnected: boolean = false;

    private constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = createClient({ url: redisUrl });

        this.client.on('error', (err) => {
            logger.error('Redis Client Error:', err);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            logger.info('Redis Client Connected');
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
    async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
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
}
