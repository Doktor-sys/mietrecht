import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric for error rate
const errorRate = new Rate('errors');

// Test options
export const options = {
  stages: [
    // Ramp up to 50 users over 1 minute
    { duration: '1m', target: 50 },
    // Stay at 50 users for 2 minutes
    { duration: '2m', target: 50 },
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

// Sample document and case IDs - these should exist in your test database
const TEST_DOCUMENT_ID = 'test-document-id';
const TEST_CASE_ID = 'test-case-id';

// Authentication token - in a real test, you would authenticate and get a real token
const AUTH_TOKEN = 'test-auth-token';

export default function () {
  // Set headers with authentication
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Document risk assessment
  const docPayload = JSON.stringify({});
  const docRes = http.post(`${BASE_URL}/risk-assessment/document/${TEST_DOCUMENT_ID}`, docPayload, { headers });
  
  check(docRes, {
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
  
  sleep(1);

  // Test 2: Case risk assessment
  const casePayload = JSON.stringify({
    clientData: { id: 'client123' },
    historicalData: { cases: [] }
  });
  const caseRes = http.post(`${BASE_URL}/risk-assessment/case/${TEST_CASE_ID}`, casePayload, { headers });
  
  check(caseRes, {
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
  
  sleep(1);

  // Test 3: Enhanced document risk assessment
  const enhancedDocRes = http.post(`${BASE_URL}/risk-assessment/document/${TEST_DOCUMENT_ID}/enhanced`, {}, { headers });
  
  check(enhancedDocRes, {
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
  
  sleep(1);

  // Test 4: Enhanced case risk assessment
  const enhancedCasePayload = JSON.stringify({
    clientData: { id: 'client123' },
    historicalData: { cases: [] }
  });
  const enhancedCaseRes = http.post(`${BASE_URL}/risk-assessment/case/${TEST_CASE_ID}/enhanced`, enhancedCasePayload, { headers });
  
  check(enhancedCaseRes, {
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
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data),
    'load-test-results.json': JSON.stringify(data),
  };
}