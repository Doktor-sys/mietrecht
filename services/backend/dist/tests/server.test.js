"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
describe('Server Setup Tests', () => {
    describe('Health Check', () => {
        it('should return 200 for health check', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/health')
                .expect(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('environment');
        });
    });
    describe('API Documentation', () => {
        it('should serve Swagger documentation', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api-docs.json')
                .expect(200);
            expect(response.body).toHaveProperty('openapi');
            expect(response.body).toHaveProperty('info');
            expect(response.body.info).toHaveProperty('title', 'SmartLaw Mietrecht Agent API');
        });
    });
    describe('Error Handling', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/unknown-route')
                .expect(404);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
        });
    });
    describe('Security Headers', () => {
        it('should include security headers', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/health')
                .expect(200);
            expect(response.headers).toHaveProperty('x-content-type-options');
            expect(response.headers).toHaveProperty('x-frame-options');
            expect(response.headers).toHaveProperty('x-xss-protection');
        });
    });
    describe('CORS Configuration', () => {
        it('should handle CORS preflight requests', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .options('/api/auth/login')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'POST')
                .expect(204);
            expect(response.headers).toHaveProperty('access-control-allow-origin');
            expect(response.headers).toHaveProperty('access-control-allow-methods');
        });
    });
    describe('Rate Limiting', () => {
        it('should apply rate limiting to API routes', async () => {
            // Simuliere mehrere Anfragen
            const promises = Array(10).fill(null).map(() => (0, supertest_1.default)(index_1.default).get('/api/auth/login'));
            const responses = await Promise.all(promises);
            // Alle Anfragen sollten durchgehen (da wir unter dem Limit sind)
            responses.forEach(response => {
                expect([200, 501]).toContain(response.status); // 501 weil Route noch nicht implementiert
            });
        });
    });
});
