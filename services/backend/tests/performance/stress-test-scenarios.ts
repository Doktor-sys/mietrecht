/**
 * Stress Test Scenarios
 * 
 * This file defines various stress test scenarios that can be used
 * with load testing tools like Artillery or k6.
 */

export const stressTestScenarios = {
    /**
     * High concurrent user scenario
     * Simulates 1000 concurrent users with varying request patterns
     */
    highConcurrency: {
        name: 'High Concurrency Test',
        description: 'Simulates 1000 concurrent users performing typical workflows',
        duration: '10m',
        arrivalRate: 100,
        rampTo: 200,
        rampDuration: '2m',
        scenarios: [
            {
                name: 'User Authentication Flow',
                weight: 20,
                steps: [
                    { method: 'POST', path: '/api/auth/register', data: { email: 'stress-{uuid}@example.com', password: 'SecurePass123!', userType: 'tenant', acceptedTerms: true } },
                    { method: 'POST', path: '/api/auth/login', data: { email: 'stress-{uuid}@example.com', password: 'SecurePass123!' } },
                    { method: 'GET', path: '/api/user/profile', headers: { Authorization: 'Bearer {token}' } }
                ]
            },
            {
                name: 'Document Processing Flow',
                weight: 30,
                steps: [
                    { method: 'POST', path: '/api/documents/upload', headers: { Authorization: 'Bearer {token}' }, formData: { file: 'test-document.pdf', documentType: 'rental_contract' } },
                    { method: 'POST', path: '/api/documents/{documentId}/analyze', headers: { Authorization: 'Bearer {token}' } },
                    { method: 'GET', path: '/api/documents', headers: { Authorization: 'Bearer {token}' } }
                ]
            },
            {
                name: 'Chat Interaction Flow',
                weight: 25,
                steps: [
                    { method: 'POST', path: '/api/chat/conversations', headers: { Authorization: 'Bearer {token}' }, data: { initialQuery: 'Stress test query' } },
                    { method: 'POST', path: '/api/chat/conversations/{conversationId}/messages', headers: { Authorization: 'Bearer {token}' }, data: { message: 'How much can I reduce rent?' } },
                    { method: 'GET', path: '/api/chat/conversations', headers: { Authorization: 'Bearer {token}' } }
                ]
            },
            {
                name: 'Lawyer Search Flow',
                weight: 15,
                steps: [
                    { method: 'GET', path: '/api/lawyers/search', headers: { Authorization: 'Bearer {token}' }, query: { location: 'Berlin', specialization: 'Mietrecht' } },
                    { method: 'GET', path: '/api/lawyers/search', headers: { Authorization: 'Bearer {token}' }, query: { location: 'Hamburg', specialization: 'Mietrecht' } }
                ]
            },
            {
                name: 'Health Check',
                weight: 10,
                steps: [
                    { method: 'GET', path: '/api/health' }
                ]
            }
        ]
    },

    /**
     * Spike traffic scenario
     * Simulates sudden traffic spikes
     */
    trafficSpike: {
        name: 'Traffic Spike Test',
        description: 'Simulates sudden traffic spikes to test system resilience',
        duration: '5m',
        arrivalRate: 10,
        spike: {
            rate: 500,
            duration: '30s',
            repeat: 3
        },
        scenarios: [
            {
                name: 'API Endpoints Under Spike',
                steps: [
                    { method: 'GET', path: '/api/user/profile', headers: { Authorization: 'Bearer {token}' } },
                    { method: 'GET', path: '/api/documents', headers: { Authorization: 'Bearer {token}' } },
                    { method: 'GET', path: '/api/chat/conversations', headers: { Authorization: 'Bearer {token}' } }
                ]
            }
        ]
    },

    /**
     * Long duration test
     * Simulates sustained load over extended periods
     */
    sustainedLoad: {
        name: 'Sustained Load Test',
        description: 'Simulates sustained load over extended periods to identify memory leaks',
        duration: '60m',
        arrivalRate: 50,
        scenarios: [
            {
                name: 'Complete User Journey',
                steps: [
                    // Authentication
                    { method: 'POST', path: '/api/auth/register', data: { email: 'sustained-{uuid}@example.com', password: 'SecurePass123!', userType: 'tenant', acceptedTerms: true } },
                    { method: 'POST', path: '/api/auth/login', data: { email: 'sustained-{uuid}@example.com', password: 'SecurePass123!' } },
                    
                    // Document workflow
                    { method: 'POST', path: '/api/documents/upload', headers: { Authorization: 'Bearer {token}' }, formData: { file: 'sustained-test.pdf', documentType: 'rental_contract' } },
                    { method: 'POST', path: '/api/documents/{documentId}/analyze', headers: { Authorization: 'Bearer {token}' } },
                    
                    // Chat workflow
                    { method: 'POST', path: '/api/chat/conversations', headers: { Authorization: 'Bearer {token}' }, data: { initialQuery: 'Sustained load test query' } },
                    { method: 'POST', path: '/api/chat/conversations/{conversationId}/messages', headers: { Authorization: 'Bearer {token}' }, data: { message: 'Test message' } },
                    
                    // Cleanup
                    { method: 'DELETE', path: '/api/documents/{documentId}', headers: { Authorization: 'Bearer {token}' } }
                ]
            }
        ]
    },

    /**
     * Database intensive operations
     * Tests database performance under heavy load
     */
    databaseIntensive: {
        name: 'Database Intensive Test',
        description: 'Tests database performance with complex queries and large datasets',
        duration: '15m',
        arrivalRate: 30,
        scenarios: [
            {
                name: 'Complex Analytics Queries',
                steps: [
                    { method: 'GET', path: '/api/analytics/documents-by-type', headers: { Authorization: 'Bearer {token}' } },
                    { method: 'GET', path: '/api/analytics/user-activity', headers: { Authorization: 'Bearer {token}' } },
                    { method: 'GET', path: '/api/analytics/document-processing-times', headers: { Authorization: 'Bearer {token}' } }
                ]
            },
            {
                name: 'Bulk Operations',
                steps: [
                    { method: 'POST', path: '/api/documents/bulk-upload', headers: { Authorization: 'Bearer {token}' }, data: { documents: [] } },
                    { method: 'GET', path: '/api/documents?limit=100', headers: { Authorization: 'Bearer {token}' } }
                ]
            }
        ]
    }
};

/**
 * Performance thresholds for monitoring
 */
export const performanceThresholds = {
    apiResponseTime: {
        p95: 500,  // 95th percentile response time should be under 500ms
        p99: 1000, // 99th percentile response time should be under 1000ms
        max: 5000  // Maximum response time should be under 5000ms
    },
    databaseQueryTime: {
        p95: 300,  // 95th percentile query time should be under 300ms
        p99: 600,  // 99th percentile query time should be under 600ms
        max: 2000  // Maximum query time should be under 2000ms
    },
    errorRate: 0.01, // Error rate should be under 1%
    throughput: 100  // System should handle at least 100 requests per second
};

/**
 * Monitoring configuration
 */
export const monitoringConfig = {
    metrics: [
        'http.response_time',
        'http.requests',
        'http.errors',
        'database.query_time',
        'cache.hit_rate',
        'memory.usage',
        'cpu.usage'
    ],
    alerts: [
        {
            metric: 'http.response_time.p95',
            threshold: 500,
            operator: '>',
            action: 'notify_slack'
        },
        {
            metric: 'http.errors.rate',
            threshold: 0.01,
            operator: '>',
            action: 'notify_pagerduty'
        }
    ]
};
