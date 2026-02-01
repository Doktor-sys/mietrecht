"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthChecker = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Health Checker für KMS-Komponenten
 * Überprüft alle kritischen Systemkomponenten
 */
class HealthChecker {
    constructor(prisma, redis, masterKeyManager) {
        this.prisma = prisma;
        this.redis = redis;
        this.masterKeyManager = masterKeyManager;
    }
    /**
     * Führt einen vollständigen Health Check durch
     */
    async checkHealth() {
        const startTime = Date.now();
        try {
            // Parallele Checks für bessere Performance
            const [masterKeyHealth, databaseHealth, cacheHealth, rotationHealth] = await Promise.all([
                this.checkMasterKey(),
                this.checkDatabase(),
                this.checkCache(),
                this.checkRotation()
            ]);
            const allHealthy = masterKeyHealth.status === 'healthy' &&
                databaseHealth.status === 'healthy' &&
                cacheHealth.status === 'healthy' &&
                rotationHealth.status === 'healthy';
            const status = {
                healthy: allHealthy,
                timestamp: new Date(),
                checks: {
                    masterKey: masterKeyHealth,
                    database: databaseHealth,
                    cache: cacheHealth,
                    rotation: rotationHealth
                }
            };
            this.lastHealthCheck = status;
            const duration = Date.now() - startTime;
            logger_1.logger.info(`Health check completed in ${duration}ms - Status: ${allHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
            return status;
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            return {
                healthy: false,
                timestamp: new Date(),
                checks: {
                    masterKey: { status: 'unhealthy', message: 'Check failed' },
                    database: { status: 'unhealthy', message: 'Check failed' },
                    cache: { status: 'unhealthy', message: 'Check failed' },
                    rotation: { status: 'unhealthy', message: 'Check failed' }
                },
                details: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Überprüft den Master Key Status
     */
    async checkMasterKey() {
        const startTime = Date.now();
        try {
            const isValid = this.masterKeyManager.validateMasterKey();
            const responseTime = Date.now() - startTime;
            if (!isValid) {
                return {
                    status: 'unhealthy',
                    message: 'Master key validation failed',
                    responseTime,
                    lastCheck: new Date()
                };
            }
            // Teste ob Master Key geladen werden kann
            const masterKey = this.masterKeyManager.getMasterKey();
            if (!masterKey || masterKey.length === 0) {
                return {
                    status: 'unhealthy',
                    message: 'Master key is empty or invalid',
                    responseTime,
                    lastCheck: new Date()
                };
            }
            return {
                status: 'healthy',
                message: 'Master key is valid and accessible',
                responseTime,
                lastCheck: new Date()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Master key check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                responseTime: Date.now() - startTime,
                lastCheck: new Date()
            };
        }
    }
    /**
     * Überprüft die Datenbank-Verbindung
     */
    async checkDatabase() {
        const startTime = Date.now();
        try {
            // Einfache Query um Verbindung zu testen
            await this.prisma.$queryRaw `SELECT 1`;
            // Prüfe ob EncryptionKey Tabelle existiert und zugreifbar ist
            const keyCount = await this.prisma.encryptionKey.count();
            const responseTime = Date.now() - startTime;
            // Warnung bei langsamer Antwort
            if (responseTime > 1000) {
                return {
                    status: 'degraded',
                    message: `Database responding slowly (${responseTime}ms)`,
                    responseTime,
                    lastCheck: new Date()
                };
            }
            return {
                status: 'healthy',
                message: `Database connected (${keyCount} keys)`,
                responseTime,
                lastCheck: new Date()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                responseTime: Date.now() - startTime,
                lastCheck: new Date()
            };
        }
    }
    /**
     * Überprüft den Redis Cache
     */
    async checkCache() {
        const startTime = Date.now();
        try {
            // Teste Redis mit PING
            const pong = await this.redis.ping();
            if (pong !== 'PONG') {
                return {
                    status: 'unhealthy',
                    message: 'Redis ping failed',
                    responseTime: Date.now() - startTime,
                    lastCheck: new Date()
                };
            }
            // Teste Set/Get Operation
            const testKey = 'kms:health:test';
            const testValue = Date.now().toString();
            await this.redis.set(testKey, testValue, { EX: 10 });
            const retrieved = await this.redis.get(testKey);
            await this.redis.del(testKey);
            if (retrieved !== testValue) {
                return {
                    status: 'degraded',
                    message: 'Redis set/get test failed',
                    responseTime: Date.now() - startTime,
                    lastCheck: new Date()
                };
            }
            const responseTime = Date.now() - startTime;
            // Warnung bei langsamer Antwort
            if (responseTime > 500) {
                return {
                    status: 'degraded',
                    message: `Cache responding slowly (${responseTime}ms)`,
                    responseTime,
                    lastCheck: new Date()
                };
            }
            return {
                status: 'healthy',
                message: 'Cache operational',
                responseTime,
                lastCheck: new Date()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Cache check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                responseTime: Date.now() - startTime,
                lastCheck: new Date()
            };
        }
    }
    /**
     * Überprüft den Rotation-Status
     */
    async checkRotation() {
        const startTime = Date.now();
        try {
            // Prüfe auf überfällige Rotationen
            const now = new Date();
            const overdueKeys = await this.prisma.encryptionKey.count({
                where: {
                    status: 'ACTIVE',
                    expiresAt: {
                        lt: now
                    }
                }
            });
            const responseTime = Date.now() - startTime;
            if (overdueKeys > 10) {
                return {
                    status: 'unhealthy',
                    message: `${overdueKeys} keys overdue for rotation`,
                    responseTime,
                    lastCheck: new Date()
                };
            }
            if (overdueKeys > 0) {
                return {
                    status: 'degraded',
                    message: `${overdueKeys} keys overdue for rotation`,
                    responseTime,
                    lastCheck: new Date()
                };
            }
            return {
                status: 'healthy',
                message: 'No overdue rotations',
                responseTime,
                lastCheck: new Date()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Rotation check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                responseTime: Date.now() - startTime,
                lastCheck: new Date()
            };
        }
    }
    /**
     * Gibt den letzten Health Check zurück (ohne neue Prüfung)
     */
    getLastHealthCheck() {
        return this.lastHealthCheck;
    }
    /**
     * Prüft ob ein spezifischer Check kürzlich durchgeführt wurde
     */
    isCheckRecent(maxAgeMs = 60000) {
        if (!this.lastHealthCheck)
            return false;
        const age = Date.now() - this.lastHealthCheck.timestamp.getTime();
        return age < maxAgeMs;
    }
}
exports.HealthChecker = HealthChecker;
