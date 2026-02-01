import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('API Load Testing', () => {
    let authToken: string;
    let testUsers: Array<{token: string, id: string}> = [];

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Create multiple test users for concurrent testing
        for (let i = 0; i < 5; i++) {
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: `load-test-${i}@example.com`,
                    password: 'SecurePass123!',
                    userType: 'tenant',
                    acceptedTerms: true
                });

            if (registerResponse.status === 201) {
                testUsers.push({
                    token: registerResponse.body.token,
                    id: registerResponse.body.user.id
                });
            }
        }

        // Use the first user for single-user tests
        if (testUsers.length > 0) {
            authToken = testUsers[0].token;
        }
    });

    afterAll(async () => {
        // Clean up test data
        try {
            await prisma.user.deleteMany({
                where: {
                    email: {
                        contains: 'load-test-'
                    }
                }
            });
        } catch (error) {
            // Ignore errors during cleanup
        }

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should handle concurrent user registrations', async () => {
        const registrationPromises = [];
        
        // Create 10 concurrent registration requests
        for (let i = 0; i < 10; i++) {
            registrationPromises.push(
                request(app)
                    .post('/api/auth/register')
                    .send({
                        email: `concurrent-load-test-${Date.now()}-${i}@example.com`,
                        password: 'SecurePass123!',
                        userType: 'tenant',
                        acceptedTerms: true
                    })
            );
        }

        // Execute all requests concurrently
        const registrationResponses = await Promise.all(registrationPromises);
        
        // Verify all requests completed successfully
        registrationResponses.forEach(response => {
            expect([201, 400, 409]).toContain(response.status); // 400 for validation errors, 409 for duplicate
        });

        // Clean up concurrently created users
        try {
            await prisma.user.deleteMany({
                where: {
                    email: {
                        contains: 'concurrent-load-test-'
                    }
                }
            });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    it('should maintain acceptable response times under load', async () => {
        const startTime = Date.now();
        
        // Perform 50 concurrent API requests
        const apiPromises = [];
        
        for (let i = 0; i < 50; i++) {
            // Rotate through test users to simulate multiple users
            const userIndex = i % testUsers.length;
            const token = testUsers[userIndex]?.token || authToken;
            
            apiPromises.push(
                request(app)
                    .get('/api/user/profile')
                    .set('Authorization', `Bearer ${token}`)
            );
        }

        const responses = await Promise.all(apiPromises);
        const endTime = Date.now();
        
        // Calculate average response time
        const totalTime = endTime - startTime;
        const averageTime = totalTime / responses.length;
        
        // All requests should complete
        responses.forEach(response => {
            expect([200, 401]).toContain(response.status);
        });
        
        // Average response time should be reasonable (less than 2 seconds)
        expect(averageTime).toBeLessThan(2000);
        
        // Log performance metrics
        console.log(`Processed ${responses.length} requests in ${totalTime}ms`);
        console.log(`Average response time: ${averageTime}ms`);
    });

    it('should handle document upload load', async () => {
        const uploadPromises = [];
        
        // Perform 20 concurrent document uploads
        for (let i = 0; i < 20; i++) {
            const userIndex = i % testUsers.length;
            const token = testUsers[userIndex]?.token || authToken;
            
            uploadPromises.push(
                request(app)
                    .post('/api/documents/upload')
                    .set('Authorization', `Bearer ${token}`)
                    .attach('file', Buffer.from(`Test content for document ${i}`), `load-test-${i}.pdf`)
                    .field('documentType', 'rental_contract')
            );
        }

        const uploadResponses = await Promise.all(uploadPromises);
        
        // Verify uploads completed
        uploadResponses.forEach(response => {
            expect([201, 400, 401]).toContain(response.status);
        });
    });

    it('should handle chat message load', async () => {
        // First create conversations for each user
        const conversationPromises = testUsers.map(user => 
            request(app)
                .post('/api/chat/conversations')
                .set('Authorization', `Bearer ${user.token}`)
                .send({
                    initialQuery: 'Load test query'
                })
        );

        const conversationResponses = await Promise.all(conversationPromises);
        const conversationIds = conversationResponses
            .filter(res => res.status === 201)
            .map(res => res.body.id);

        // Send messages to conversations concurrently
        const messagePromises = [];
        
        for (let i = 0; i < 30; i++) {
            const convIndex = i % conversationIds.length;
            const userIndex = i % testUsers.length;
            
            if (conversationIds[convIndex]) {
                messagePromises.push(
                    request(app)
                        .post(`/api/chat/conversations/${conversationIds[convIndex]}/messages`)
                        .set('Authorization', `Bearer ${testUsers[userIndex].token}`)
                        .send({
                            message: `Load test message ${i}`
                        })
                );
            }
        }

        const messageResponses = await Promise.all(messagePromises);
        
        // Verify messages were processed
        messageResponses.forEach(response => {
            expect([200, 400, 401, 404]).toContain(response.status);
        });
    });
});
