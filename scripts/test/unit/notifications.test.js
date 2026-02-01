/**
 * Unit tests for notification modules
 */

const { 
  EmailNotificationChannel, 
  StubNotificationChannel,
  createNotificationChannel
} = require('../../notifications/notificationService.js');

const { 
  newCourtDecisionTemplate, 
  systemAlertTemplate, 
  performanceAlertTemplate 
} = require('../../notifications/templates.js');

const { 
  AlertRule, 
  AlertRulesManager,
  highErrorRateRule,
  lowCacheHitRateRule
} = require('../../notifications/alertRules.js');

const { NotificationManager } = require('../../notifications/notificationManager.js');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

describe('Notification Module Tests', () => {
  describe('Notification Channels', () => {
    test('should create email notification channel', () => {
      const config = {
        service: 'gmail',
        user: 'test@example.com',
        pass: 'test-password'
      };
      
      const channel = new EmailNotificationChannel(config);
      expect(channel).toBeInstanceOf(EmailNotificationChannel);
    });

    test('should create stub notification channel', () => {
      const config = {};
      const channel = new StubNotificationChannel(config);
      expect(channel).toBeInstanceOf(StubNotificationChannel);
    });

    test('should create notification channel using factory', () => {
      const emailChannel = createNotificationChannel('email', {});
      const stubChannel = createNotificationChannel('stub', {});
      
      expect(emailChannel).toBeInstanceOf(EmailNotificationChannel);
      expect(stubChannel).toBeInstanceOf(StubNotificationChannel);
    });

    test('should send email notification', async () => {
      const config = {
        service: 'gmail',
        user: 'test@example.com',
        pass: 'test-password'
      };
      
      const channel = new EmailNotificationChannel(config);
      const result = await channel.send('recipient@example.com', 'Test Subject', '<p>Test Body</p>');
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');
    });

    test('should send stub notification', async () => {
      const config = {};
      const channel = new StubNotificationChannel(config);
      const result = await channel.send('recipient@example.com', 'Test Subject', '<p>Test Body</p>');
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');
    });
  });

  describe('Notification Templates', () => {
    test('should generate new court decision template', () => {
      const decision = {
        caseNumber: 'VIII ZR 123/24',
        court: 'Bundesgerichtshof',
        date: '2025-12-01',
        topics: ['Mietrecht', 'Kündigung'],
        summary: 'Test decision summary',
        practiceImplications: 'Test implications',
        url: 'https://example.com/decision'
      };
      
      const lawyer = {
        name: 'Max Mustermann'
      };
      
      const template = newCourtDecisionTemplate(decision, lawyer);
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('body');
      expect(template.subject).toContain(decision.caseNumber);
    });

    test('should generate system alert template', () => {
      const template = systemAlertTemplate('Test Alert', 'This is a test message', 'warning');
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('body');
      expect(template.subject).toContain('WARNUNG');
    });

    test('should generate performance alert template', () => {
      const template = performanceAlertTemplate('response_time', 2500, 2000);
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('body');
      expect(template.subject).toContain('WARNUNG');
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

    test('should use predefined alert rules', () => {
      const context1 = { errorRate: 0.1 }; // 10% error rate
      const context2 = { errorRate: 0.01 }; // 1% error rate
      const context3 = { cacheHitRate: 0.3 }; // 30% cache hit rate
      const context4 = { cacheHitRate: 0.7 }; // 70% cache hit rate
      
      expect(highErrorRateRule.evaluate(context1)).toBe(true);
      expect(highErrorRateRule.evaluate(context2)).toBe(false);
      expect(lowCacheHitRateRule.evaluate(context3)).toBe(true);
      expect(lowCacheHitRateRule.evaluate(context4)).toBe(false);
    });
  });

  describe('Notification Manager', () => {
    test('should create notification manager', () => {
      const config = {
        email: {
          enabled: true,
          service: 'gmail',
          user: 'test@example.com',
          pass: 'test-password'
        },
        sms: { enabled: false },
        push: { enabled: false },
        adminRecipients: ['admin@example.com']
      };
      
      const manager = new NotificationManager(config);
      expect(manager).toBeInstanceOf(NotificationManager);
      expect(manager.channels).toHaveProperty('email');
      expect(manager.channels).toHaveProperty('stub');
    });

    test('should send notification through channels', async () => {
      const config = {
        email: {
          enabled: true,
          service: 'gmail',
          user: 'test@example.com',
          pass: 'test-password'
        },
        sms: { enabled: false },
        push: { enabled: false },
        adminRecipients: ['admin@example.com']
      };
      
      const manager = new NotificationManager(config);
      const results = await manager.sendNotification(
        ['stub'],
        'test@example.com',
        'Test Subject',
        '<p>Test Body</p>'
      );
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });
});