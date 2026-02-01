import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Chat to Lawyer Workflow Integration', () => {
    let authToken: string;
    let userId: string;
    let conversationId: string;

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Register and login a test user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'chat-lawyer-integration-test@example.com',
                password: 'SecurePass123!',
                userType: 'tenant',
                acceptedTerms: true
            });

        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.booking.deleteMany({
            where: {
                userId: userId
            }
        });
        
        await prisma.conversation.deleteMany({
            where: {
                userId: userId
            }
        });
        
        await prisma.user.deleteMany({
            where: {
                email: 'chat-lawyer-integration-test@example.com'
            }
        });

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should complete chat to lawyer matching workflow', async () => {
        // 1. Start conversation
        const startConvResponse = await request(app)
            .post('/api/chat/conversations')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                initialQuery: 'My heating has been broken for 3 weeks and the landlord is not responding'
            });

        expect(startConvResponse.status).toBe(201);
        expect(startConvResponse.body).toHaveProperty('id');
        expect(startConvResponse.body.category).toBe('rent_reduction');
        expect(startConvResponse.body.priority).toBe('high');

        conversationId = startConvResponse.body.id;

        // 2. Send message to chat
        const messageResponse = await request(app)
            .post(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                message: 'How much can I reduce the rent?'
            });

        expect(messageResponse.status).toBe(200);
        expect(messageResponse.body).toHaveProperty('message');
        expect(messageResponse.body).toHaveProperty('legalReferences');
        expect(messageResponse.body.legalReferences).toContainEqual(
            expect.objectContaining({
                reference: expect.stringContaining('BGB')
            })
        );

        // 3. Escalate to lawyer
        const escalateResponse = await request(app)
            .post(`/api/chat/conversations/${conversationId}/escalate`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(escalateResponse.status).toBe(200);
        expect(escalateResponse.body.success).toBe(true);
        expect(escalateResponse.body).toHaveProperty('escalationReason');

        // 4. Search for lawyers
        const searchResponse = await request(app)
            .get('/api/lawyers/search')
            .set('Authorization', `Bearer ${authToken}`)
            .query({
                location: 'Berlin',
                specialization: 'Mietrecht',
                maxDistance: 10
            });

        expect(searchResponse.status).toBe(200);
        expect(Array.isArray(searchResponse.body)).toBe(true);
        
        // If lawyers are found, test booking
        if (searchResponse.body.length > 0) {
            const lawyerId = searchResponse.body[0].id;

            // 5. Book consultation
            const bookingResponse = await request(app)
                .post('/api/lawyers/bookings')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    lawyerId,
                    conversationId,
                    timeSlot: {
                        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
                        time: '14:00'
                    },
                    consultationType: 'video'
                });

            expect(bookingResponse.status).toBe(201);
            expect(bookingResponse.body.status).toBe('confirmed');
            expect(bookingResponse.body).toHaveProperty('bookingId');
            expect(bookingResponse.body.caseDataTransferred).toBe(true);
        }

        // 6. List conversations
        const convListResponse = await request(app)
            .get('/api/chat/conversations')
            .set('Authorization', `Bearer ${authToken}`);

        expect(convListResponse.status).toBe(200);
        expect(Array.isArray(convListResponse.body)).toBe(true);
        expect(convListResponse.body.length).toBeGreaterThan(0);
        const conversation = convListResponse.body.find((conv: any) => conv.id === conversationId);
        expect(conversation).toBeDefined();
        expect(conversation.escalated).toBe(true);
    });

    it('should handle chat workflow errors gracefully', async () => {
        // Test start conversation without authentication
        const noAuthResponse = await request(app)
            .post('/api/chat/conversations')
            .send({
                initialQuery: 'Test query'
            });

        expect(noAuthResponse.status).toBe(401);

        // Test send message to non-existent conversation
        const invalidConvResponse = await request(app)
            .post('/api/chat/conversations/invalid-id/messages')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                message: 'Test message'
            });

        expect(invalidConvResponse.status).toBe(404);

        // Test search lawyers with invalid parameters
        const invalidSearchResponse = await request(app)
            .get('/api/lawyers/search')
            .set('Authorization', `Bearer ${authToken}`)
            .query({
                location: '', // Empty location
                specialization: 'invalid-specialization'
            });

        // Depending on implementation, this might be 400 or 200 with empty results
        expect([200, 400]).toContain(invalidSearchResponse.status);
    });
});
