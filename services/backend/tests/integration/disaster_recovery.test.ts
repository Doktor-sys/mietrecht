import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Disaster Recovery', () => {
    beforeAll(async () => {
        // Ensure system is healthy
        await prisma.$connect();
        await redis.connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await redis.disconnect();
    });

    it('should handle database connection failure gracefully', async () => {
        // Simulate DB failure
        await prisma.$disconnect();

        const res = await request(app).get('/api/health');

        // Expect 503 Service Unavailable or degraded mode
        expect([503, 200]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.status).toBe('degraded');
        }

        // Restore DB
        await prisma.$connect();
    });

    it('should handle redis connection failure gracefully', async () => {
        // Simulate Redis failure
        await redis.disconnect();

        const res = await request(app).get('/api/health');

        // Expect system to still work but maybe slower or with warning
        expect(res.status).toBe(200);
        expect(res.body.cacheStatus).toBe('down');

        // Restore Redis
        await redis.connect();
    });
});
