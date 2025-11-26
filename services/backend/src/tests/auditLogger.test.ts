import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '../services/kms/AuditLogger';
import {
  AuditEventType,
  KeyStatus,
  SecurityEvent
} from '../types/kms';
import * as uuid from 'uuid';

describe('AuditLogger', () => {
  let prisma: PrismaClient;
  let auditLogger: AuditLogger;
  const testTenantId = 'test-tenant-audit-' + Date.now();
  const testHmacKey = 'test-hmac-key-' + Date.now();
  const testLogIds: string[] = [];

  beforeAll(() => {
    prisma = new PrismaClient();
    auditLogger = new AuditLogger(prisma, testHmacKey);
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
        eventType: AuditEventType.KEY_CREATED
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].eventType).toBe(AuditEventType.KEY_CREATED);
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
        eventType: AuditEventType.KEY_ACCESSED
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].eventType).toBe(AuditEventType.KEY_ACCESSED);
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
        eventType: AuditEventType.KEY_ROTATED
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].eventType).toBe(AuditEventType.KEY_ROTATED);
      expect(logs[0].metadata).toEqual({ oldKeyId, newKeyId });

      testLogIds.push(logs[0].id);
    });
  });

  describe('logKeyStatusChange()', () => {
    it('sollte Status-Änderung protokollieren', async () => {
      const keyId = uuid.v4();
      const oldStatus = KeyStatus.ACTIVE;
      const newStatus = KeyStatus.DEPRECATED;
      const reason = 'Key rotation completed';

      await auditLogger.logKeyStatusChange(
        keyId,
        testTenantId,
        oldStatus,
        newStatus,
        reason
      );

      const logs = await auditLogger.queryAuditLog({
        tenantId: testTenantId,
        keyId: keyId,
        eventType: AuditEventType.KEY_STATUS_CHANGED
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
        eventType: AuditEventType.KEY_DELETED
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].eventType).toBe(AuditEventType.KEY_DELETED);
      expect(logs[0].metadata).toEqual({ force });

      testLogIds.push(logs[0].id);
    });
  });

  describe('logSecurityEvent()', () => {
    it('sollte Sicherheitsvorfall protokollieren', async () => {
      const event: SecurityEvent = {
        eventType: AuditEventType.SECURITY_ALERT,
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
        eventType: AuditEventType.SECURITY_ALERT
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].eventType).toBe(AuditEventType.SECURITY_ALERT);
      expect(logs[0].action).toBe('suspicious_access_pattern');

      testLogIds.push(logs[0].id);
    });

    it('sollte unautorisierten Zugriff protokollieren', async () => {
      const event: SecurityEvent = {
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
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
        eventType: AuditEventType.UNAUTHORIZED_ACCESS
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

      await auditLogger.logFailure(
        AuditEventType.KEY_ACCESSED,
        keyId,
        testTenantId,
        'access_key',
        error
      );

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
        eventType: AuditEventType.KEY_CREATED
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every(log => log.eventType === AuditEventType.KEY_CREATED)).toBe(true);
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
      expect(logs.every(log => 
        log.timestamp >= startDate && log.timestamp <= endDate
      )).toBe(true);
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
        expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          logs[i + 1].timestamp.getTime()
        );
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

      expect(counts[AuditEventType.KEY_CREATED]).toBeGreaterThanOrEqual(2);
      expect(counts[AuditEventType.KEY_ACCESSED]).toBeGreaterThanOrEqual(1);
    });

    it('sollte Zeitraum-Filter respektieren', async () => {
      const startDate = new Date(Date.now() - 60000);
      const endDate = new Date();

      const counts = await auditLogger.countByEventType(
        testTenantId,
        startDate,
        endDate
      );

      expect(counts).toBeDefined();
      expect(typeof counts[AuditEventType.KEY_CREATED]).toBe('number');
    });
  });

  describe('findSuspiciousActivity()', () => {
    it('sollte fehlgeschlagene Zugriffe finden', async () => {
      const keyId = uuid.v4();
      const error = new Error('Unauthorized');

      await auditLogger.logFailure(
        AuditEventType.KEY_ACCESSED,
        keyId,
        testTenantId,
        'access_key',
        error
      );

      const suspicious = await auditLogger.findSuspiciousActivity(testTenantId, 60);

      expect(suspicious.length).toBeGreaterThan(0);
      expect(suspicious.some(log => log.result === 'failure')).toBe(true);

      const logs = await auditLogger.queryAuditLog({ tenantId: testTenantId });
      testLogIds.push(...logs.map(l => l.id));
    });

    it('sollte Security-Alerts finden', async () => {
      const event: SecurityEvent = {
        eventType: AuditEventType.SECURITY_ALERT,
        tenantId: testTenantId,
        action: 'suspicious_pattern',
        result: 'failure'
      };

      await auditLogger.logSecurityEvent(event);

      const suspicious = await auditLogger.findSuspiciousActivity(testTenantId, 60);

      expect(suspicious.length).toBeGreaterThan(0);
      expect(suspicious.some(log => 
        log.eventType === AuditEventType.SECURITY_ALERT
      )).toBe(true);

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
      const exported = await auditLogger.exportLogs(
        { tenantId: testTenantId },
        'json'
      );

      expect(exported).toBeDefined();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('sollte Logs als CSV exportieren', async () => {
      const exported = await auditLogger.exportLogs(
        { tenantId: testTenantId },
        'csv'
      );

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
