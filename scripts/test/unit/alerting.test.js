/**
 * Unit tests for alerting modules
 */

const { PerformanceAlerting } = require('../../performance/alerting.js');
const { AlertRule, AlertRulesManager } = require('../../notifications/alertRules.js');

describe('Alerting Module Tests', () => {
  describe('Performance Alerting', () => {
    test('should create performance alerting instance', () => {
      const alerting = new PerformanceAlerting();
      expect(alerting).toBeInstanceOf(PerformanceAlerting);
    });

    test('should detect cache performance issues', async () => {
      const alerting = new PerformanceAlerting({
        cacheHitRateThreshold: 0.8
      });
      
      const metrics = {
        cache: {
          hitRate: 0.7 // Below threshold
        }
      };
      
      const alerts = await alerting.checkAndAlert(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('cache_performance');
      expect(alerts[0].severity).toBe('warning');
    });

    test('should detect database performance issues', async () => {
      const alerting = new PerformanceAlerting({
        databaseQueryTimeThreshold: 100
      });
      
      const metrics = {
        database: {
          avgQueryTime: 150 // Above threshold
        }
      };
      
      const alerts = await alerting.checkAndAlert(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('database_performance');
      expect(alerts[0].severity).toBe('warning');
    });

    test('should detect API performance issues', async () => {
      const alerting = new PerformanceAlerting({
        apiResponseTimeThreshold: 2000
      });
      
      const metrics = {
        api: {
          avgResponseTime: 2500 // Above threshold
        }
      };
      
      const alerts = await alerting.checkAndAlert(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('api_performance');
      expect(alerts[0].severity).toBe('error');
    });

    test('should detect high error rates', async () => {
      const alerting = new PerformanceAlerting({
        errorRateThreshold: 0.05
      });
      
      const metrics = {
        api: {
          errorRate: 0.1 // Above threshold (10%)
        }
      };
      
      const alerts = await alerting.checkAndAlert(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('api_errors');
      expect(alerts[0].severity).toBe('error');
    });

    test('should detect high memory usage', async () => {
      // Mock process.memoryUsage to return high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 800 * 1024 * 1024, // 800 MB
        heapTotal: 1000 * 1024 * 1024 // 1000 MB
      });
      
      const alerting = new PerformanceAlerting({
        memoryUsageThreshold: 0.7 // 70%
      });
      
      const metrics = {};
      
      const alerts = await alerting.checkAndAlert(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('memory_usage');
      expect(alerts[0].severity).toBe('warning');
      
      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    test('should respect alert cooldown', async () => {
      const alerting = new PerformanceAlerting({
        cacheHitRateThreshold: 0.8,
        alertCooldown: 1000 // 1 second
      });
      
      const metrics = {
        cache: {
          hitRate: 0.7 // Below threshold
        }
      };
      
      // First alert should trigger
      const alerts1 = await alerting.checkAndAlert(metrics);
      expect(alerts1).toHaveLength(1);
      
      // Second alert should be suppressed due to cooldown
      const alerts2 = await alerting.checkAndAlert(metrics);
      expect(alerts2).toHaveLength(0);
    });
  });

  describe('Alert Rules', () => {
    test('should create alert rule', () => {
      const condition = (context) => context.testValue > 5;
      const rule = new AlertRule('Test Rule', condition, 'warning', ['email']);
      
      expect(rule.name).toBe('Test Rule');
      expect(rule.severity).toBe('warning');
      expect(rule.channels).toEqual(['email']);
    });

    test('should evaluate alert rule condition', () => {
      const condition = (context) => context.testValue > 5;
      const rule = new AlertRule('Test Rule', condition, 'warning', ['email']);
      
      const context1 = { testValue: 10 };
      const context2 = { testValue: 3 };
      
      expect(rule.evaluate(context1)).toBe(true);
      expect(rule.evaluate(context2)).toBe(false);
    });

    test('should manage alert rules', () => {
      const manager = new AlertRulesManager();
      const condition = (context) => context.testValue > 5;
      const rule = new AlertRule('Test Rule', condition, 'warning', ['email']);
      
      manager.addRule(rule);
      const rules = manager.getRules();
      
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBe(rule);
    });

    test('should respect alert rule throttling', () => {
      const condition = (context) => context.testValue > 5;
      const rule = new AlertRule('Test Rule', condition, 'warning', ['email'], 1); // 1 minute throttle
      
      // First evaluation should pass
      expect(rule.canTrigger()).toBe(true);
      
      // Mark as triggered
      rule.markTriggered();
      
      // Second evaluation should be blocked by throttling
      expect(rule.canTrigger()).toBe(false);
    });
  });
});