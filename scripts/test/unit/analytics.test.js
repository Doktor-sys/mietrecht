/**
 * Unit tests for analytics modules
 */

const { 
  analyzeDecisionTrends, 
  analyzeLawyerSpecializations, 
  analyzeDecisionImpact 
} = require('../../analytics/decisionAnalyzer.js');

const { 
  extractTopicCooccurrence, 
  identifyTrendingTopics, 
  analyzeTopicSentiment 
} = require('../../analytics/topicAnalyzer.js');

const { 
  analyzeSystemPerformance, 
  analyzeSystemLogs 
} = require('../../analytics/performanceAnalyzer.js');

// Mock data for testing
const mockDecisions = [
  {
    id: 1,
    decision_id: 'TEST-001',
    court: 'Bundesgerichtshof',
    decision_date: '2025-01-15',
    topics: ['Mietrecht', 'Kündigung'],
    importance: 'high'
  },
  {
    id: 2,
    decision_id: 'TEST-002',
    court: 'Landgericht',
    decision_date: '2025-02-20',
    topics: ['Mietrecht', 'Modernisierung'],
    importance: 'medium'
  }
];

const mockLawyers = [
  {
    id: 1,
    name: 'Max Mustermann',
    practice_areas: ['Mietrecht', 'Wohnungsrecht']
  },
  {
    id: 2,
    name: 'Erika Musterfrau',
    practice_areas: ['Mietrecht', 'Arbeitsrecht']
  }
];

// Mock DAO functions
jest.mock('../../database/dao/courtDecisionDao.js', () => ({
  getAllCourtDecisions: jest.fn().mockResolvedValue(mockDecisions)
}));

jest.mock('../../database/dao/lawyerDao.js', () => ({
  getAllLawyers: jest.fn().mockResolvedValue(mockLawyers)
}));

jest.mock('../../database/dao/dashboardMetricsDao.js', () => ({
  recordMetric: jest.fn().mockResolvedValue()
}));

jest.mock('../../database/dao/systemLogDao.js', () => ({
  getLogEntries: jest.fn().mockResolvedValue([]),
  getLogStatistics: jest.fn().mockResolvedValue({})
}));

describe('Analytics Module Tests', () => {
  describe('Decision Analyzer', () => {
    test('should analyze decision trends', async () => {
      const trends = await analyzeDecisionTrends();
      expect(trends).toHaveProperty('monthlyTrends');
      expect(trends).toHaveProperty('topTopics');
      expect(trends).toHaveProperty('courtDistribution');
    });

    test('should analyze lawyer specializations', async () => {
      const specializations = await analyzeLawyerSpecializations();
      expect(specializations).toHaveProperty('practiceAreaDistribution');
      expect(specializations).toHaveProperty('totalLawyers');
    });

    test('should analyze decision impact', async () => {
      const impact = await analyzeDecisionImpact();
      expect(impact).toHaveProperty('importanceDistribution');
      expect(impact).toHaveProperty('averageTopicsPerDecision');
      expect(impact).toHaveProperty('totalDecisions');
    });
  });

  describe('Topic Analyzer', () => {
    test('should extract topic co-occurrence', () => {
      const decisionsWithMultipleTopics = [
        {
          topics: ['Mietrecht', 'Kündigung', 'Modernisierung']
        }
      ];
      
      const cooccurrence = extractTopicCooccurrence(decisionsWithMultipleTopics);
      expect(Object.keys(cooccurrence)).toHaveLength(3); // 3 pairs: Mietrecht-Kündigung, Mietrecht-Modernisierung, Kündigung-Modernisierung
    });

    test('should identify trending topics', () => {
      const decisions = [
        {
          decision_date: '2025-06-01',
          topics: ['Mietrecht', 'Kündigung']
        },
        {
          decision_date: '2025-06-15',
          topics: ['Mietrecht', 'Modernisierung']
        }
      ];
      
      const trends = identifyTrendingTopics(decisions, 3);
      expect(trends).toHaveProperty('trendingTopics');
    });

    test('should analyze topic sentiment', () => {
      const decisions = [
        {
          topics: ['Mietrecht'],
          summary: 'Die Klage wurde erfolgreich angenommen.'
        },
        {
          topics: ['Kündigung'],
          summary: 'Die Klage wurde abgewiesen.'
        }
      ];
      
      const sentiment = analyzeTopicSentiment(decisions);
      expect(sentiment).toHaveProperty('topicSentiment');
    });
  });

  describe('Performance Analyzer', () => {
    test('should analyze system performance', async () => {
      const performance = await analyzeSystemPerformance();
      expect(performance).toHaveProperty('avgResponseTime');
      expect(performance).toHaveProperty('avgCacheHitRate');
      expect(performance).toHaveProperty('maxActiveRequests');
    });

    test('should analyze system logs', async () => {
      const logs = await analyzeSystemLogs();
      expect(logs).toHaveProperty('errorLogs');
      expect(logs).toHaveProperty('warningLogs');
      expect(logs).toHaveProperty('logStatistics');
    });
  });
});