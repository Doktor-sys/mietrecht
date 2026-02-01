"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertCorrelationEngine = void 0;
const logger_1 = require("../utils/logger");
const AlertManager_1 = require("./kms/AlertManager");
/**
 * Alert Correlation Engine
 * Uses pattern recognition to correlate related alerts and reduce noise
 */
class AlertCorrelationEngine {
    constructor(correlationWindowMs = 300000) {
        this.patterns = [];
        this.alertGroups = [];
        this.alertHistory = [];
        this.correlationWindowMs = correlationWindowMs;
        // Initialize with common patterns
        this.initializeCommonPatterns();
    }
    /**
     * Initialize common alert patterns
     */
    initializeCommonPatterns() {
        this.patterns = [
            {
                id: 'brute_force_pattern',
                name: 'Brute Force Attack Pattern',
                description: 'Multiple failed login attempts followed by successful login',
                pattern: ['failed', 'failed', 'failed', 'successful'],
                frequency: 0,
                severity: AlertManager_1.AlertSeverity.CRITICAL,
                recommendations: [
                    'Block IP address immediately',
                    'Notify security team',
                    'Review access logs',
                    'Consider account lockout policy'
                ]
            },
            {
                id: 'performance_degradation_pattern',
                name: 'Performance Degradation Pattern',
                description: 'High CPU usage followed by slow response times',
                pattern: ['high', 'slow', 'high'],
                frequency: 0,
                severity: AlertManager_1.AlertSeverity.ERROR,
                recommendations: [
                    'Scale up resources',
                    'Restart affected services',
                    'Investigate root cause',
                    'Monitor for recurrence'
                ]
            },
            {
                id: 'data_access_pattern',
                name: 'Unusual Data Access Pattern',
                description: 'Multiple data export events from single user',
                pattern: ['export', 'export', 'export'],
                frequency: 0,
                severity: AlertManager_1.AlertSeverity.WARNING,
                recommendations: [
                    'Review user access permissions',
                    'Audit data access logs',
                    'Notify data protection officer',
                    'Consider access restrictions'
                ]
            }
        ];
    }
    /**
     * Process a new alert and correlate it with existing alerts
     */
    processAlert(alert) {
        // Add alert to history
        this.alertHistory.push(alert);
        // Clean up old alerts outside correlation window
        this.cleanupOldAlerts();
        // Try to correlate with existing groups
        const correlatedGroup = this.correlateWithExistingGroups(alert);
        if (correlatedGroup) {
            return correlatedGroup;
        }
        // Try to create new group based on patterns
        const newGroup = this.createGroupFromPattern(alert);
        if (newGroup) {
            this.alertGroups.push(newGroup);
            return newGroup;
        }
        // Create standalone group
        const standaloneGroup = {
            id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            alerts: [alert],
            pattern: null,
            confidence: 0.1,
            timestamp: new Date(),
            resolved: false
        };
        this.alertGroups.push(standaloneGroup);
        return standaloneGroup;
    }
    /**
     * Correlate alert with existing groups
     */
    correlateWithExistingGroups(alert) {
        // Look for groups that are still active and within time window
        for (const group of this.alertGroups) {
            if (!group.resolved &&
                (Date.now() - group.timestamp.getTime()) < this.correlationWindowMs) {
                // Simple correlation: same severity and related metadata
                if (this.isRelatedAlert(group.alerts[0], alert)) {
                    group.alerts.push(alert);
                    group.timestamp = new Date(); // Update timestamp
                    // Increase confidence based on correlation strength
                    group.confidence = Math.min(1.0, group.confidence + 0.1);
                    return group;
                }
            }
        }
        return null;
    }
    /**
     * Check if two alerts are related
     */
    isRelatedAlert(alert1, alert2) {
        // Same severity level
        if (alert1.severity !== alert2.severity) {
            return false;
        }
        // Same user or resource (if metadata exists)
        if (alert1.metadata && alert2.metadata) {
            // Check for common user ID
            if (alert1.metadata.userId && alert2.metadata.userId &&
                alert1.metadata.userId === alert2.metadata.userId) {
                return true;
            }
            // Check for common IP address
            if (alert1.metadata.ipAddress && alert2.metadata.ipAddress &&
                alert1.metadata.ipAddress === alert2.metadata.ipAddress) {
                return true;
            }
            // Check for common resource
            if (alert1.metadata.resource && alert2.metadata.resource &&
                alert1.metadata.resource === alert2.metadata.resource) {
                return true;
            }
        }
        // Check if alerts occurred close in time (within 30 seconds)
        const timeDiff = Math.abs(alert1.timestamp.getTime() - alert2.timestamp.getTime());
        return timeDiff < 30000; // 30 seconds
    }
    /**
     * Create group based on known patterns
     */
    createGroupFromPattern(alert) {
        // Look for matching patterns in recent alert history
        for (const pattern of this.patterns) {
            if (this.matchesPattern(pattern)) {
                // Found a pattern match
                const matchingAlerts = this.getAlertsMatchingPattern(pattern);
                if (matchingAlerts.length >= 2) { // At least 2 alerts to form a group
                    const group = {
                        id: `group_${pattern.id}_${Date.now()}`,
                        alerts: matchingAlerts,
                        pattern: pattern,
                        confidence: 0.8, // High confidence for pattern match
                        timestamp: new Date(),
                        resolved: false
                    };
                    // Update pattern frequency
                    pattern.frequency++;
                    logger_1.logger.info(`Alert correlation: Pattern '${pattern.name}' detected with ${matchingAlerts.length} alerts`);
                    return group;
                }
            }
        }
        return null;
    }
    /**
     * Check if recent alerts match a pattern
     */
    matchesPattern(pattern) {
        // Get recent alerts within correlation window
        const recentAlerts = this.getRecentAlerts();
        if (recentAlerts.length < pattern.pattern.length) {
            return false;
        }
        // Check for pattern sequence match
        // We need to find a sequence of alerts that matches the pattern
        for (let i = 0; i <= recentAlerts.length - pattern.pattern.length; i++) {
            let sequenceMatch = true;
            for (let j = 0; j < pattern.pattern.length; j++) {
                const alert = recentAlerts[i + j];
                const patternElement = pattern.pattern[j];
                // Check if alert title or message contains the pattern element
                if (alert.title.toLowerCase().includes(patternElement.toLowerCase()) ||
                    alert.message.toLowerCase().includes(patternElement.toLowerCase())) {
                    // This element matches, continue checking
                }
                else {
                    sequenceMatch = false;
                    break;
                }
            }
            if (sequenceMatch) {
                return true;
            }
        }
        return false;
    }
    /**
     * Get alerts that match a pattern
     */
    getAlertsMatchingPattern(pattern) {
        const recentAlerts = this.getRecentAlerts();
        // Find the first sequence that matches the pattern
        for (let i = 0; i <= recentAlerts.length - pattern.pattern.length; i++) {
            let sequenceMatch = true;
            const potentialMatches = [];
            for (let j = 0; j < pattern.pattern.length; j++) {
                const alert = recentAlerts[i + j];
                const patternElement = pattern.pattern[j];
                // Check if alert title or message contains the pattern element
                if (alert.title.toLowerCase().includes(patternElement.toLowerCase()) ||
                    alert.message.toLowerCase().includes(patternElement.toLowerCase())) {
                    potentialMatches.push(alert);
                }
                else {
                    sequenceMatch = false;
                    break;
                }
            }
            if (sequenceMatch) {
                return potentialMatches;
            }
        }
        return [];
    }
    /**
     * Get recent alerts within correlation window
     */
    getRecentAlerts() {
        const cutoffTime = Date.now() - this.correlationWindowMs;
        return this.alertHistory
            .filter(alert => alert.timestamp.getTime() > cutoffTime)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort by timestamp ascending
    }
    /**
     * Clean up old alerts outside correlation window
     */
    cleanupOldAlerts() {
        const cutoffTime = Date.now() - this.correlationWindowMs * 2; // Keep 2x window
        this.alertHistory = this.alertHistory.filter(alert => alert.timestamp.getTime() > cutoffTime);
    }
    /**
     * Mark a correlated alert group as resolved
     */
    resolveGroup(groupId) {
        const group = this.alertGroups.find(g => g.id === groupId);
        if (group) {
            group.resolved = true;
            logger_1.logger.info(`Alert group ${groupId} marked as resolved`);
            return true;
        }
        return false;
    }
    /**
     * Get all active correlated alert groups
     */
    getActiveGroups() {
        return this.alertGroups.filter(group => !group.resolved);
    }
    /**
     * Get statistics about alert correlation
     */
    getStatistics() {
        const activeGroups = this.getActiveGroups();
        const resolvedGroups = this.alertGroups.filter(group => group.resolved);
        const totalConfidence = this.alertGroups.reduce((sum, group) => sum + group.confidence, 0);
        const averageConfidence = this.alertGroups.length > 0 ? totalConfidence / this.alertGroups.length : 0;
        const patternMatches = this.patterns.reduce((sum, pattern) => sum + pattern.frequency, 0);
        return {
            totalGroups: this.alertGroups.length,
            activeGroups: activeGroups.length,
            resolvedGroups: resolvedGroups.length,
            patternMatches: patternMatches,
            averageConfidence: parseFloat(averageConfidence.toFixed(2))
        };
    }
    /**
     * Add a new alert pattern
     */
    addPattern(pattern) {
        this.patterns.push(pattern);
        logger_1.logger.info(`New alert pattern added: ${pattern.name}`);
    }
    /**
     * Remove an alert pattern
     */
    removePattern(patternId) {
        const initialLength = this.patterns.length;
        this.patterns = this.patterns.filter(p => p.id !== patternId);
        return this.patterns.length < initialLength;
    }
    /**
     * Get all known patterns
     */
    getPatterns() {
        return [...this.patterns];
    }
}
exports.AlertCorrelationEngine = AlertCorrelationEngine;
