"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
/**
 * Redis Service for caching
 * Provides a simple interface for cache operations
 */
class RedisService {
    constructor() {
        this.isConnected = false;
        const redisUrl = config_1.config.redis.url;
        this.client = (0, redis_1.createClient)({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger_1.logger.error('Max retries reached for Redis connection');
                        return new Error('Max retries reached');
                    }
                    // Exponential backoff: 50ms * 2^retries
                    return Math.min(retries * 50, 1000);
                }
            }
        });
        this.client.on('error', (err) => {
            logger_1.logger.error('Redis Client Error:', err);
            this.isConnected = false;
        });
        this.client.on('connect', () => {
            logger_1.logger.info('Redis Client Connected');
            this.isConnected = true;
        });
        this.client.on('ready', () => {
            logger_1.logger.info('Redis Client Ready');
            this.isConnected = true;
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    /**
     * Connect to Redis
     */
    async connect() {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
    /**
     * Get value from cache
     */
    async get(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache get');
                return null;
            }
            const value = await this.client.get(key);
            if (!value) {
                logger_1.logger.debug('Cache miss', { key });
                return null;
            }
            logger_1.logger.debug('Cache hit', { key });
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error('Redis get error:', error);
            return null;
        }
    }
    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttlSeconds Time to live in seconds (default: 3600 = 1 hour)
     */
    async set(key, value, ttlSeconds = config_1.config.redis.cache.defaultTTL) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache set');
                return;
            }
            await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
            logger_1.logger.debug('Cache set', { key, ttl: ttlSeconds });
        }
        catch (error) {
            logger_1.logger.error('Redis set error:', error);
        }
    }
    /**
     * Set value in cache with advanced options
     * @param key Cache key
     * @param value Value to cache
     * @param options Advanced caching options
     */
    async setAdvanced(key, value, options) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache set');
                return;
            }
            const ttl = options.ttlSeconds || config_1.config.redis.cache.defaultTTL;
            const args = [key, JSON.stringify(value), 'EX', ttl];
            if (options.nx)
                args.push('NX');
            if (options.xx)
                args.push('XX');
            if (options.get)
                args.push('GET');
            await this.client.sendCommand(['SET', ...args]);
            logger_1.logger.debug('Cache set with advanced options', { key, ttl, options });
        }
        catch (error) {
            logger_1.logger.error('Redis set advanced error:', error);
        }
    }
    /**
     * Get or set value with automatic population
     * @param key Cache key
     * @param fetchFunction Function to fetch data if not in cache
     * @param ttlSeconds Time to live in seconds
     */
    async getOrSet(key, fetchFunction, ttlSeconds) {
        try {
            // Try to get from cache first
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            // Not in cache, fetch and store
            const value = await fetchFunction();
            await this.set(key, value, ttlSeconds);
            return value;
        }
        catch (error) {
            logger_1.logger.error('Redis getOrSet error:', error);
            throw error;
        }
    }
    /**
     * Increment a counter in cache
     * @param key Counter key
     * @param amount Amount to increment by (default: 1)
     * @param ttlSeconds Time to live in seconds
     */
    async incrBy(key, amount = 1, ttlSeconds) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache incr');
                return 0;
            }
            const result = await this.client.incrBy(key, amount);
            // Set TTL if provided
            if (ttlSeconds) {
                await this.client.expire(key, ttlSeconds);
            }
            logger_1.logger.debug('Cache incremented', { key, amount, result });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Redis incr error:', error);
            return 0;
        }
    }
    /**
     * Delete value from cache
     */
    async del(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache delete');
                return;
            }
            await this.client.del(key);
            logger_1.logger.debug('Cache deleted', { key });
        }
        catch (error) {
            logger_1.logger.error('Redis delete error:', error);
        }
    }
    /**
     * Delete multiple keys matching a pattern
     */
    async delPattern(pattern) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache delete pattern');
                return;
            }
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                logger_1.logger.debug('Cache pattern deleted', { pattern, count: keys.length });
            }
        }
        catch (error) {
            logger_1.logger.error('Redis delete pattern error:', error);
        }
    }
    /**
     * Flush all cache
     */
    async flush() {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Redis not connected, skipping cache flush');
                return;
            }
            await this.client.flushAll();
            logger_1.logger.info('Cache flushed');
        }
        catch (error) {
            logger_1.logger.error('Redis flush error:', error);
        }
    }
    /**
     * Check if Redis is connected
     */
    isReady() {
        return this.isConnected;
    }
    /**
     * Ping Redis server
     */
    async ping() {
        if (!this.isConnected) {
            throw new Error('Redis not connected');
        }
        return await this.client.ping();
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            if (!this.isConnected) {
                return null;
            }
            const info = await this.client.info();
            const lines = info.split('\n');
            const stats = {};
            for (const line of lines) {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    stats[key.trim()] = value ? value.trim() : '';
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Redis stats error:', error);
            return null;
        }
    }
    /**
     * Get cache size information
     */
    async getCacheInfo() {
        try {
            if (!this.isConnected) {
                return null;
            }
            const stats = await this.getStats();
            if (!stats)
                return null;
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
        }
        catch (error) {
            logger_1.logger.error('Redis cache info error:', error);
            return null;
        }
    }
    /**
     * Get client for direct access
     */
    getClient() {
        return this.client;
    }
}
exports.RedisService = RedisService;
