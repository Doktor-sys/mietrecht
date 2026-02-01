import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Cross-Service Cache Integration', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Register and login a test user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'cache-integration-test@example.com',
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
                email: 'cache-integration-test@example.com'
            }
        });

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should maintain cache consistency with database', async () => {
        // 1. Create a document
        const uploadResponse = await request(app)
            .post('/api/documents/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Test PDF content'), 'cache-test.pdf')
            .field('documentType', 'rental_contract');

        expect(uploadResponse.status).toBe(201);
        const documentId = uploadResponse.body.id;

        // 2. Analyze document (this should cache results)
        const analyzeResponse = await request(app)
            .post(`/api/documents/${documentId}/analyze`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(analyzeResponse.status).toBe(200);

        // 3. Check if analysis results are cached
        const cacheKey = `document-analysis:${documentId}`;
        const cachedResult = await redis.get(cacheKey);
        expect(cachedResult).not.toBeNull();

        // 4. Retrieve document list (should use cached data where available)
        const listResponse = await request(app)
            .get('/api/documents')
            .set('Authorization', `Bearer ${authToken}`);

        expect(listResponse.status).toBe(200);
        expect(Array.isArray(listResponse.body)).toBe(true);
        
        const uploadedDocument = listResponse.body.find((doc: any) => doc.id === documentId);
        expect(uploadedDocument).toBeDefined();
        expect(uploadedDocument.filename).toBe('cache-test.pdf');

        // 5. Update document and verify cache invalidation
        // (This would depend on the specific implementation of document updates)
    });

    it('should handle cache failure gracefully', async () => {
        // Simulate cache failure by disconnecting Redis
        await redis.disconnect();

        // Try to perform an operation that would normally use cache
        const response = await request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${authToken}`);

        // System should still work but in degraded mode
        expect([200, 503]).toContain(response.status);
        
        if (response.status === 200) {
            expect(response.body.cacheStatus).toBe('down');
        }

        // Restore Redis connection
        await redis.connect();
    });
});
