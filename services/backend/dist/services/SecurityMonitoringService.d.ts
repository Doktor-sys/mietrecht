import { PrismaClient } from '@prisma/client';
import { AuditService } from './AuditService';
import { AlertManager } from './kms/AlertManager';
/**
 * Security Monitoring Service
 *
 * Überwacht Sicherheitsereignisse in Echtzeit und erkennt verdächtige Aktivitäten
 */
export interface SecurityAlert {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    affectedUserId?: string;
    affectedTenantId?: string;
    affectedResource?: {
        type: string;
        id: string;
    };
    recommendations: string[];
    acknowledged: boolean;
}
export interface SecurityMetrics {
    timestamp: Date;
    period: {
        startDate: Date;
        endDate: Date;
    };
    metrics: {
        totalEvents: number;
        failedLogins: number;
        unauthorizedAccess: number;
        suspiciousActivity: number;
        dataExports: number;
        gdprRequests: number;
        anomaliesDetected: number;
    };
    topUsers: Array<{
        userId: string;
        eventCount: number;
        failureRate: number;
    }>;
    topResources: Array<{
        resourceType: string;
        resourceId: string;
        accessCount: number;
    }>;
}
export declare class SecurityMonitoringService {
    private prisma;
    private auditService;
    private alerts;
    private alertManager;
    constructor(prisma: PrismaClient, auditService: AuditService, alertManager: AlertManager);
    /**
     * Startet kontinuierliches Security-Monitoring
     */
    startMonitoring(intervalMinutes?: number): Promise<void>;
    /**
     * Führt eine Security-Überprüfung durch
     */
    private performSecurityCheck;
    /**
     * Erkennt fehlgeschlagene Login-Versuche
     */
    private detectFailedLogins;
    /**
     * Erkennt verdächtige Login-Muster
     */
    private detectSuspiciousLogins;
    /**
     * Erkennt ungewöhnliche Datenzugriffe
     */
    private detectUnusualDataAccess;
    /**
     * Erkennt Rate-Limit-Überschreitungen
     */
    private detectRateLimitViolations;
    /**
     * Erstellt einen Alert aus einer Anomalie
     */
    private createAlertFromAnomaly;
    /**
     * Gibt Empfehlungen für einen Anomalie-Typ zurück
     */
    private getRecommendationsForAnomalyType;
    /**
     * Gibt alle aktiven Alerts zurück
     */
    getActiveAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): SecurityAlert[];
    /**
     * Bestätigt einen Alert
     */
    acknowledgeAlert(alertId: string): boolean;
    /**
     * Generiert Security-Metriken
     */
    generateSecurityMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics>;
    /**
     * Bereinigt alte Alerts
     */
    cleanupOldAlerts(retentionDays?: number): number;
}
