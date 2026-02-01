"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../config/redis");
describe('Redis Configuration Tests', () => {
    beforeAll(async () => {
        await (0, redis_1.connectRedis)();
    });
    afterAll(async () => {
        await (0, redis_1.disconnectRedis)();
    });
    beforeEach(async () => {
        // Cleanup vor jedem Test
        const client = redis_1.redis.getClient();
        if (client.isOpen) {
            await client.flushDb();
        }
    });
    describe('Redis Connection', () => {
        it('should connect to Redis successfully', async () => {
            const isHealthy = await redis_1.redis.healthCheck();
            expect(isHealthy).toBe(true);
        });
        it('should ping Redis server', async () => {
            const client = redis_1.redis.getClient();
            const result = await client.ping();
            expect(result).toBe('PONG');
        });
    });
    describe('Basic Redis Operations', () => {
        it('should set and get string values', async () => {
            const key = 'test:string';
            const value = 'Hello Redis';
            await redis_1.redis.set(key, value);
            const retrieved = await redis_1.redis.get(key);
            expect(retrieved).toBe(value);
        });
        it('should set and get JSON objects', async () => {
            const key = 'test:object';
            const value = { name: 'Test User', age: 30, active: true };
            await redis_1.redis.set(key, value);
            const retrieved = await redis_1.redis.get(key);
            expect(retrieved).toEqual(value);
        });
        it('should handle TTL (Time To Live)', async () => {
            const key = 'test:ttl';
            const value = 'expires soon';
            const ttl = 1; // 1 Sekunde
            await redis_1.redis.set(key, value, ttl);
            // Sofort abrufen sollte funktionieren
            let retrieved = await redis_1.redis.get(key);
            expect(retrieved).toBe(value);
            // Nach TTL sollte der Wert weg sein
            await new Promise(resolve => setTimeout(resolve, 1100));
            retrieved = await redis_1.redis.get(key);
            expect(retrieved).toBeNull();
        });
        it('should delete keys', async () => {
            const key = 'test:delete';
            const value = 'to be deleted';
            await redis_1.redis.set(key, value);
            expect(await redis_1.redis.get(key)).toBe(value);
            await redis_1.redis.del(key);
            expect(await redis_1.redis.get(key)).toBeNull();
        });
        it('should check key existence', async () => {
            const key = 'test:exists';
            const value = 'exists';
            expect(await redis_1.redis.exists(key)).toBe(false);
            await redis_1.redis.set(key, value);
            expect(await redis_1.redis.exists(key)).toBe(true);
            await redis_1.redis.del(key);
            expect(await redis_1.redis.exists(key)).toBe(false);
        });
    });
    describe('Session Management', () => {
        it('should manage user sessions', async () => {
            const sessionId = 'session_123';
            const sessionData = {
                userId: 'user_456',
                email: 'test@example.com',
                loginTime: new Date().toISOString(),
            };
            await redis_1.redis.setSession(sessionId, sessionData, 3600);
            const retrieved = await redis_1.redis.getSession(sessionId);
            expect(retrieved).toEqual(sessionData);
        });
        it('should delete sessions', async () => {
            const sessionId = 'session_delete';
            const sessionData = { userId: 'user_123' };
            await redis_1.redis.setSession(sessionId, sessionData);
            expect(await redis_1.redis.getSession(sessionId)).toEqual(sessionData);
            await redis_1.redis.deleteSession(sessionId);
            expect(await redis_1.redis.getSession(sessionId)).toBeNull();
        });
    });
    describe('Rate Limiting', () => {
        it('should increment rate limit counters', async () => {
            const key = 'rate_limit:test_ip';
            const windowSeconds = 60;
            const count1 = await redis_1.redis.incrementRateLimit(key, windowSeconds);
            expect(count1).toBe(1);
            const count2 = await redis_1.redis.incrementRateLimit(key, windowSeconds);
            expect(count2).toBe(2);
            const count3 = await redis_1.redis.incrementRateLimit(key, windowSeconds);
            expect(count3).toBe(3);
        });
        it('should reset rate limit after window expires', async () => {
            const key = 'rate_limit:expire_test';
            const windowSeconds = 1;
            const count1 = await redis_1.redis.incrementRateLimit(key, windowSeconds);
            expect(count1).toBe(1);
            // Warte bis das Fenster abläuft
            await new Promise(resolve => setTimeout(resolve, 1100));
            const count2 = await redis_1.redis.incrementRateLimit(key, windowSeconds);
            expect(count2).toBe(1); // Sollte wieder bei 1 anfangen
        });
    });
    describe('Cache Patterns', () => {
        it('should implement getOrSet pattern', async () => {
            const key = 'cache:expensive_operation';
            let fetchCallCount = 0;
            const fetchFunction = async () => {
                fetchCallCount++;
                return { result: 'expensive data', timestamp: Date.now() };
            };
            // Erster Aufruf sollte fetchFunction aufrufen
            const result1 = await redis_1.redis.getOrSet(key, fetchFunction, 60);
            expect(fetchCallCount).toBe(1);
            expect(result1.result).toBe('expensive data');
            // Zweiter Aufruf sollte aus Cache kommen
            const result2 = await redis_1.redis.getOrSet(key, fetchFunction, 60);
            expect(fetchCallCount).toBe(1); // Sollte nicht nochmal aufgerufen werden
            expect(result2).toEqual(result1);
        });
        it('should handle cache misses in getOrSet', async () => {
            const key = 'cache:miss_test';
            const fetchFunction = async () => {
                return { data: 'fresh data' };
            };
            // Cache sollte leer sein
            expect(await redis_1.redis.get(key)).toBeNull();
            // getOrSet sollte fetchFunction aufrufen
            const result = await redis_1.redis.getOrSet(key, fetchFunction, 60);
            expect(result.data).toBe('fresh data');
            // Jetzt sollte es im Cache sein
            const cached = await redis_1.redis.get(key);
            expect(cached).toEqual(result);
        });
    });
    describe('Error Handling', () => {
        it('should handle Redis connection errors gracefully', async () => {
            // Simuliere einen Redis-Fehler durch ungültigen Key
            const invalidKey = null;
            await expect(redis_1.redis.set(invalidKey, 'value')).rejects.toThrow();
        });
        it('should handle JSON parsing errors', async () => {
            const key = 'test:invalid_json';
            const client = redis_1.redis.getClient();
            // Setze ungültiges JSON direkt über Redis Client
            await client.set(key, 'invalid json {');
            // get() sollte einen Fehler werfen
            await expect(redis_1.redis.get(key)).rejects.toThrow();
        });
    });
});
