import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric for error rate
const errorRate = new Rate('errors');

// Test options
export const options = {
  stages: [
    // Ramp up to 30 users over 1 minute
    { duration: '1m', target: 30 },
    // Stay at 30 users for 2 minutes
    { duration: '2m', target: 30 },
    // Ramp down to 0 users over 30 seconds
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% of requests should complete within 5 seconds
    http_req_duration: ['p(95)<5000'],
    // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

// Base URL - adjust according to your environment
const BASE_URL = 'http://localhost:3000/api';

// Sample case ID - this should exist in your test database
const TEST_CASE_ID = 'test-case-id';

// Authentication token - in a real test, you would authenticate and get a real token
const AUTH_TOKEN = 'test-auth-token';

export default function () {
  // Set headers with authentication
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Basic strategy recommendations
  const basicPayload = JSON.stringify({
    caseData: { id: TEST_CASE_ID },
    clientProfile: { id: 'client123' },
    lawyerProfile: { id: 'lawyer456' }
  });
  const basicRes = http.post(`${BASE_URL}/strategy-recommendations/basic`, basicPayload, { headers });
  
  check(basicRes, {
    'basic strategy recommendations status is 200': (r) => r.status === 200,
    'basic strategy recommendations response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 2: Enhanced strategy recommendations
  const enhancedPayload = JSON.stringify({
    caseData: { id: TEST_CASE_ID },
    clientProfile: { id: 'client123' },
    lawyerProfile: { id: 'lawyer456' },
    riskAssessment: { score: 0.75 },
    historicalData: { cases: [] }
  });
  const enhancedRes = http.post(`${BASE_URL}/strategy-recommendations/enhanced`, enhancedPayload, { headers });
  
  check(enhancedRes, {
    'enhanced strategy recommendations status is 200': (r) => r.status === 200,
    'enhanced strategy recommendations response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 3: Personalized strategy recommendations
  const personalizedPayload = JSON.stringify({
    caseData: { id: TEST_CASE_ID },
    clientProfile: { id: 'client123', preferences: {} },
    lawyerProfile: { id: 'lawyer456', expertise: {} },
    riskAssessment: { score: 0.75, factors: [] },
    historicalData: { cases: [] }
  });
  const personalizedRes = http.post(`${BASE_URL}/strategy-recommendations/personalized`, personalizedPayload, { headers });
  
  check(personalizedRes, {
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
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data),
    'strategy-recommendations-load-test-results.json': JSON.stringify(data),
  };
}