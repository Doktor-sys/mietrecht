import { Alert, AlertSeverity } from './kms/AlertManager';
/**
 * Alert Pattern represents a recurring alert pattern
 */
interface AlertPattern {
    id: string;
    name: string;
    description: string;
    pattern: string[];
    frequency: number;
    severity: AlertSeverity;
    recommendations: string[];
}
/**
 * Correlated Alert Group
 */
interface CorrelatedAlertGroup {
    id: string;
    alerts: Alert[];
    pattern: AlertPattern | null;
    confidence: number;
    timestamp: Date;
    resolved: boolean;
}
/**
 * Alert Correlation Engine
 * Uses pattern recognition to correlate related alerts and reduce noise
 */
export declare class AlertCorrelationEngine {
    private patterns;
    private alertGroups;
    private alertHistory;
    private correlationWindowMs;
    constructor(correlationWindowMs?: number);
    /**
     * Initialize common alert patterns
     */
    private initializeCommonPatterns;
    /**
     * Process a new alert and correlate it with existing alerts
     */
    processAlert(alert: Alert): CorrelatedAlertGroup | null;
    /**
     * Correlate alert with existing groups
     */
    private correlateWithExistingGroups;
    /**
     * Check if two alerts are related
     */
    private isRelatedAlert;
    /**
     * Create group based on known patterns
     */
    private createGroupFromPattern;
    /**
     * Check if recent alerts match a pattern
     */
    private matchesPattern;
    /**
     * Get alerts that match a pattern
     */
    private getAlertsMatchingPattern;
    /**
     * Get recent alerts within correlation window
     */
    private getRecentAlerts;
    /**
     * Clean up old alerts outside correlation window
     */
    private cleanupOldAlerts;
    /**
     * Mark a correlated alert group as resolved
     */
    resolveGroup(groupId: string): boolean;
    /**
     * Get all active correlated alert groups
     */
    getActiveGroups(): CorrelatedAlertGroup[];
    /**
     * Get statistics about alert correlation
     */
    getStatistics(): {
        totalGroups: number;
        activeGroups: number;
        resolvedGroups: number;
        patternMatches: number;
        averageConfidence: number;
    };
    /**
     * Add a new alert pattern
     */
    addPattern(pattern: AlertPattern): void;
    /**
     * Remove an alert pattern
     */
    removePattern(patternId: string): boolean;
    /**
     * Get all known patterns
     */
    getPatterns(): AlertPattern[];
}
export {};
