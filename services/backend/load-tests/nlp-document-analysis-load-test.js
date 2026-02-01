import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric for error rate
const errorRate = new Rate('errors');

// Test options
export const options = {
  stages: [
    // Ramp up to 20 users over 1 minute
    { duration: '1m', target: 20 },
    // Stay at 20 users for 2 minutes
    { duration: '2m', target: 20 },
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

// Sample document ID - this should exist in your test database
const TEST_DOCUMENT_ID = 'test-document-id';

// Authentication token - in a real test, you would authenticate and get a real token
const AUTH_TOKEN = 'test-auth-token';

export default function () {
  // Set headers with authentication
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Document summarization
  const summaryRes = http.get(`${BASE_URL}/nlp/documents/${TEST_DOCUMENT_ID}/summary`, { headers });
  
  check(summaryRes, {
    'document summarization status is 200': (r) => r.status === 200,
    'document summarization response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 2: Entity extraction
  const entityRes = http.get(`${BASE_URL}/nlp/documents/${TEST_DOCUMENT_ID}/entities`, { headers });
  
  check(entityRes, {
    'entity extraction status is 200': (r) => r.status === 200,
    'entity extraction response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 3: Sentiment analysis
  const sentimentRes = http.get(`${BASE_URL}/nlp/documents/${TEST_DOCUMENT_ID}/sentiment`, { headers });
  
  check(sentimentRes, {
    'sentiment analysis status is 200': (r) => r.status === 200,
    'sentiment analysis response has success true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 4: Key phrase extraction
  const phraseRes = http.get(`${BASE_URL}/nlp/documents/${TEST_DOCUMENT_ID}/key-phrases`, { headers });
  
  check(phraseRes, {
    'key phrase extraction status is 200': (r) => r.status === 200,
    'key phrase extraction response has success true': (r) => {
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
    'nlp-document-analysis-load-test-results.json': JSON.stringify(data),
  };
}