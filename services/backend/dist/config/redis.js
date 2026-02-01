"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.connectRedis = exports.redis = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
const config_1 = require("./config");
class RedisService {
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_1.config.redis.url,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger_1.logger.error('Redis: Maximale Anzahl von Reconnect-Versuchen erreicht');
                        return new Error('Redis Reconnect fehlgeschlagen');
                    }
                    return Math.min(retries * 50, 1000);
                },
            },
        });
        // Event Listeners
        this.client.on('connect', () => {
            logger_1.logger.info('Redis: Verbindung wird hergestellt...');
        });
        this.client.on('ready', () => {
            logger_1.logger.info('Redis: Verbindung bereit');
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Redis Fehler:', error);
        });
        this.client.on('end', () => {
            logger_1.logger.info('Redis: Verbindung beendet');
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('Redis: Reconnecting...');
        });
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    getClient() {
        return this.client;
    }
    async connect() {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            logger_1.logger.info('Redis-Verbindung erfolgreich hergestellt');
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Verbinden zu Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.client.isOpen) {
                await this.client.disconnect();
            }
            logger_1.logger.info('Redis-Verbindung getrennt');
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Trennen der Redis-Verbindung:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis Health Check fehlgeschlagen:', error);
            return false;
        }
    }
    // Cache Helper Methods
    async set(key, value, ttlSeconds) {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, serializedValue);
            }
            else {
                await this.client.set(key, serializedValue);
            }
        }
        catch (error) {
            logger_1.logger.error(`Redis SET Fehler für Key ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            if (value === null) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Redis GET Fehler für Key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis DEL Fehler für Key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Redis EXISTS Fehler für Key ${key}:`, error);
            throw error;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            await this.client.expire(key, ttlSeconds);
        }
        catch (error) {
            logger_1.logger.error(`Redis EXPIRE Fehler für Key ${key}:`, error);
            throw error;
        }
    }
    // Session Management
    async setSession(sessionId, sessionData, ttlSeconds = 86400) {
        const key = `session:${sessionId}`;
        await this.set(key, sessionData, ttlSeconds);
    }
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return this.get(key);
    }
    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        await this.del(key);
    }
    // Rate Limiting
    async incrementRateLimit(key, windowSeconds) {
        try {
            const multi = this.client.multi();
            multi.incr(key);
            multi.expire(key, windowSeconds);
            const results = await multi.exec();
            return results?.[0] || 0;
        }
        catch (error) {
            logger_1.logger.error(`Redis Rate Limit Fehler für Key ${key}:`, error);
            throw error;
        }
    }
    // Cache Patterns
    async getOrSet(key, fetchFunction, ttlSeconds = 3600) {
        try {
            // Versuche aus Cache zu lesen
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            // Wenn nicht im Cache, lade Daten und speichere sie
            const data = await fetchFunction();
            await this.set(key, data, ttlSeconds);
            return data;
        }
        catch (error) {
            logger_1.logger.error(`Redis getOrSet Fehler für Key ${key}:`, error);
            throw error;
        }
    }
}
// Exportiere Singleton-Instanz
exports.redis = RedisService.getInstance();
// Helper-Funktion für die Verbindung
const connectRedis = async () => {
    await exports.redis.connect();
    return exports.redis.getClient();
};
exports.connectRedis = connectRedis;
// Helper-Funktion für Graceful Shutdown
const disconnectRedis = async () => {
    await exports.redis.disconnect();
};
exports.disconnectRedis = disconnectRedis;
// Graceful Shutdown Handler
process.on('beforeExit', async () => {
    await (0, exports.disconnectRedis)();
});
process.on('SIGINT', async () => {
    await (0, exports.disconnectRedis)();
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectRedis)();
});
