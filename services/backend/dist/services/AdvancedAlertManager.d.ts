import { Alert, AlertSeverity, AlertConfig } from './kms/AlertManager';
import { SecurityAlert } from './SecurityMonitoringService';
/**
 * Microsoft Teams Service für Benachrichtigungen
 */
export declare class TeamsService {
    private webhookUrl;
    constructor(webhookUrl?: string);
    /**
     * Sendet einen Alert an einen Microsoft Teams Channel
     */
    sendAlert(alert: Alert): Promise<void>;
    /**
     * Gibt die Farbe für den Alert-Typ zurück
     */
    private getAlertColor;
    /**
     * Prüft, ob der Service korrekt konfiguriert ist
     */
    isConfigured(): boolean;
}
/**
 * SMS Service für Benachrichtigungen via Twilio
 */
export declare class SMSService {
    private accountSid;
    private authToken;
    private fromNumber;
    constructor(accountSid?: string, authToken?: string, fromNumber?: string);
    /**
     * Sendet eine SMS-Benachrichtigung
     */
    sendSMS(to: string, alert: Alert): Promise<void>;
    /**
     * Prüft, ob der Service korrekt konfiguriert ist
     */
    isConfigured(): boolean;
}
/**
 * Custom Webhook Service für Benachrichtigungen
 */
export declare class WebhookService {
    private urls;
    constructor(urls?: string[]);
    /**
     * Sendet einen Alert an alle konfigurierten Webhooks
     */
    sendAlert(alert: Alert): Promise<void>;
    /**
     * Fügt eine neue Webhook-URL hinzu
     */
    addWebhook(url: string): void;
    /**
     * Entfernt eine Webhook-URL
     */
    removeWebhook(url: string): void;
    /**
     * Gibt alle konfigurierten Webhook-URLs zurück
     */
    getWebhooks(): string[];
}
/**
 * Erweiterte Alert-Konfiguration
 */
export interface AdvancedAlertConfig extends AlertConfig {
    teamsWebhookUrl?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    twilioCriticalAlertNumbers?: string[];
    customWebhookUrls?: string[];
    emailRecipients?: string[];
    emailCriticalOnly?: boolean;
    alertDeduplicationWindowMs?: number;
    correlationEnabled?: boolean;
    correlationWindowMs?: number;
}
/**
 * Erweiterte Alert-Manager für KMS Security-Events
 * Verwaltet Alerts und Benachrichtigungen über mehrere Kanäle
 */
export declare class AdvancedAlertManager {
    private alerts;
    private config;
    private alertHandlers;
    private slackService;
    private pagerDutyService;
    private emailService;
    private teamsService;
    private smsService;
    private webhookService;
    private alertHistory;
    private correlationEngine;
    constructor(config?: AdvancedAlertConfig);
    /**
     * Registriert einen Alert-Handler
     */
    registerHandler(severity: AlertSeverity, handler: (alert: Alert) => void): void;
    /**
     * Erstellt einen neuen Alert
     */
    createAlert(severity: AlertSeverity, title: string, message: string, metadata?: Record<string, any>): Alert;
    /**
     * Prüft, ob ein Alert ein Duplikat ist
     */
    private isDuplicateAlert;
    /**
     * Zeichnet einen Alert für Deduplikation auf
     */
    private recordAlert;
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
     * Sendet eine E-Mail-Benachrichtigung
     */
    private sendEmailAlert;
    /**
     * Gibt die Farbe für den Alert-Typ zurück
     */
    private getAlertColor;
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
    /**
     * Gibt Correlation-Statistiken zurück
     */
    getCorrelationStatistics(): {
        totalGroups: number;
        activeGroups: number;
        resolvedGroups: number;
        patternMatches: number;
        averageConfidence: number;
    } | null;
    /**
     * Gibt bekannte Alert-Muster zurück
     */
    getKnownPatterns(): any[];
    /**
     * Fügt ein neues Alert-Muster hinzu
     */
    addPattern(pattern: any): void;
    /**
     * Entfernt ein Alert-Muster
     */
    removePattern(patternId: string): boolean;
    /**
     * Markiert eine korrelierte Alert-Gruppe als gelöst
     */
    resolveCorrelatedGroup(groupId: string): boolean;
}
