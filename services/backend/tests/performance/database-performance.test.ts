import { prisma } from '../../src/config/database';

describe('Database Performance Testing', () => {
    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should execute user queries within acceptable time limits', async () => {
        const startTime = Date.now();
        
        // Execute a typical user query
        const users = await prisma.user.findMany({
            take: 100,
            include: {
                documents: true,
                conversations: true
            }
        });
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        // Query should complete within 500ms
        expect(queryTime).toBeLessThan(500);
        
        console.log(`User query with relations completed in ${queryTime}ms`);
    });

    it('should handle document queries efficiently', async () => {
        const startTime = Date.now();
        
        // Execute a document query with filters
        const documents = await prisma.document.findMany({
            where: {
                documentType: 'rental_contract'
            },
            take: 50,
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        // Query should complete within 300ms
        expect(queryTime).toBeLessThan(300);
        
        console.log(`Document query completed in ${queryTime}ms`);
    });

    it('should handle complex analytics queries', async () => {
        const startTime = Date.now();
        
        // Execute a complex analytics query (example)
        const analyticsData = await prisma.document.groupBy({
            by: ['documentType'],
            _count: true,
            _avg: {
                processingTime: true
            },
            orderBy: {
                _count: 'desc'
            }
        });
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        // Analytics query should complete within 1000ms
        expect(queryTime).toBeLessThan(1000);
        
        console.log(`Analytics query completed in ${queryTime}ms`);
    });

    it('should maintain performance with large datasets', async () => {
        // This test would typically be run against a database with large amounts of test data
        // For regular testing, we'll just verify basic performance
        
        const startTime = Date.now();
        
        // Execute a query that might be affected by data volume
        const paginatedUsers = await prisma.user.findMany({
            skip: 0,
            take: 20,
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        // Should maintain performance even as dataset grows
        expect(queryTime).toBeLessThan(200);
        
        console.log(`Paginated query completed in ${queryTime}ms`);
    });

    it('should handle concurrent database operations', async () => {
        const startTime = Date.now();
        
        // Execute multiple database operations concurrently
        const operations = [
            prisma.user.count(),
            prisma.document.count(),
            prisma.conversation.count(),
            prisma.user.findMany({ take: 10 }),
            prisma.document.findMany({ take: 10 })
        ];
        
        const results = await Promise.all(operations);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // All operations should complete within 1000ms
        expect(totalTime).toBeLessThan(1000);
        
        // Verify all operations returned results
        expect(results.length).toBe(5);
        results.forEach(result => {
            expect(result).toBeDefined();
        });
        
        console.log(`Concurrent database operations completed in ${totalTime}ms`);
    });
});
