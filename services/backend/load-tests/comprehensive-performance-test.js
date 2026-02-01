import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const documentAnalysisTrend = new Trend('document_analysis_duration');
const riskAssessmentTrend = new Trend('risk_assessment_duration');
const strategyRecommendationTrend = new Trend('strategy_recommendation_duration');
const nlpProcessingTrend = new Trend('nlp_processing_duration');

// Test options with different load scenarios
export const options = {
  scenarios: {
    // Low load test
    low_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 }, // Ramp up to 10 users
        { duration: '2m', target: 10 }, // Stay at 10 users
        { duration: '30s', target: 0 }, // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
      exec: 'lowLoadTest',
    },
    
    // Medium load test
    medium_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 }, // Ramp up to 50 users
        { duration: '3m', target: 50 }, // Stay at 50 users
        { duration: '1m', target: 0 },  // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
      exec: 'mediumLoadTest',
      startTime: '5m', // Start after low load test
    },
    
    // High load test
    high_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 }, // Ramp up to 100 users
        { duration: '5m', target: 100 }, // Stay at 100 users
        { duration: '1m', target: 0 },   // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
      exec: 'highLoadTest',
      startTime: '12m', // Start after medium load test
    },
    
    // Stress test
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 }, // Ramp up to 200 users quickly
        { duration: '2m', target: 200 },  // Stay at 200 users
        { duration: '30s', target: 0 },   // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
      exec: 'stressTest',
      startTime: '20m', // Start after high load test
    }
  },
  
  thresholds: {
    // 95% of requests should complete within 5 seconds
    http_req_duration: ['p(95)<5000'],
    // Error rate should be less than 1%
    errors: ['rate<0.01'],
    // Specific thresholds for different scenarios
    http_req_duration{scenario:low_load}: ['p(95)<3000'],
    http_req_duration{scenario:medium_load}: ['p(95)<4000'],
    http_req_duration{scenario:high_load}: ['p(95)<5000'],
    http_req_duration{scenario:stress_test}: ['p(95)<8000'],
  },
};

// Base URL - adjust according to your environment
const BASE_URL = 'http://localhost:3000/api';

// Sample IDs - these should exist in your test database
const TEST_DOCUMENT_ID = 'test-document-id';
const TEST_CASE_ID = 'test-case-id';

// Authentication token - in a real test, you would authenticate and get a real token
const AUTH_TOKEN = 'test-auth-token';

// Headers with authentication
const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

// Test data
const riskAssessmentPayload = JSON.stringify({
  clientData: { id: 'client123' },
  historicalData: { cases: [] }
});

const strategyRecommendationPayload = JSON.stringify({
  caseData: { id: TEST_CASE_ID },
  clientProfile: { id: 'client123', preferences: {} },
  lawyerProfile: { id: 'lawyer456', expertise: {} },
  riskAssessment: { score: 0.75, factors: [] },
  historicalData: { cases: [] }
});

// Low load test function
export function lowLoadTest() {
  group('Low Load Test', function() {
    // Document operations
    group('Document Operations', function() {
      testDocumentRiskAssessment();
      testDocumentAnalysis();
      sleep(1);
    });
    
    // Case operations
    group('Case Operations', function() {
      testCaseRiskAssessment();
      testStrategyRecommendations();
      sleep(1);
    });
  });
}

// Medium load test function
export function mediumLoadTest() {
  group('Medium Load Test', function() {
    // Document operations
    group('Document Operations', function() {
      testDocumentRiskAssessment();
      testEnhancedDocumentRiskAssessment();
      testDocumentAnalysis();
      sleep(0.5);
    });
    
    // Case operations
    group('Case Operations', function() {
      testCaseRiskAssessment();
      testEnhancedCaseRiskAssessment();
      testStrategyRecommendations();
      testPersonalizedStrategyRecommendations();
      sleep(0.5);
    });
    
    // NLP operations
    group('NLP Operations', function() {
      testNLPDocumentAnalysis();
      sleep(0.5);
    });
  });
}

// High load test function
export function highLoadTest() {
  group('High Load Test', function() {
    // Document operations
    group('Document Operations', function() {
      testDocumentRiskAssessment();
      testEnhancedDocumentRiskAssessment();
      testDocumentAnalysis();
      sleep(0.2);
    });
    
    // Case operations
    group('Case Operations', function() {
      testCaseRiskAssessment();
      testEnhancedCaseRiskAssessment();
      testStrategyRecommendations();
      testPersonalizedStrategyRecommendations();
      sleep(0.2);
    });
    
    // NLP operations
    group('NLP Operations', function() {
      testNLPDocumentAnalysis();
      sleep(0.2);
    });
  });
}

// Stress test function
export function stressTest() {
  group('Stress Test', function() {
    // All operations at high frequency
    testDocumentRiskAssessment();
    testCaseRiskAssessment();
    testStrategyRecommendations();
    testNLPDocumentAnalysis();
    sleep(0.1);
  });
}

// Individual test functions
function testDocumentRiskAssessment() {
  const start = new Date().getTime();
  const res = http.post(`${BASE_URL}/risk-assessment/document/${TEST_DOCUMENT_ID}`, {}, { headers });
  const end = new Date().getTime();
  
  documentAnalysisTrend.add(end - start);
  
  check(res, {
    'document risk assessment status is 200': (r) => r.status === 200,
    'document risk assessment response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testEnhancedDocumentRiskAssessment() {
  const start = new Date().getTime();
  const res = http.post(`${BASE_URL}/risk-assessment/document/${TEST_DOCUMENT_ID}/enhanced`, {}, { headers });
  const end = new Date().getTime();
  
  documentAnalysisTrend.add(end - start);
  
  check(res, {
    'enhanced document risk assessment status is 200': (r) => r.status === 200,
    'enhanced document risk assessment response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testCaseRiskAssessment() {
  const start = new Date().getTime();
  const res = http.post(`${BASE_URL}/risk-assessment/case/${TEST_CASE_ID}`, riskAssessmentPayload, { headers });
  const end = new Date().getTime();
  
  riskAssessmentTrend.add(end - start);
  
  check(res, {
    'case risk assessment status is 200': (r) => r.status === 200,
    'case risk assessment response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testEnhancedCaseRiskAssessment() {
  const start = new Date().getTime();
  const res = http.post(`${BASE_URL}/risk-assessment/case/${TEST_CASE_ID}/enhanced`, riskAssessmentPayload, { headers });
  const end = new Date().getTime();
  
  riskAssessmentTrend.add(end - start);
  
  check(res, {
    'enhanced case risk assessment status is 200': (r) => r.status === 200,
    'enhanced case risk assessment response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testStrategyRecommendations() {
  const start = new Date().getTime();
  const res = http.post(`${BASE_URL}/strategy-recommendations/basic`, strategyRecommendationPayload, { headers });
  const end = new Date().getTime();
  
  strategyRecommendationTrend.add(end - start);
  
  check(res, {
    'strategy recommendations status is 200': (r) => r.status === 200,
    'strategy recommendations response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testPersonalizedStrategyRecommendations() {
  const start = new Date().getTime();
  const res = http.post(`${BASE_URL}/strategy-recommendations/personalized`, strategyRecommendationPayload, { headers });
  const end = new Date().getTime();
  
  strategyRecommendationTrend.add(end - start);
  
  check(res, {
    'personalized strategy recommendations status is 200': (r) => r.status === 200,
    'personalized strategy recommendations response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testDocumentAnalysis() {
  const start = new Date().getTime();
  const res = http.get(`${BASE_URL}/documents/${TEST_DOCUMENT_ID}`, { headers });
  const end = new Date().getTime();
  
  documentAnalysisTrend.add(end - start);
  
  check(res, {
    'document analysis status is 200': (r) => r.status === 200,
    'document analysis response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testNLPDocumentAnalysis() {
  const start = new Date().getTime();
  const res = http.get(`${BASE_URL}/nlp/documents/${TEST_DOCUMENT_ID}/summary`, { headers });
  const end = new Date().getTime();
  
  nlpProcessingTrend.add(end - start);
  
  check(res, {
    'NLP document analysis status is 200': (r) => r.status === 200,
    'NLP document analysis response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data),
    'comprehensive-performance-test-results.json': JSON.stringify(data),
  };
}