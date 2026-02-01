import { AdvancedAlertManager, AdvancedAlertConfig } from '../services/AdvancedAlertManager';
import { AlertSeverity } from '../services/kms/AlertManager';

describe('AdvancedAlertManager', () => {
  let alertManager: AdvancedAlertManager;

  beforeEach(() => {
    const config: AdvancedAlertConfig = {
      enabled: true,
      alertDeduplicationWindowMs: 1000 // 1 second for testing
    };
    
    alertManager = new AdvancedAlertManager(config);
  });

  describe('Alert Creation', () => {
    it('should create an alert with correct properties', () => {
      const alert = alertManager.createAlert(
        AlertSeverity.CRITICAL,
        'Test Alert',
        'This is a test alert',
        { test: 'data' }
      );

      expect(alert).toBeDefined();
      expect(alert.severity).toBe(AlertSeverity.CRITICAL);
      expect(alert.title).toBe('Test Alert');
      expect(alert.message).toBe('This is a test alert');
      expect(alert.metadata).toEqual({ test: 'data' });
      expect(alert.id).toMatch(/^alert_\d+_[a-z0-9]+$/);
      expect(alert.timestamp).toBeInstanceOf(Date);
      expect(alert.resolved).toBe(false);
    });

    it('should store alerts internally', () => {
      const alert = alertManager.createAlert(
        AlertSeverity.WARNING,
        'Storage Test',
        'Testing alert storage'
      );

      const storedAlert = alertManager['alerts'].get(alert.id);
      expect(storedAlert).toBeDefined();
      expect(storedAlert?.title).toBe('Storage Test');
    });
  });

  describe('Alert Resolution', () => {
    it('should resolve an existing alert', () => {
      const alert = alertManager.createAlert(
        AlertSeverity.ERROR,
        'Resolution Test',
        'Testing alert resolution'
      );

      const result = alertManager.resolveAlert(alert.id);
      expect(result).toBe(true);

      const resolvedAlert = alertManager['alerts'].get(alert.id);
      expect(resolvedAlert?.resolved).toBe(true);
      expect(resolvedAlert?.resolvedAt).toBeInstanceOf(Date);
    });

    it('should return false for non-existent alert resolution', () => {
      const result = alertManager.resolveAlert('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Alert Deduplication', () => {
    it('should prevent duplicate alerts within deduplication window', () => {
      // Create first alert
      const alert1 = alertManager.createAlert(
        AlertSeverity.CRITICAL,
        'Duplicate Test',
        'This is a duplicate test message'
      );

      // Create duplicate alert immediately
      const alert2 = alertManager.createAlert(
        AlertSeverity.CRITICAL,
        'Duplicate Test',
        'This is a duplicate test message'
      );

      // Second alert should be marked as duplicate
      expect(alert2.resolved).toBe(true);
      expect(alert2.id).toBe('duplicate');
    });

    it('should allow alerts after deduplication window expires', (done) => {
      // Create first alert
      alertManager.createAlert(
        AlertSeverity.WARNING,
        'Timing Test',
        'This is a timing test message'
      );

      // Wait for deduplication window to expire
      setTimeout(() => {
        const alert2 = alertManager.createAlert(
          AlertSeverity.WARNING,
          'Timing Test',
          'This is a timing test message'
        );

        // Second alert should not be marked as duplicate
        expect(alert2.resolved).toBe(false);
        expect(alert2.id).not.toBe('duplicate');
        done();
      }, 1100); // Wait slightly longer than 1 second
    });
  });

  describe('Alert Statistics', () => {
    it('should provide correct alert statistics', () => {
      // Create some alerts
      alertManager.createAlert(AlertSeverity.CRITICAL, 'Critical 1', 'Message 1');
      alertManager.createAlert(AlertSeverity.ERROR, 'Error 1', 'Message 2');
      alertManager.createAlert(AlertSeverity.WARNING, 'Warning 1', 'Message 3');
      alertManager.createAlert(AlertSeverity.INFO, 'Info 1', 'Message 4');

      const stats = alertManager.getStatistics();
      
      expect(stats.total).toBe(4);
      expect(stats.active).toBe(4);
      expect(stats.resolved).toBe(0);
      expect(stats.bySeverity[AlertSeverity.CRITICAL]).toBe(1);
      expect(stats.bySeverity[AlertSeverity.ERROR]).toBe(1);
      expect(stats.bySeverity[AlertSeverity.WARNING]).toBe(1);
      expect(stats.bySeverity[AlertSeverity.INFO]).toBe(1);
    });

    it('should update statistics when alerts are resolved', () => {
      const alert = alertManager.createAlert(
        AlertSeverity.CRITICAL,
        'Resolution Stats Test',
        'Testing stats with resolution'
      );

      alertManager.resolveAlert(alert.id);
      
      const stats = alertManager.getStatistics();
      expect(stats.total).toBe(1);
      expect(stats.active).toBe(0);
      expect(stats.resolved).toBe(1);
    });
  });

  describe('Service Integration', () => {
    it('should initialize all services correctly', () => {
      expect(alertManager['slackService']).toBeDefined();
      expect(alertManager['pagerDutyService']).toBeDefined();
      expect(alertManager['emailService']).toBeDefined();
      expect(alertManager['teamsService']).toBeDefined();
      expect(alertManager['smsService']).toBeDefined();
      expect(alertManager['webhookService']).toBeDefined();
    });

    it('should register handlers for all severity levels', () => {
      Object.values(AlertSeverity).forEach(severity => {
        expect(alertManager['alertHandlers'].has(severity as AlertSeverity)).toBe(true);
      });
    });
  });
});
