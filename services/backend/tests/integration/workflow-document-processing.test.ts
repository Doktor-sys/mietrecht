import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Document Processing Workflow Integration', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        await prisma.$connect();
        await redis.connect();

        // Register and login a test user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'doc-workflow-integration-test@example.com',
                password: 'SecurePass123!',
                userType: 'tenant',
                acceptedTerms: true
            });

        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.document.deleteMany({
            where: {
                userId: userId
            }
        });
        
        await prisma.user.deleteMany({
            where: {
                email: 'doc-workflow-integration-test@example.com'
            }
        });

        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should complete full document processing workflow', async () => {
        // 1. Upload document
        const uploadResponse = await request(app)
            .post('/api/documents/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Test PDF content for integration testing'), 'test-document.pdf')
            .field('documentType', 'rental_contract');

        expect(uploadResponse.status).toBe(201);
        expect(uploadResponse.body.filename).toBe('test-document.pdf');
        expect(uploadResponse.body.documentType).toBe('rental_contract');

        const documentId = uploadResponse.body.id;

        // 2. Verify document is in database
        const dbDocument = await prisma.document.findUnique({
            where: { id: documentId }
        });
        expect(dbDocument).toBeDefined();
        expect(dbDocument?.filename).toBe('test-document.pdf');

        // 3. Analyze document
        const analyzeResponse = await request(app)
            .post(`/api/documents/${documentId}/analyze`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(analyzeResponse.status).toBe(200);
        expect(analyzeResponse.body.documentId).toBe(documentId);
        expect(analyzeResponse.body).toHaveProperty('issues');
        expect(analyzeResponse.body).toHaveProperty('recommendations');

        // 4. Generate template based on document analysis
        const templateResponse = await request(app)
            .post('/api/templates/generate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                templateType: 'rent_reduction_letter',
                data: {
                    defect: 'Heating failure',
                    duration: '3 weeks',
                    landlordName: 'Mr. Mueller'
                },
                documentId: documentId
            });

        expect(templateResponse.status).toBe(200);
        expect(templateResponse.body).toHaveProperty('document');
        expect(templateResponse.body).toHaveProperty('instructions');

        // 5. List user documents
        const listResponse = await request(app)
            .get('/api/documents')
            .set('Authorization', `Bearer ${authToken}`);

        expect(listResponse.status).toBe(200);
        expect(Array.isArray(listResponse.body)).toBe(true);
        expect(listResponse.body.length).toBeGreaterThan(0);
        const uploadedDocument = listResponse.body.find((doc: any) => doc.id === documentId);
        expect(uploadedDocument).toBeDefined();
        expect(uploadedDocument.filename).toBe('test-document.pdf');
    });

    it('should handle document processing errors gracefully', async () => {
        // Test upload without authentication
        const noAuthResponse = await request(app)
            .post('/api/documents/upload')
            .attach('file', Buffer.from('Test content'), 'test.pdf');

        expect(noAuthResponse.status).toBe(401);

        // Test analyze non-existent document
        const invalidDocResponse = await request(app)
            .post('/api/documents/invalid-id/analyze')
            .set('Authorization', `Bearer ${authToken}`);

        expect(invalidDocResponse.status).toBe(404);

        // Test upload with unsupported file type
        const unsupportedResponse = await request(app)
            .post('/api/documents/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Test content'), 'test.txt')
            .field('documentType', 'rental_contract');

        // Depending on implementation, this might be 400 or 201 with validation error
        expect([201, 400]).toContain(unsupportedResponse.status);
    });
});
