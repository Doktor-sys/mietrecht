import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Configuration
export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users
        { duration: '30s', target: 0 },  // Ramp down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        errors: ['rate<0.01'],            // Error rate must be less than 1%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';
const USER_EMAIL = __ENV.USER_EMAIL || 'test@example.com';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'password123';

export default function () {
    let authToken = '';

    group('Authentication', () => {
        const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
            email: USER_EMAIL,
            password: USER_PASSWORD,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        const success = check(loginRes, {
            'status is 200': (r) => r.status === 200,
            'has token': (r) => r.json('token') !== undefined,
        });

        if (!success) {
            errorRate.add(1);
            console.log(`Login failed: ${loginRes.status} ${loginRes.body}`);
            return; // Stop iteration if login fails
        }

        authToken = loginRes.json('token');
    });

    if (!authToken) return;

    const params = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
    };

    group('Documents', () => {
        const docsRes = http.get(`${BASE_URL}/documents`, params);

        const success = check(docsRes, {
            'status is 200': (r) => r.status === 200,
        });

        if (!success) errorRate.add(1);
        sleep(1);
    });

    group('Chat', () => {
        const chatPayload = JSON.stringify({
            message: 'Was sind meine Rechte bei Schimmel?',
        });

        const chatRes = http.post(`${BASE_URL}/chat`, chatPayload, params);

        const success = check(chatRes, {
            'status is 200': (r) => r.status === 200,
        });

        if (!success) errorRate.add(1);
        sleep(2);
    });
}
