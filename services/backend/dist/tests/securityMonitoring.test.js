"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SecurityMonitoringService_1 = require("../services/SecurityMonitoringService");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
jest.mock('../config/database');
jest.mock('../config/redis');
describe('SecurityMonitoringService', () => {
    let securityService;
    beforeEach(() => {
        securityService = new SecurityMonitoringService_1.SecurityMonitoringService();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('detectAnomalousActivity', () => {
        it('sollte ungewöhnliche Login-Versuche erkennen', async () => {
            const userId = 'user-123';
            const ipAddress = '192.168.1.1';
            // Simuliere mehrere fehlgeschlagene Login-Versuche
            redis_1.redis.get.mockResolvedValue('5'); // 5 fehlgeschlagene Versuche
            const result = await securityService.detectAnomalousActivity(userId, {
                type: 'failed_login',
                ipAddress,
                timestamp: new Date(),
            });
            expect(result.isAnomalous).toBe(true);
            expect(result.severity).toBe('high');
            expect(result.reason).toContain('Mehrere fehlgeschlagene Login-Versuche');
        });
        it('sollte ungewöhnliche Zugriffsmuster erkennen', async () => {
            const userId = 'user-123';
            // Simuliere Zugriff aus ungewöhnlichem Land
            const result = await securityService.detectAnomalousActivity(userId, {
                type: 'data_access',
                location: 'Unknown Country',
                timestamp: new Date(),
            });
            expect(result.isAnomalous).toBe(true);
            expect(result.reason).toContain('Zugriff aus ungewöhnlichem Standort');
        });
        it('sollte normale Aktivität als sicher markieren', async () => {
            const userId = 'user-123';
            redis_1.redis.get.mockResolvedValue('0');
            const result = await securityService.detectAnomalousActivity(userId, {
                type: 'normal_access',
                timestamp: new Date(),
            });
            expect(result.isAnomalous).toBe(false);
            expect(result.severity).toBe('low');
        });
    });
    describe('logSecurityEvent', () => {
        it('sollte Sicherheitsereignisse protokollieren', async () => {
            const event = {
                userId: 'user-123',
                eventType: 'unauthorized_access',
                severity: 'critical',
                details: { resource: '/admin/users' },
                timestamp: new Date(),
            };
            database_1.prisma.securityEvent.create.mockResolvedValue(event);
            await securityService.logSecurityEvent(event);
            expect(database_1.prisma.securityEvent.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: event.userId,
                    eventType: event.eventType,
                    severity: event.severity,
                }),
            });
        });
    });
    describe('checkRateLimiting', () => {
        it('sollte Rate Limiting durchsetzen', async () => {
            const userId = 'user-123';
            const action = 'api_request';
            // Simuliere zu viele Anfragen
            redis_1.redis.incr.mockResolvedValue(101); // Über Limit von 100
            redis_1.redis.expire.mockResolvedValue(1);
            const result = await securityService.checkRateLimiting(userId, action);
            expect(result.allowed).toBe(false);
            expect(result.remainingRequests).toBe(0);
            expect(result.resetTime).toBeDefined();
        });
        it('sollte Anfragen innerhalb des Limits erlauben', async () => {
            const userId = 'user-123';
            const action = 'api_request';
            redis_1.redis.incr.mockResolvedValue(50);
            const result = await securityService.checkRateLimiting(userId, action);
            expect(result.allowed).toBe(true);
            expect(result.remainingRequests).toBeGreaterThan(0);
        });
    });
    describe('detectBruteForceAttack', () => {
        it('sollte Brute-Force-Angriffe erkennen', async () => {
            const ipAddress = '192.168.1.1';
            // Simuliere viele fehlgeschlagene Versuche von derselben IP
            redis_1.redis.get.mockResolvedValue('10');
            const result = await securityService.detectBruteForceAttack(ipAddress);
            expect(result.isBruteForce).toBe(true);
            expect(result.blockDuration).toBeGreaterThan(0);
        });
    });
    describe('monitorDataAccess', () => {
        it('sollte Datenzugriffe überwachen', async () => {
            const userId = 'user-123';
            const resourceId = 'doc-456';
            const accessLog = {
                userId,
                resourceId,
                resourceType: 'document',
                action: 'read',
                timestamp: new Date(),
            };
            database_1.prisma.dataAccessLog.create.mockResolvedValue(accessLog);
            await securityService.monitorDataAccess(accessLog);
            expect(database_1.prisma.dataAccessLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId,
                    resourceId,
                    action: 'read',
                }),
            });
        });
    });
    describe('generateSecurityReport', () => {
        it('sollte Sicherheitsbericht generieren', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const mockEvents = [
                { eventType: 'failed_login', severity: 'medium', count: 5 },
                { eventType: 'unauthorized_access', severity: 'high', count: 2 },
            ];
            database_1.prisma.securityEvent.groupBy.mockResolvedValue(mockEvents);
            const report = await securityService.generateSecurityReport(startDate, endDate);
            expect(report).toHaveProperty('totalEvents');
            expect(report).toHaveProperty('eventsByType');
            expect(report).toHaveProperty('criticalEvents');
            expect(report.eventsByType).toHaveLength(2);
        });
    });
    describe('blockSuspiciousIP', () => {
        it('sollte verdächtige IP-Adressen blockieren', async () => {
            const ipAddress = '192.168.1.1';
            const reason = 'Brute force attack detected';
            redis_1.redis.setex.mockResolvedValue('OK');
            await securityService.blockSuspiciousIP(ipAddress, reason);
            expect(redis_1.redis.setex).toHaveBeenCalledWith(expect.stringContaining(ipAddress), expect.any(Number), reason);
        });
    });
    describe('isIPBlocked', () => {
        it('sollte prüfen ob IP blockiert ist', async () => {
            const ipAddress = '192.168.1.1';
            redis_1.redis.get.mockResolvedValue('Blocked for security reasons');
            const result = await securityService.isIPBlocked(ipAddress);
            expect(result.isBlocked).toBe(true);
            expect(result.reason).toBe('Blocked for security reasons');
        });
        it('sollte false zurückgeben für nicht blockierte IPs', async () => {
            const ipAddress = '192.168.1.2';
            redis_1.redis.get.mockResolvedValue(null);
            const result = await securityService.isIPBlocked(ipAddress);
            expect(result.isBlocked).toBe(false);
        });
    });
});
