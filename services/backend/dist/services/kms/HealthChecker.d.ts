import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import { MasterKeyManager } from './MasterKeyManager';
/**
 * Health Check Status
 */
export interface HealthStatus {
    healthy: boolean;
    timestamp: Date;
    checks: {
        masterKey: ComponentHealth;
        database: ComponentHealth;
        cache: ComponentHealth;
        rotation: ComponentHealth;
    };
    details?: string;
}
/**
 * Einzelner Komponenten-Health-Status
 */
export interface ComponentHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    responseTime?: number;
    lastCheck?: Date;
}
/**
 * Health Checker für KMS-Komponenten
 * Überprüft alle kritischen Systemkomponenten
 */
export declare class HealthChecker {
    private prisma;
    private redis;
    private masterKeyManager;
    private lastHealthCheck?;
    constructor(prisma: PrismaClient, redis: RedisClientType, masterKeyManager: MasterKeyManager);
    /**
     * Führt einen vollständigen Health Check durch
     */
    checkHealth(): Promise<HealthStatus>;
    /**
     * Überprüft den Master Key Status
     */
    private checkMasterKey;
    /**
     * Überprüft die Datenbank-Verbindung
     */
    private checkDatabase;
    /**
     * Überprüft den Redis Cache
     */
    private checkCache;
    /**
     * Überprüft den Rotation-Status
     */
    private checkRotation;
    /**
     * Gibt den letzten Health Check zurück (ohne neue Prüfung)
     */
    getLastHealthCheck(): HealthStatus | undefined;
    /**
     * Prüft ob ein spezifischer Check kürzlich durchgeführt wurde
     */
    isCheckRecent(maxAgeMs?: number): boolean;
}
