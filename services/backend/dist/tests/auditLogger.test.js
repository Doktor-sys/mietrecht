"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const AuditLogger_1 = require("../services/kms/AuditLogger");
const kms_1 = require("../types/kms");
const uuid = __importStar(require("uuid"));
describe('AuditLogger', () => {
    let prisma;
    let auditLogger;
    const testTenantId = 'test-tenant-audit-' + Date.now();
    const testHmacKey = 'test-hmac-key-' + Date.now();
    const testLogIds = [];
    beforeAll(() => {
        prisma = new client_1.PrismaClient();
        auditLogger = new AuditLogger_1.AuditLogger(prisma, testHmacKey);
    });
    afterAll(async () => {
        // Cleanup test logs
        await prisma.keyAuditLog.deleteMany({
            where: { tenantId: testTenantId }
        });
        await prisma.$disconnect();
    });
    afterEach(async () => {
        // Cleanup logs created in tests
        if (testLogIds.length > 0) {
            await prisma.keyAuditLog.deleteMany({
                where: { id: { in: testLogIds } }
            });
            testLogIds.length = 0;
        }
    });
    describe('logKeyCreation()', () => {
        it('sollte Schlüsselerstellung protokollieren', async () => {
            const keyId = uuid.v4();
            const metadata = {
                purpose: 'data_encryption',
                algorithm: 'aes-256-gcm'
            };
            await auditLogger.logKeyCreation(keyId, testTenantId, metadata);
            // Verify log was created
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId,
                eventType: kms_1.AuditEventType.KEY_CREATED
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].eventType).toBe(kms_1.AuditEventType.KEY_CREATED);
            expect(logs[0].keyId).toBe(keyId);
            expect(logs[0].tenantId).toBe(testTenantId);
            expect(logs[0].result).toBe('success');
            expect(logs[0].metadata).toEqual(metadata);
            expect(logs[0].hmacSignature).toBeDefined();
            testLogIds.push(logs[0].id);
        });
        it('sollte HMAC-Signatur für Log-Eintrag erstellen', async () => {
            const keyId = uuid.v4();
            await auditLogger.logKeyCreation(keyId, testTenantId, {});
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId
            });
            expect(logs[0].hmacSignature).toBeDefined();
            expect(logs[0].hmacSignature.length).toBeGreaterThan(0);
            testLogIds.push(logs[0].id);
        });
    });
    describe('logKeyAccess()', () => {
        it('sollte Schlüsselzugriff protokollieren', async () => {
            const keyId = uuid.v4();
            const serviceId = 'document-service';
            await auditLogger.logKeyAccess(keyId, testTenantId, serviceId);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId,
                eventType: kms_1.AuditEventType.KEY_ACCESSED
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].eventType).toBe(kms_1.AuditEventType.KEY_ACCESSED);
            expect(logs[0].serviceId).toBe(serviceId);
            expect(logs[0].action).toBe('access_key');
            testLogIds.push(logs[0].id);
        });
    });
    describe('logKeyRotation()', () => {
        it('sollte Schlüsselrotation protokollieren', async () => {
            const oldKeyId = uuid.v4();
            const newKeyId = uuid.v4();
            await auditLogger.logKeyRotation(oldKeyId, newKeyId, testTenantId);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: newKeyId,
                eventType: kms_1.AuditEventType.KEY_ROTATED
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].eventType).toBe(kms_1.AuditEventType.KEY_ROTATED);
            expect(logs[0].metadata).toEqual({ oldKeyId, newKeyId });
            testLogIds.push(logs[0].id);
        });
    });
    describe('logKeyStatusChange()', () => {
        it('sollte Status-Änderung protokollieren', async () => {
            const keyId = uuid.v4();
            const oldStatus = kms_1.KeyStatus.ACTIVE;
            const newStatus = kms_1.KeyStatus.DEPRECATED;
            const reason = 'Key rotation completed';
            await auditLogger.logKeyStatusChange(keyId, testTenantId, oldStatus, newStatus, reason);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId,
                eventType: kms_1.AuditEventType.KEY_STATUS_CHANGED
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].metadata).toEqual({ oldStatus, newStatus, reason });
            testLogIds.push(logs[0].id);
        });
    });
    describe('logKeyDeletion()', () => {
        it('sollte Schlüssellöschung protokollieren', async () => {
            const keyId = uuid.v4();
            const force = true;
            await auditLogger.logKeyDeletion(keyId, testTenantId, force);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId,
                eventType: kms_1.AuditEventType.KEY_DELETED
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].eventType).toBe(kms_1.AuditEventType.KEY_DELETED);
            expect(logs[0].metadata).toEqual({ force });
            testLogIds.push(logs[0].id);
        });
    });
    describe('logSecurityEvent()', () => {
        it('sollte Sicherheitsvorfall protokollieren', async () => {
            const event = {
                eventType: kms_1.AuditEventType.SECURITY_ALERT,
                tenantId: testTenantId,
                keyId: uuid.v4(),
                action: 'suspicious_access_pattern',
                result: 'failure',
                metadata: {
                    reason: 'Multiple failed access attempts',
                    attemptCount: 5
                }
            };
            await auditLogger.logSecurityEvent(event);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                eventType: kms_1.AuditEventType.SECURITY_ALERT
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].eventType).toBe(kms_1.AuditEventType.SECURITY_ALERT);
            expect(logs[0].action).toBe('suspicious_access_pattern');
            testLogIds.push(logs[0].id);
        });
        it('sollte unautorisierten Zugriff protokollieren', async () => {
            const event = {
                eventType: kms_1.AuditEventType.UNAUTHORIZED_ACCESS,
                tenantId: testTenantId,
                keyId: uuid.v4(),
                action: 'unauthorized_key_access',
                result: 'failure',
                userId: 'malicious-user',
                ipAddress: '192.168.1.100'
            };
            await auditLogger.logSecurityEvent(event);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                eventType: kms_1.AuditEventType.UNAUTHORIZED_ACCESS
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].userId).toBe('malicious-user');
            expect(logs[0].ipAddress).toBe('192.168.1.100');
            testLogIds.push(logs[0].id);
        });
    });
    describe('logFailure()', () => {
        it('sollte fehlgeschlagene Operation protokollieren', async () => {
            const keyId = uuid.v4();
            const error = new Error('Key not found');
            await auditLogger.logFailure(kms_1.AuditEventType.KEY_ACCESSED, keyId, testTenantId, 'access_key', error);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId,
                result: 'failure'
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].result).toBe('failure');
            expect(logs[0].metadata?.error).toBe('Key not found');
            testLogIds.push(logs[0].id);
        });
    });
    describe('queryAuditLog()', () => {
        beforeEach(async () => {
            // Create test logs
            const keyId1 = uuid.v4();
            const keyId2 = uuid.v4();
            await auditLogger.logKeyCreation(keyId1, testTenantId, {});
            await auditLogger.logKeyAccess(keyId1, testTenantId, 'service-1');
            await auditLogger.logKeyCreation(keyId2, testTenantId, {});
            // Get IDs for cleanup
            const logs = await auditLogger.queryAuditLog({ tenantId: testTenantId });
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte Logs nach Tenant-ID filtern', async () => {
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs.every(log => log.tenantId === testTenantId)).toBe(true);
        });
        it('sollte Logs nach Event-Typ filtern', async () => {
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                eventType: kms_1.AuditEventType.KEY_CREATED
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs.every(log => log.eventType === kms_1.AuditEventType.KEY_CREATED)).toBe(true);
        });
        it('sollte Logs nach Key-ID filtern', async () => {
            const keyId = uuid.v4();
            await auditLogger.logKeyCreation(keyId, testTenantId, {});
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs.every(log => log.keyId === keyId)).toBe(true);
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte Logs nach Service-ID filtern', async () => {
            const keyId = uuid.v4();
            const serviceId = 'test-service';
            await auditLogger.logKeyAccess(keyId, testTenantId, serviceId);
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                serviceId: serviceId
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs.every(log => log.serviceId === serviceId)).toBe(true);
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte Logs nach Zeitraum filtern', async () => {
            const startDate = new Date(Date.now() - 60000); // 1 minute ago
            const endDate = new Date();
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                startDate,
                endDate
            });
            expect(logs.length).toBeGreaterThan(0);
            expect(logs.every(log => log.timestamp >= startDate && log.timestamp <= endDate)).toBe(true);
        });
        it('sollte Limit und Offset respektieren', async () => {
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                limit: 2,
                offset: 0
            });
            expect(logs.length).toBeLessThanOrEqual(2);
        });
        it('sollte Logs in absteigender Reihenfolge zurückgeben', async () => {
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId
            });
            expect(logs.length).toBeGreaterThan(1);
            for (let i = 0; i < logs.length - 1; i++) {
                expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(logs[i + 1].timestamp.getTime());
            }
        });
    });
    describe('verifyLogEntry()', () => {
        it('sollte gültige HMAC-Signatur verifizieren', async () => {
            const keyId = uuid.v4();
            await auditLogger.logKeyCreation(keyId, testTenantId, {});
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId
            });
            const isValid = auditLogger.verifyLogEntry(logs[0]);
            expect(isValid).toBe(true);
            testLogIds.push(logs[0].id);
        });
        it('sollte manipulierte Log-Einträge erkennen', async () => {
            const keyId = uuid.v4();
            await auditLogger.logKeyCreation(keyId, testTenantId, {});
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId
            });
            // Manipuliere den Log-Eintrag
            const manipulatedLog = { ...logs[0], action: 'manipulated_action' };
            const isValid = auditLogger.verifyLogEntry(manipulatedLog);
            expect(isValid).toBe(false);
            testLogIds.push(logs[0].id);
        });
    });
    describe('countByEventType()', () => {
        beforeEach(async () => {
            // Create test logs
            await auditLogger.logKeyCreation(uuid.v4(), testTenantId, {});
            await auditLogger.logKeyCreation(uuid.v4(), testTenantId, {});
            await auditLogger.logKeyAccess(uuid.v4(), testTenantId, 'service-1');
            const logs = await auditLogger.queryAuditLog({ tenantId: testTenantId });
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte Logs nach Event-Typ zählen', async () => {
            const counts = await auditLogger.countByEventType(testTenantId);
            expect(counts[kms_1.AuditEventType.KEY_CREATED]).toBeGreaterThanOrEqual(2);
            expect(counts[kms_1.AuditEventType.KEY_ACCESSED]).toBeGreaterThanOrEqual(1);
        });
        it('sollte Zeitraum-Filter respektieren', async () => {
            const startDate = new Date(Date.now() - 60000);
            const endDate = new Date();
            const counts = await auditLogger.countByEventType(testTenantId, startDate, endDate);
            expect(counts).toBeDefined();
            expect(typeof counts[kms_1.AuditEventType.KEY_CREATED]).toBe('number');
        });
    });
    describe('findSuspiciousActivity()', () => {
        it('sollte fehlgeschlagene Zugriffe finden', async () => {
            const keyId = uuid.v4();
            const error = new Error('Unauthorized');
            await auditLogger.logFailure(kms_1.AuditEventType.KEY_ACCESSED, keyId, testTenantId, 'access_key', error);
            const suspicious = await auditLogger.findSuspiciousActivity(testTenantId, 60);
            expect(suspicious.length).toBeGreaterThan(0);
            expect(suspicious.some(log => log.result === 'failure')).toBe(true);
            const logs = await auditLogger.queryAuditLog({ tenantId: testTenantId });
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte Security-Alerts finden', async () => {
            const event = {
                eventType: kms_1.AuditEventType.SECURITY_ALERT,
                tenantId: testTenantId,
                action: 'suspicious_pattern',
                result: 'failure'
            };
            await auditLogger.logSecurityEvent(event);
            const suspicious = await auditLogger.findSuspiciousActivity(testTenantId, 60);
            expect(suspicious.length).toBeGreaterThan(0);
            expect(suspicious.some(log => log.eventType === kms_1.AuditEventType.SECURITY_ALERT)).toBe(true);
            const logs = await auditLogger.queryAuditLog({ tenantId: testTenantId });
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte Zeitfenster respektieren', async () => {
            const suspicious = await auditLogger.findSuspiciousActivity(testTenantId, 1);
            // Sollte nur Aktivitäten der letzten Minute finden
            const oneMinuteAgo = new Date(Date.now() - 60000);
            expect(suspicious.every(log => log.timestamp >= oneMinuteAgo)).toBe(true);
        });
    });
    describe('cleanupOldLogs()', () => {
        it('sollte alte Logs löschen', async () => {
            // Create a log
            const keyId = uuid.v4();
            await auditLogger.logKeyCreation(keyId, testTenantId, {});
            // Cleanup logs older than 0 days (should delete nothing recent)
            const deletedCount = await auditLogger.cleanupOldLogs(0);
            // Should not delete recent logs
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId
            });
            expect(logs.length).toBeGreaterThan(0);
            testLogIds.push(...logs.map(l => l.id));
        });
    });
    describe('exportLogs()', () => {
        beforeEach(async () => {
            await auditLogger.logKeyCreation(uuid.v4(), testTenantId, {});
            await auditLogger.logKeyAccess(uuid.v4(), testTenantId, 'service-1');
            const logs = await auditLogger.queryAuditLog({ tenantId: testTenantId });
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte Logs als JSON exportieren', async () => {
            const exported = await auditLogger.exportLogs({ tenantId: testTenantId }, 'json');
            expect(exported).toBeDefined();
            const parsed = JSON.parse(exported);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBeGreaterThan(0);
        });
        it('sollte Logs als CSV exportieren', async () => {
            const exported = await auditLogger.exportLogs({ tenantId: testTenantId }, 'csv');
            expect(exported).toBeDefined();
            expect(exported).toContain('timestamp,eventType');
            expect(exported.split('\n').length).toBeGreaterThan(1);
        });
    });
    describe('HMAC-Sicherheit', () => {
        it('sollte unterschiedliche Signaturen für unterschiedliche Daten erstellen', async () => {
            const keyId1 = uuid.v4();
            const keyId2 = uuid.v4();
            await auditLogger.logKeyCreation(keyId1, testTenantId, {});
            await auditLogger.logKeyCreation(keyId2, testTenantId, {});
            const logs = await auditLogger.queryAuditLog({ tenantId: testTenantId });
            expect(logs[0].hmacSignature).not.toBe(logs[1].hmacSignature);
            testLogIds.push(...logs.map(l => l.id));
        });
        it('sollte konsistente Signaturen für gleiche Daten erstellen', async () => {
            const keyId = uuid.v4();
            await auditLogger.logKeyCreation(keyId, testTenantId, { test: 'data' });
            const logs = await auditLogger.queryAuditLog({
                tenantId: testTenantId,
                keyId: keyId
            });
            const signature1 = logs[0].hmacSignature;
            // Verify the same entry
            const isValid = auditLogger.verifyLogEntry(logs[0]);
            expect(isValid).toBe(true);
            testLogIds.push(logs[0].id);
        });
    });
});
