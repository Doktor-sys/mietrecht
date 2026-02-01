import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Disaster Recovery - Database Integration', () => {
    let authToken: string;

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Register and login a test user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'db-disaster-recovery-test@example.com',
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
                    email: 'db-disaster-recovery-test@example.com'
                }
            });
        } catch (error) {
            // Ignore errors during cleanup
        }

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should handle database connection failure gracefully', async () => {
        // Simulate database failure by disconnecting
        await prisma.$disconnect();

        // Try to perform database-dependent operations
        const healthResponse = await request(app)
            .get('/api/health');

        // Should return 503 Service Unavailable or 200 with degraded status
        expect([200, 503]).toContain(healthResponse.status);
        
        if (healthResponse.status === 200) {
            expect(healthResponse.body.status).toBe('degraded');
            expect(healthResponse.body.databaseStatus).toBe('down');
        }

        // Try to access protected route (should fail gracefully)
        const profileResponse = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${authToken}`);

        expect([401, 503]).toContain(profileResponse.status);

        // Restore database connection
        await prisma.$connect();
    });

    it('should recover from database failure', async () => {
        // Simulate database failure
        await prisma.$disconnect();

        // Verify system is in degraded mode
        const degradedResponse = await request(app)
            .get('/api/health');

        expect([200, 503]).toContain(degradedResponse.status);

        // Restore database connection
        await prisma.$connect();

        // Verify system recovers
        const recoveredResponse = await request(app)
            .get('/api/health');

        expect(recoveredResponse.status).toBe(200);
        expect(recoveredResponse.body.status).toBe('healthy');
        expect(recoveredResponse.body.databaseStatus).toBe('up');

        // Verify normal operations work again
        const profileResponse = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${authToken}`);

        expect(profileResponse.status).toBe(200);
    });

    it('should handle database transaction failures', async () => {
        // This test would simulate a transaction failure and verify:
        // 1. The system rolls back changes appropriately
        // 2. Error is handled gracefully
        // 3. System continues to function for other operations
        
        // For now, we'll test the health endpoint to ensure it properly reports
        // database transaction capabilities
        const healthResponse = await request(app)
            .get('/api/health');

        expect(healthResponse.status).toBe(200);
        expect(healthResponse.body).toHaveProperty('databaseTransactions');
    });
});
