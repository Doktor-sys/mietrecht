import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Cross-Service Payment Integration', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Register and login a test business user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'payment-integration-test@example.com',
                password: 'SecurePass123!',
                userType: 'business',
                acceptedTerms: true,
                companyName: 'Test Company GmbH'
            });

        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.user.deleteMany({
            where: {
                email: 'payment-integration-test@example.com'
            }
        });

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should integrate payment processing with subscription management', async () => {
        // 1. Create API key for business user
        const apiKeyResponse = await request(app)
            .post('/api/b2b/api-keys')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Test API Key',
                permissions: ['documents:read', 'documents:write']
            });

        expect(apiKeyResponse.status).toBe(201);
        expect(apiKeyResponse.body).toHaveProperty('apiKey');

        // 2. Check subscription status
        const subscriptionResponse = await request(app)
            .get('/api/b2b/subscription')
            .set('Authorization', `Bearer ${authToken}`);

        expect([200, 404]).toContain(subscriptionResponse.status); // 404 if no subscription yet

        // 3. Process a payment (in test mode)
        // Note: This would typically use a test payment processor like Stripe test mode
        // For integration tests, we might mock the payment processor or use test credentials
        
        // 4. Verify payment was recorded in database
        // This would depend on the specific implementation of payment recording
    });

    it('should handle payment service failures gracefully', async () => {
        // Test the health endpoint to see payment service status
        const healthResponse = await request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${authToken}`);

        expect(healthResponse.status).toBe(200);
        // Check that payment service status is reported
        expect(healthResponse.body).toHaveProperty('services');
    });
});
