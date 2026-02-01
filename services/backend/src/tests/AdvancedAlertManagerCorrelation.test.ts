import { AdvancedAlertManager, AdvancedAlertConfig } from '../services/AdvancedAlertManager';
import { AlertSeverity } from '../services/kms/AlertManager';

describe('AdvancedAlertManager with Correlation', () => {
  let alertManager: AdvancedAlertManager;

  beforeEach(() => {
    const config: AdvancedAlertConfig = {
      enabled: true,
      correlationEnabled: true,
      correlationWindowMs: 1000, // 1 second for testing
      alertDeduplicationWindowMs: 1000,
    };
    
    alertManager = new AdvancedAlertManager(config);
  });

  describe('Alert Correlation', () => {
    it('should process alerts through correlation engine', () => {
      // Create alerts that should be correlated
      const alert1 = alertManager.createAlert(
        AlertSeverity.WARNING,
        'Failed Login Attempt',
        'Failed login for user test',
        { userId: 'test', ipAddress: '192.168.1.1' }
      );

      const alert2 = alertManager.createAlert(
        AlertSeverity.WARNING,
        'Failed Login Attempt',
        'Failed login for user test - second attempt',
        { userId: 'test', ipAddress: '192.168.1.1' }
      );

      expect(alert1).toBeDefined();
      expect(alert2).toBeDefined();
      
      // Both alerts should have been created
      expect(alert1.id).not.toBe('duplicate');
      expect(alert2.id).not.toBe('duplicate');
    });

    it('should provide correlation statistics', () => {
      const stats = alertManager.getCorrelationStatistics();
      
      expect(stats).not.toBeNull();
      expect(stats?.totalGroups).toBeGreaterThanOrEqual(0);
      expect(stats?.activeGroups).toBeGreaterThanOrEqual(0);
      expect(stats?.resolvedGroups).toBeGreaterThanOrEqual(0);
      expect(stats?.patternMatches).toBeGreaterThanOrEqual(0);
    });

    it('should manage correlation patterns', () => {
      const initialPatterns = alertManager.getKnownPatterns();
      
      const newPattern = {
        id: 'test-correlation-pattern',
        name: 'Test Correlation Pattern',
        description: 'A test pattern for correlation',
        pattern: ['test', 'test'],
        frequency: 0,
        severity: AlertSeverity.INFO,
        recommendations: ['Test recommendation']
      };
      
      alertManager.addPattern(newPattern);
      
      const patternsAfterAdd = alertManager.getKnownPatterns();
      expect(patternsAfterAdd).toHaveLength(initialPatterns.length + 1);
      expect(patternsAfterAdd.some(p => p.id === 'test-correlation-pattern')).toBe(true);
      
      const removalResult = alertManager.removePattern('test-correlation-pattern');
      expect(removalResult).toBe(true);
      
      const patternsAfterRemove = alertManager.getKnownPatterns();
      expect(patternsAfterRemove).toHaveLength(initialPatterns.length);
      expect(patternsAfterRemove.some(p => p.id === 'test-correlation-pattern')).toBe(false);
    });
  });
});
