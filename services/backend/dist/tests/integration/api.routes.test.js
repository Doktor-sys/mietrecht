"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const database_1 = require("../../config/database");
// Mock Prisma
jest.mock('../../config/database');
describe('API Routes Integration Tests', () => {
    let app;
    let authToken;
    let testUserId;
    beforeAll(async () => {
        // Setup Express App mit allen Routes
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Import routes
        const authRoutes = require('../../routes/auth');
        const userRoutes = require('../../routes/user');
        const chatRoutes = require('../../routes/chat');
        const documentRoutes = require('../../routes/document');
        const lawyerRoutes = require('../../routes/lawyer');
        app.use('/api/auth', authRoutes);
        app.use('/api/user', userRoutes);
        app.use('/api/chat', chatRoutes);
        app.use('/api/documents', documentRoutes);
        app.use('/api/lawyers', lawyerRoutes);
    });
    describe('Authentication Flow', () => {
        it('sollte User registrieren, einloggen und Profil abrufen', async () => {
            // 1. Registration
            const registerData = {
                email: 'integration@test.com',
                password: 'Test123!',
                userType: 'tenant',
                acceptedTerms: true,
            };
            database_1.prisma.user.create.mockResolvedValue({
                id: 'user-123',
                ...registerData,
                password: 'hashed',
            });
            const registerResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(registerData);
            expect(registerResponse.status).toBe(201);
            expect(registerResponse.body).toHaveProperty('token');
            testUserId = registerResponse.body.user.id;
            authToken = registerResponse.body.token;
            // 2. Login
            database_1.prisma.user.findUnique.mockResolvedValue({
                id: testUserId,
                email: registerData.email,
                password: 'hashed',
            });
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: registerData.email,
                password: registerData.password,
            });
            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body).toHaveProperty('token');
            // 3. Profil abrufen
            const profileResponse = await (0, supertest_1.default)(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${authToken}`);
            expect(profileResponse.status).toBe(200);
            expect(profileResponse.body.email).toBe(registerData.email);
        });
        it('sollte Login mit falschen Credentials ablehnen', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'wrong@test.com',
                password: 'WrongPassword',
            });
            expect(response.status).toBe(401);
        });
    });
    describe('Chat Flow', () => {
        it('sollte Konversation starten und Nachrichten senden', async () => {
            // 1. Konversation starten
            const startConvResponse = await (0, supertest_1.default)(app)
                .post('/api/chat/conversations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                initialQuery: 'Meine Heizung ist kaputt',
            });
            expect(startConvResponse.status).toBe(201);
            const conversationId = startConvResponse.body.id;
            // 2. Nachricht senden
            const sendMessageResponse = await (0, supertest_1.default)(app)
                .post(`/api/chat/conversations/${conversationId}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                message: 'Wie lange kann ich die Miete mindern?',
            });
            expect(sendMessageResponse.status).toBe(200);
            expect(sendMessageResponse.body).toHaveProperty('message');
            expect(sendMessageResponse.body).toHaveProperty('legalReferences');
            // 3. Konversationshistorie abrufen
            const historyResponse = await (0, supertest_1.default)(app)
                .get('/api/chat/conversations')
                .set('Authorization', `Bearer ${authToken}`);
            expect(historyResponse.status).toBe(200);
            expect(Array.isArray(historyResponse.body)).toBe(true);
        });
    });
    describe('Document Flow', () => {
        it('sollte Dokument hochladen und analysieren', async () => {
            // 1. Dokument hochladen
            const uploadResponse = await (0, supertest_1.default)(app)
                .post('/api/documents/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from('test pdf content'), 'test.pdf')
                .field('documentType', 'rental_contract');
            expect(uploadResponse.status).toBe(201);
            const documentId = uploadResponse.body.id;
            // 2. Dokument analysieren
            const analyzeResponse = await (0, supertest_1.default)(app)
                .post(`/api/documents/${documentId}/analyze`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(analyzeResponse.status).toBe(200);
            expect(analyzeResponse.body).toHaveProperty('issues');
            expect(analyzeResponse.body).toHaveProperty('recommendations');
            // 3. Dokumente auflisten
            const listResponse = await (0, supertest_1.default)(app)
                .get('/api/documents')
                .set('Authorization', `Bearer ${authToken}`);
            expect(listResponse.status).toBe(200);
            expect(Array.isArray(listResponse.body)).toBe(true);
        });
    });
    describe('Lawyer Matching Flow', () => {
        it('sollte Anwälte suchen und Termin buchen', async () => {
            // 1. Anwälte suchen
            const searchResponse = await (0, supertest_1.default)(app)
                .get('/api/lawyers/search')
                .set('Authorization', `Bearer ${authToken}`)
                .query({
                location: 'Berlin',
                specialization: 'Mietrecht',
            });
            expect(searchResponse.status).toBe(200);
            expect(Array.isArray(searchResponse.body)).toBe(true);
            if (searchResponse.body.length > 0) {
                const lawyerId = searchResponse.body[0].id;
                // 2. Termin buchen
                const bookingResponse = await (0, supertest_1.default)(app)
                    .post('/api/lawyers/bookings')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                    lawyerId,
                    timeSlot: {
                        date: '2024-12-01',
                        time: '10:00',
                    },
                });
                expect(bookingResponse.status).toBe(201);
                expect(bookingResponse.body).toHaveProperty('bookingId');
            }
        });
    });
    describe('Error Handling', () => {
        it('sollte 401 für nicht authentifizierte Requests zurückgeben', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/user/profile');
            expect(response.status).toBe(401);
        });
        it('sollte 404 für nicht existierende Routes zurückgeben', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/nonexistent');
            expect(response.status).toBe(404);
        });
        it('sollte 400 für ungültige Request-Daten zurückgeben', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                email: 'invalid-email',
                // Fehlende erforderliche Felder
            });
            expect(response.status).toBe(400);
        });
    });
    describe('Rate Limiting', () => {
        it('sollte zu viele Requests blockieren', async () => {
            const requests = [];
            // Sende 101 Requests (Limit ist 100)
            for (let i = 0; i < 101; i++) {
                requests.push((0, supertest_1.default)(app)
                    .get('/api/health'));
            }
            const responses = await Promise.all(requests);
            const blockedRequests = responses.filter(r => r.status === 429);
            expect(blockedRequests.length).toBeGreaterThan(0);
        });
    });
});
