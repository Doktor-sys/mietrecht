"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const logger_1 = require("../utils/logger");
const performance_config_1 = require("../config/performance.config");
class CacheService {
    constructor() {
        this.stats = {
            hits: 0,
            misses: 0,
            keys: 0
        };
        this.cache = new Map();
        // Periodically clean up expired entries
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 600000); // Clean up every 10 minutes
    }
    cleanupExpiredEntries() {
        const now = Date.now();
        let deletedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiry && entry.expiry < now) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            logger_1.logger.debug(`Cache cleanup: removed ${deletedCount} expired entries`);
            this.stats.keys = this.cache.size;
        }
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    /**
     * Holt einen Wert aus dem Cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            logger_1.logger.debug(`Cache MISS: ${key}`);
            return undefined;
        }
        // Check if entry has expired
        if (entry.expiry && entry.expiry < Date.now()) {
            this.cache.delete(key);
            this.stats.keys = this.cache.size;
            this.stats.misses++;
            logger_1.logger.debug(`Cache MISS (expired): ${key}`);
            return undefined;
        }
        this.stats.hits++;
        logger_1.logger.debug(`Cache HIT: ${key}`);
        return entry.value;
    }
    /**
     * Speichert einen Wert im Cache
     */
    set(key, value, ttlSeconds) {
        const ttl = ttlSeconds || performance_config_1.PERFORMANCE_CONFIG.DATABASE_CACHE.TTL_SECONDS;
        const expiry = ttl > 0 ? Date.now() + (ttl * 1000) : null;
        this.cache.set(key, { value, expiry });
        this.stats.keys = this.cache.size;
        logger_1.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
        return true;
    }
    /**
     * Löscht einen Wert aus dem Cache
     */
    del(key) {
        const hadKey = this.cache.has(key);
        this.cache.delete(key);
        this.stats.keys = this.cache.size;
        if (hadKey) {
            logger_1.logger.debug(`Cache DELETE: ${key}`);
            return 1;
        }
        logger_1.logger.debug(`Cache DELETE: ${key} (not found)`);
        return 0;
    }
    /**
     * Löscht mehrere Werte aus dem Cache
     */
    delMultiple(keys) {
        let deletedCount = 0;
        for (const key of keys) {
            if (this.cache.has(key)) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        this.stats.keys = this.cache.size;
        logger_1.logger.debug(`Cache DELETE MULTIPLE: ${keys.length} keys (${deletedCount} items deleted)`);
        return deletedCount;
    }
    /**
     * Prüft ob ein Schlüssel im Cache existiert
     */
    has(key) {
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
    flushAll() {
        this.cache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            keys: 0
        };
        logger_1.logger.info('Cache FLUSH ALL');
    }
    /**
     * Holt Cache-Statistiken
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Holt alle Schlüssel aus dem Cache
     */
    getKeys() {
        // Filter out expired entries
        const now = Date.now();
        const keys = [];
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
    getKeyCount() {
        return this.getKeys().length;
    }
    /**
     * Verlängert die Gültigkeit eines Cache-Eintrags
     */
    extendTTL(key, ttlSeconds) {
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
        logger_1.logger.debug(`Cache TTL EXTENDED: ${key} (new TTL: ${ttlSeconds}s)`);
        return true;
    }
}
exports.CacheService = CacheService;
