/**
 * Integration tests for the Mietrecht Agent system
 */

const { 
  getAllCourtDecisions, 
  createCourtDecision 
} = require('../../database/dao/courtDecisionDao.js');

const { 
  getAllLawyers 
} = require('../../database/dao/lawyerDao.js');

const { 
  analyzeDecisionTrends 
} = require('../../analytics/decisionAnalyzer.js');

const { 
  NotificationManager 
} = require('../../notifications/notificationManager.js');

const { initializeDatabase, closeDatabase } = require('../../database/connection.js');

// Mock data for integration tests
const mockDecision = {
  decision_id: 'INTEGRATION-TEST-001',
  court: 'Bundesgerichtshof',
  location: 'Karlsruhe',
  decision_date: '2025-12-01',
  case_number: 'VIII ZR 456/25',
  topics: ['Mietrecht', 'Kündigung'],
  summary: 'Integration test decision summary',
  full_text: 'Full text of the integration test decision',
  url: 'https://example.com/decision/INTEGRATION-TEST-001',
  judges: ['Integration Test Judge'],
  practice_implications: 'Integration test implications',
  importance: 'high',
  source: 'bgh',
  processed: false
};

const mockLawyer = {
  name: 'Integration Test Lawyer',
  email: 'integration-test@example.com',
  law_firm: 'Test Law Firm',
  practice_areas: ['Mietrecht'],
  regions: ['Berlin']
};

describe('Integration Tests', () => {
  beforeAll(async () => {
    // Initialize the database for integration tests
    await initializeDatabase();
  });

  afterAll(async () => {
    // Close the database connection
    await closeDatabase();
  });

  describe('Data Flow Integration', () => {
    test('should save decision and retrieve it', async () => {
      // Save a decision
      const decisionId = await createCourtDecision(mockDecision);
      expect(decisionId).toBeGreaterThan(0);
      
      // Retrieve all decisions and check if our decision is there
      const decisions = await getAllCourtDecisions();
      const savedDecision = decisions.find(d => d.decision_id === mockDecision.decision_id);
      
      expect(savedDecision).toBeDefined();
      expect(savedDecision.case_number).toBe(mockDecision.case_number);
    });

    test('should analyze saved decisions', async () => {
      // Run analysis on the saved decisions
      const trends = await analyzeDecisionTrends();
      
      expect(trends).toHaveProperty('monthlyTrends');
      expect(trends).toHaveProperty('topTopics');
      expect(trends.topTopics.length).toBeGreaterThan(0);
    });
  });

  describe('Notification Integration', () => {
    test('should send notification about new decision', async () => {
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
      
      const notificationManager = new NotificationManager(config);
      
      // Send notification about the mock decision
      const results = await notificationManager.sendNotification(
        ['stub'],
        'test@example.com',
        'New Decision Alert',
        '<p>A new decision has been saved to the database.</p>'
      );
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should complete full workflow', async () => {
      // Step 1: Save a new decision
      const decisionId = await createCourtDecision({
        ...mockDecision,
        decision_id: 'E2E-TEST-001',
        case_number: 'VIII ZR 789/25'
      });
      
      expect(decisionId).toBeGreaterThan(0);
      
      // Step 2: Verify the decision was saved
      const decisions = await getAllCourtDecisions();
      const savedDecision = decisions.find(d => d.decision_id === 'E2E-TEST-001');
      expect(savedDecision).toBeDefined();
      
      // Step 3: Run analysis on the data
      const trends = await analyzeDecisionTrends();
      expect(trends.topTopics.length).toBeGreaterThan(0);
      
      // Step 4: Send notification
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
      
      const notificationManager = new NotificationManager(config);
      const notificationResults = await notificationManager.sendNotification(
        ['stub'],
        'test@example.com',
        'End-to-End Test Complete',
        '<p>The full workflow test has completed successfully.</p>'
      );
      
      expect(notificationResults).toHaveLength(1);
      expect(notificationResults[0].success).toBe(true);
    });
  });
});