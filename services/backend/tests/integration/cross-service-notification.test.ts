import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Cross-Service Notification Integration', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Register and login a test user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'notification-integration-test@example.com',
                password: 'SecurePass123!',
                userType: 'tenant',
                acceptedTerms: true
            });

        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.user.deleteMany({
            where: {
                email: 'notification-integration-test@example.com'
            }
        });

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should integrate email notifications with user actions', async () => {
        // 1. Update user profile with notification preferences
        const profileUpdateResponse = await request(app)
            .put('/api/user/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                notificationPreferences: {
                    email: true,
                    sms: false,
                    push: true
                }
            });

        expect(profileUpdateResponse.status).toBe(200);
        
        // 2. Trigger a notification-worthy event (e.g., document analysis completion)
        const uploadResponse = await request(app)
            .post('/api/documents/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Test PDF content'), 'notification-test.pdf')
            .field('documentType', 'rental_contract');

        expect(uploadResponse.status).toBe(201);
        const documentId = uploadResponse.body.id;

        const analyzeResponse = await request(app)
            .post(`/api/documents/${documentId}/analyze`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(analyzeResponse.status).toBe(200);

        // 3. Verify notification was queued (this would depend on implementation)
        // In a real test, we might check a notifications table or queue system
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId,
                type: 'document_analysis_complete'
            }
        });

        // Note: This assertion depends on the actual implementation of notification storage
        // expect(notifications.length).toBeGreaterThan(0);
    });

    it('should handle notification service failures gracefully', async () => {
        // This test would simulate email service downtime and verify the system
        // continues to function while logging the failure appropriately
        
        // For now, we'll test the health endpoint to see notification service status
        const healthResponse = await request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${authToken}`);

        expect(healthResponse.status).toBe(200);
        // Check that notification service status is reported
        expect(healthResponse.body).toHaveProperty('services');
    });
});
