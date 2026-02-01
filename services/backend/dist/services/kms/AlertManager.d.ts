import { SecurityAlert } from '../SecurityMonitoringService';
/**
 * Alert-Typen
 */
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Alert-Daten
 */
export interface Alert {
    id: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    resolved?: boolean;
    resolvedAt?: Date;
}
/**
 * Alert-Konfiguration
 */
export interface AlertConfig {
    enabled: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
    slackChannel?: string;
    slackWebhookUrl?: string;
    pagerDutyIntegrationKey?: string;
    pagerDutyApiKey?: string;
}
/**
 * Alert Manager für KMS Security-Events
 * Verwaltet Alerts und Benachrichtigungen
 */
export declare class AlertManager {
    private alerts;
    private config;
    private alertHandlers;
    private slackService;
    private pagerDutyService;
    constructor(config?: AlertConfig);
    /**
     * Registriert einen Alert-Handler
     */
    registerHandler(severity: AlertSeverity, handler: (alert: Alert) => void): void;
    /**
     * Erstellt einen neuen Alert
     */
    createAlert(severity: AlertSeverity, title: string, message: string, metadata?: Record<string, any>): Alert;
    /**
     * Erstellt einen Alert aus einem SecurityAlert
     */
    createAlertFromSecurityAlert(securityAlert: SecurityAlert): Alert;
    /**
     * Loggt einen Alert
     */
    private logAlert;
    /**
     * Führt registrierte Handler aus
     */
    private executeHandlers;
    /**
     * Sendet Benachrichtigungen über verschiedene Kanäle
     */
    private sendNotifications;
    /**
     * Markiert einen Alert als gelöst
     */
    resolveAlert(alertId: string): boolean;
    /**
     * Gibt alle aktiven Alerts zurück
     */
    getActiveAlerts(): Alert[];
    /**
     * Gibt Alerts nach Severity zurück
     */
    getAlertsBySeverity(severity: AlertSeverity): Alert[];
    /**
     * Erstellt Alert für einen SecurityEvent
     */
    handleSecurityEvent(eventType: string, details: Record<string, any>): void;
    /**
     * Erstellt Alert für Rotation-Fehler
     */
    handleRotationError(keyId: string, error: Error): void;
    /**
     * Erstellt Alert für überfällige Rotationen
     */
    handleOverdueRotations(count: number, keyIds: string[]): void;
    /**
     * Erstellt Alert für Health Check Fehler
     */
    handleHealthCheckFailure(component: string, error: string): void;
    /**
     * Erstellt Alert für Performance-Probleme
     */
    handlePerformanceIssue(metric: string, value: number, threshold: number): void;
    /**
     * Bereinigt alte gelöste Alerts
     */
    cleanupOldAlerts(maxAgeMs?: number): number;
    /**
     * Gibt Alert-Statistiken zurück
     */
    getStatistics(): {
        total: number;
        active: number;
        resolved: number;
        bySeverity: Record<AlertSeverity, number>;
    };
}
