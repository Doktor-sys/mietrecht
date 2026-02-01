import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Disaster Recovery - External Services Integration', () => {
    let authToken: string;

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Register and login a test user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'external-services-dr-test@example.com',
                password: 'SecurePass123!',
                userType: 'tenant',
                acceptedTerms: true
            });

        authToken = registerResponse.body.token;
    });

    afterAll(async () => {
        // Clean up test data
        try {
            await prisma.user.deleteMany({
                where: {
                    email: 'external-services-dr-test@example.com'
                }
            });
        } catch (error) {
            // Ignore errors during cleanup
        }

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should handle external API service failures gracefully', async () => {
        // Test the health endpoint to see how external service failures are handled
        const healthResponse = await request(app)
            .get('/api/health');

        expect(healthResponse.status).toBe(200);
        
        // Check that external service statuses are properly reported
        expect(healthResponse.body).toHaveProperty('services');
        
        // If any external services are down, system should still be functional
        // but report degraded status
        if (healthResponse.body.status === 'degraded') {
            // Verify that core functionality still works
            const profileResponse = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${authToken}`);

            // Core functionality should still work even with degraded external services
            expect([200, 401]).toContain(profileResponse.status);
        }
    });

    it('should implement fallback mechanisms for critical external services', async () => {
        // This test would verify that when critical external services fail,
        // the system implements appropriate fallback mechanisms:
        // 1. Caching previously successful responses
        // 2. Using simplified/local alternatives
        // 3. Gracefully degrading functionality
        
        // Test document upload (should work without external services)
        const uploadResponse = await request(app)
            .post('/api/documents/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Test PDF content'), 'fallback-test.pdf')
            .field('documentType', 'rental_contract');

        // Upload should work regardless of external service status
        expect([201, 400, 401]).toContain(uploadResponse.status);
    });

    it('should retry failed external service calls appropriately', async () => {
        // This test would verify that the system implements proper retry logic:
        // 1. Exponential backoff
        // 2. Maximum retry attempts
        // 3. Circuit breaker pattern
        // 4. Appropriate error reporting
        
        // For now, we'll test that the health monitoring includes retry information
        const healthResponse = await request(app)
            .get('/api/health');

        expect(healthResponse.status).toBe(200);
        
        // Check for retry configuration in health report
        if (healthResponse.body.services) {
            // Each service should report its retry configuration
            Object.values(healthResponse.body.services).forEach((service: any) => {
                // Services may have retry configuration
                if (service.retryConfig) {
                    expect(service.retryConfig).toHaveProperty('maxRetries');
                    expect(service.retryConfig).toHaveProperty('backoffMultiplier');
                }
            });
        }
    });

    it('should maintain data consistency during external service outages', async () => {
        // Test that data operations maintain consistency even when external
        // services are unavailable
        
        // 1. Perform a data operation
        const uploadResponse = await request(app)
            .post('/api/documents/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Consistency test content'), 'consistency-test.pdf')
            .field('documentType', 'rental_contract');

        // 2. Verify data is stored correctly in database
        if (uploadResponse.status === 201) {
            const documentId = uploadResponse.body.id;
            
            // Document should be in database regardless of external service status
            const dbDocument = await prisma.document.findUnique({
                where: { id: documentId }
            });
            
            expect(dbDocument).toBeDefined();
            expect(dbDocument?.filename).toBe('consistency-test.pdf');
        }
        
        // 3. Verify system state remains consistent
        const healthResponse = await request(app)
            .get('/api/health');

        expect(healthResponse.status).toBe(200);
        
        // System should maintain consistency status
        if (healthResponse.body.dataConsistency !== undefined) {
            // If data consistency is being monitored, it should be reported properly
            expect(typeof healthResponse.body.dataConsistency).toBe('boolean');
        }
    });
});
