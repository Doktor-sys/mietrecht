"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AlertCorrelationEngine_1 = require("../services/AlertCorrelationEngine");
const AlertManager_1 = require("../services/kms/AlertManager");
describe('AlertCorrelationEngine', () => {
    let correlationEngine;
    beforeEach(() => {
        // Use a small correlation window for testing
        correlationEngine = new AlertCorrelationEngine_1.AlertCorrelationEngine(1000); // 1 second
    });
    describe('Alert Processing', () => {
        it('should process a single alert and create a standalone group', () => {
            const alert = {
                id: 'test-1',
                severity: AlertManager_1.AlertSeverity.WARNING,
                title: 'Test Alert',
                message: 'This is a test alert',
                timestamp: new Date(),
                metadata: { test: 'data' }
            };
            const group = correlationEngine.processAlert(alert);
            expect(group).toBeDefined();
            expect(group?.alerts).toHaveLength(1);
            expect(group?.alerts[0]).toEqual(alert);
            expect(group?.pattern).toBeNull();
            expect(group?.confidence).toBeCloseTo(0.1);
        });
        it('should correlate related alerts into groups', () => {
            const alert1 = {
                id: 'test-1',
                severity: AlertManager_1.AlertSeverity.WARNING,
                title: 'High CPU Usage',
                message: 'CPU usage at 85%',
                timestamp: new Date(),
                metadata: { userId: 'user-123', ipAddress: '192.168.1.1' }
            };
            const alert2 = {
                id: 'test-2',
                severity: AlertManager_1.AlertSeverity.WARNING,
                title: 'Slow Response Times',
                message: 'Response time exceeded 2 seconds',
                timestamp: new Date(Date.now() + 10000), // 10 seconds later
                metadata: { userId: 'user-123', ipAddress: '192.168.1.1' }
            };
            // Process first alert
            const group1 = correlationEngine.processAlert(alert1);
            // Process second alert - should be correlated with first
            const group2 = correlationEngine.processAlert(alert2);
            // Both should return the same group
            expect(group1?.id).toBe(group2?.id);
            expect(group2?.alerts).toHaveLength(2);
            expect(group2?.confidence).toBeGreaterThan(0.1);
        });
    });
    describe('Pattern Matching', () => {
        it('should detect known patterns', () => {
            // Create alerts that match the brute force pattern
            const failedLogin1 = {
                id: 'failed-1',
                severity: AlertManager_1.AlertSeverity.WARNING,
                title: 'Failed Login Attempt',
                message: 'Failed login for user test',
                timestamp: new Date(),
                metadata: { userId: 'test' }
            };
            const failedLogin2 = {
                id: 'failed-2',
                severity: AlertManager_1.AlertSeverity.WARNING,
                title: 'Failed Login Attempt',
                message: 'Failed login for user test',
                timestamp: new Date(Date.now() + 5000),
                metadata: { userId: 'test' }
            };
            const failedLogin3 = {
                id: 'failed-3',
                severity: AlertManager_1.AlertSeverity.WARNING,
                title: 'Failed Login Attempt',
                message: 'Failed login for user test',
                timestamp: new Date(Date.now() + 10000),
                metadata: { userId: 'test' }
            };
            const successLogin = {
                id: 'success-1',
                severity: AlertManager_1.AlertSeverity.INFO,
                title: 'Successful Login',
                message: 'User test logged in successfully',
                timestamp: new Date(Date.now() + 15000),
                metadata: { userId: 'test' }
            };
            // Process all alerts
            correlationEngine.processAlert(failedLogin1);
            correlationEngine.processAlert(failedLogin2);
            correlationEngine.processAlert(failedLogin3);
            const finalGroup = correlationEngine.processAlert(successLogin);
            // Should have detected the pattern
            expect(finalGroup?.pattern).not.toBeNull();
            expect(finalGroup?.pattern?.id).toBe('brute_force_pattern');
            expect(finalGroup?.confidence).toBeGreaterThan(0.5);
        });
    });
    describe('Group Management', () => {
        it('should resolve alert groups', () => {
            const alert = {
                id: 'test-1',
                severity: AlertManager_1.AlertSeverity.INFO,
                title: 'Test Alert',
                message: 'Test message',
                timestamp: new Date()
            };
            const group = correlationEngine.processAlert(alert);
            expect(group).toBeDefined();
            if (group) {
                const result = correlationEngine.resolveGroup(group.id);
                expect(result).toBe(true);
                const activeGroups = correlationEngine.getActiveGroups();
                expect(activeGroups).toHaveLength(0);
            }
        });
        it('should return false for non-existent group resolution', () => {
            const result = correlationEngine.resolveGroup('non-existent');
            expect(result).toBe(false);
        });
    });
    describe('Statistics', () => {
        it('should provide correct correlation statistics', () => {
            // Process a few alerts
            const alert1 = {
                id: 'test-1',
                severity: AlertManager_1.AlertSeverity.INFO,
                title: 'Test Alert 1',
                message: 'Test message 1',
                timestamp: new Date()
            };
            const alert2 = {
                id: 'test-2',
                severity: AlertManager_1.AlertSeverity.WARNING,
                title: 'Test Alert 2',
                message: 'Test message 2',
                timestamp: new Date()
            };
            correlationEngine.processAlert(alert1);
            correlationEngine.processAlert(alert2);
            const stats = correlationEngine.getStatistics();
            expect(stats.totalGroups).toBe(2);
            expect(stats.activeGroups).toBe(2);
            expect(stats.resolvedGroups).toBe(0);
            expect(stats.patternMatches).toBe(0); // No patterns matched
            expect(stats.averageConfidence).toBeCloseTo(0.1);
        });
    });
    describe('Pattern Management', () => {
        it('should add and remove patterns', () => {
            const initialPatterns = correlationEngine.getPatterns();
            const newPattern = {
                id: 'test-pattern',
                name: 'Test Pattern',
                description: 'A test pattern',
                pattern: ['test1', 'test2'],
                frequency: 0,
                severity: AlertManager_1.AlertSeverity.INFO,
                recommendations: ['Test recommendation']
            };
            correlationEngine.addPattern(newPattern);
            const patternsAfterAdd = correlationEngine.getPatterns();
            expect(patternsAfterAdd).toHaveLength(initialPatterns.length + 1);
            expect(patternsAfterAdd.some(p => p.id === 'test-pattern')).toBe(true);
            const removalResult = correlationEngine.removePattern('test-pattern');
            expect(removalResult).toBe(true);
            const patternsAfterRemove = correlationEngine.getPatterns();
            expect(patternsAfterRemove).toHaveLength(initialPatterns.length);
            expect(patternsAfterRemove.some(p => p.id === 'test-pattern')).toBe(false);
        });
    });
});
