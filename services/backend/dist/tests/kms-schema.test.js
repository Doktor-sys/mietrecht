"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
describe('KMS Database Schema Tests', () => {
    let prisma;
    beforeAll(() => {
        prisma = new client_1.PrismaClient();
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('EncryptionKey Model', () => {
        it('sollte EncryptionKey-Tabelle mit allen Feldern haben', async () => {
            // Dieser Test überprüft, ob das Schema korrekt ist
            const tableInfo = await prisma.$queryRaw `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'encryption_keys'
        ORDER BY ordinal_position;
      `;
            expect(tableInfo).toBeDefined();
            // Erwartete Spalten
            const expectedColumns = [
                'id', 'tenantId', 'purpose', 'algorithm', 'encryptedKey',
                'iv', 'authTag', 'version', 'status', 'expiresAt',
                'lastUsedAt', 'createdAt', 'updatedAt', 'metadata'
            ];
            const actualColumns = tableInfo.map(col => col.column_name);
            expectedColumns.forEach(col => {
                expect(actualColumns).toContain(col);
            });
        });
        it('sollte Indizes für Performance-Optimierung haben', async () => {
            const indexes = await prisma.$queryRaw `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'encryption_keys';
      `;
            expect(indexes).toBeDefined();
            const indexNames = indexes.map(idx => idx.indexname);
            // Erwartete Indizes
            expect(indexNames).toContain('encryption_keys_tenantId_status_idx');
            expect(indexNames).toContain('encryption_keys_status_idx');
            expect(indexNames).toContain('encryption_keys_expiresAt_idx');
            expect(indexNames).toContain('encryption_keys_purpose_idx');
        });
        it('sollte Unique Constraint für tenantId, purpose, version haben', async () => {
            const constraints = await prisma.$queryRaw `
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'encryption_keys'
        AND constraint_type = 'UNIQUE';
      `;
            expect(constraints).toBeDefined();
            const constraintNames = constraints.map(c => c.constraint_name);
            expect(constraintNames).toContain('encryption_keys_tenantId_purpose_version_key');
        });
    });
    describe('RotationSchedule Model', () => {
        it('sollte RotationSchedule-Tabelle mit allen Feldern haben', async () => {
            const tableInfo = await prisma.$queryRaw `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'rotation_schedules'
        ORDER BY ordinal_position;
      `;
            expect(tableInfo).toBeDefined();
            const expectedColumns = [
                'id', 'keyId', 'enabled', 'intervalDays', 'nextRotationAt',
                'lastRotationAt', 'createdAt', 'updatedAt'
            ];
            const actualColumns = tableInfo.map(col => col.column_name);
            expectedColumns.forEach(col => {
                expect(actualColumns).toContain(col);
            });
        });
        it('sollte Foreign Key zu encryption_keys haben', async () => {
            const foreignKeys = await prisma.$queryRaw `
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'rotation_schedules'
        AND tc.constraint_type = 'FOREIGN KEY';
      `;
            expect(foreignKeys).toBeDefined();
            expect(foreignKeys.length).toBeGreaterThan(0);
            const fk = foreignKeys[0];
            expect(fk.column_name).toBe('keyId');
            expect(fk.foreign_table_name).toBe('encryption_keys');
        });
    });
    describe('KeyAuditLog Model', () => {
        it('sollte KeyAuditLog-Tabelle mit allen Feldern haben', async () => {
            const tableInfo = await prisma.$queryRaw `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'key_audit_logs'
        ORDER BY ordinal_position;
      `;
            expect(tableInfo).toBeDefined();
            const expectedColumns = [
                'id', 'keyId', 'tenantId', 'eventType', 'action', 'result',
                'serviceId', 'userId', 'ipAddress', 'metadata', 'hmacSignature', 'timestamp'
            ];
            const actualColumns = tableInfo.map(col => col.column_name);
            expectedColumns.forEach(col => {
                expect(actualColumns).toContain(col);
            });
        });
        it('sollte Indizes für Audit-Abfragen haben', async () => {
            const indexes = await prisma.$queryRaw `
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'key_audit_logs';
      `;
            expect(indexes).toBeDefined();
            const indexNames = indexes.map(idx => idx.indexname);
            // Erwartete Indizes für effiziente Audit-Abfragen
            expect(indexNames).toContain('key_audit_logs_keyId_timestamp_idx');
            expect(indexNames).toContain('key_audit_logs_tenantId_timestamp_idx');
            expect(indexNames).toContain('key_audit_logs_eventType_timestamp_idx');
            expect(indexNames).toContain('key_audit_logs_timestamp_idx');
        });
    });
    describe('MasterKeyConfig Model', () => {
        it('sollte MasterKeyConfig-Tabelle mit allen Feldern haben', async () => {
            const tableInfo = await prisma.$queryRaw `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'master_key_config'
        ORDER BY ordinal_position;
      `;
            expect(tableInfo).toBeDefined();
            const expectedColumns = [
                'id', 'version', 'algorithm', 'rotatedAt', 'createdAt', 'updatedAt'
            ];
            const actualColumns = tableInfo.map(col => col.column_name);
            expectedColumns.forEach(col => {
                expect(actualColumns).toContain(col);
            });
        });
    });
    describe('CRUD Operations', () => {
        const testTenantId = 'test-tenant-' + Date.now();
        let testKeyId;
        afterEach(async () => {
            // Cleanup
            if (testKeyId) {
                await prisma.encryptionKey.deleteMany({
                    where: { tenantId: testTenantId }
                });
            }
        });
        it('sollte einen neuen Encryption Key erstellen können', async () => {
            const key = await prisma.encryptionKey.create({
                data: {
                    tenantId: testTenantId,
                    purpose: 'data_encryption',
                    algorithm: 'aes-256-gcm',
                    encryptedKey: 'encrypted_key_data',
                    iv: 'initialization_vector',
                    authTag: 'auth_tag',
                    version: 1,
                    status: 'active'
                }
            });
            expect(key).toBeDefined();
            expect(key.id).toBeDefined();
            expect(key.tenantId).toBe(testTenantId);
            expect(key.purpose).toBe('data_encryption');
            expect(key.status).toBe('active');
            testKeyId = key.id;
        });
        it('sollte Encryption Key mit Rotation Schedule erstellen können', async () => {
            const key = await prisma.encryptionKey.create({
                data: {
                    tenantId: testTenantId,
                    purpose: 'document_encryption',
                    algorithm: 'aes-256-gcm',
                    encryptedKey: 'encrypted_key_data',
                    iv: 'initialization_vector',
                    authTag: 'auth_tag',
                    version: 1,
                    status: 'active',
                    rotationSchedule: {
                        create: {
                            enabled: true,
                            intervalDays: 90,
                            nextRotationAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                        }
                    }
                },
                include: {
                    rotationSchedule: true
                }
            });
            expect(key).toBeDefined();
            expect(key.rotationSchedule).toBeDefined();
            expect(key.rotationSchedule?.intervalDays).toBe(90);
            testKeyId = key.id;
        });
        it('sollte Audit Log für Key-Operationen erstellen können', async () => {
            const key = await prisma.encryptionKey.create({
                data: {
                    tenantId: testTenantId,
                    purpose: 'field_encryption',
                    algorithm: 'aes-256-gcm',
                    encryptedKey: 'encrypted_key_data',
                    iv: 'initialization_vector',
                    authTag: 'auth_tag',
                    version: 1,
                    status: 'active'
                }
            });
            testKeyId = key.id;
            const auditLog = await prisma.keyAuditLog.create({
                data: {
                    keyId: key.id,
                    tenantId: testTenantId,
                    eventType: 'key_created',
                    action: 'CREATE_KEY',
                    result: 'success',
                    serviceId: 'kms-service',
                    hmacSignature: 'hmac_signature_value'
                }
            });
            expect(auditLog).toBeDefined();
            expect(auditLog.keyId).toBe(key.id);
            expect(auditLog.eventType).toBe('key_created');
            expect(auditLog.result).toBe('success');
        });
        it('sollte Keys nach tenantId und status abfragen können', async () => {
            // Erstelle mehrere Keys
            await prisma.encryptionKey.createMany({
                data: [
                    {
                        tenantId: testTenantId,
                        purpose: 'data_encryption',
                        algorithm: 'aes-256-gcm',
                        encryptedKey: 'key1',
                        iv: 'iv1',
                        authTag: 'tag1',
                        version: 1,
                        status: 'active'
                    },
                    {
                        tenantId: testTenantId,
                        purpose: 'document_encryption',
                        algorithm: 'aes-256-gcm',
                        encryptedKey: 'key2',
                        iv: 'iv2',
                        authTag: 'tag2',
                        version: 1,
                        status: 'deprecated'
                    }
                ]
            });
            const activeKeys = await prisma.encryptionKey.findMany({
                where: {
                    tenantId: testTenantId,
                    status: 'active'
                }
            });
            expect(activeKeys.length).toBeGreaterThan(0);
            activeKeys.forEach(key => {
                expect(key.status).toBe('active');
                expect(key.tenantId).toBe(testTenantId);
            });
        });
        it('sollte Unique Constraint für tenantId, purpose, version erzwingen', async () => {
            await prisma.encryptionKey.create({
                data: {
                    tenantId: testTenantId,
                    purpose: 'test_encryption',
                    algorithm: 'aes-256-gcm',
                    encryptedKey: 'key1',
                    iv: 'iv1',
                    authTag: 'tag1',
                    version: 1,
                    status: 'active'
                }
            });
            // Versuch, denselben Key nochmal zu erstellen sollte fehlschlagen
            await expect(prisma.encryptionKey.create({
                data: {
                    tenantId: testTenantId,
                    purpose: 'test_encryption',
                    algorithm: 'aes-256-gcm',
                    encryptedKey: 'key2',
                    iv: 'iv2',
                    authTag: 'tag2',
                    version: 1, // Gleiche Version
                    status: 'active'
                }
            })).rejects.toThrow();
        });
    });
    describe('Performance Tests', () => {
        const testTenantId = 'perf-test-tenant-' + Date.now();
        afterAll(async () => {
            await prisma.encryptionKey.deleteMany({
                where: { tenantId: testTenantId }
            });
        });
        it('sollte Keys effizient nach Index abfragen können', async () => {
            // Erstelle mehrere Keys
            const keys = [];
            for (let i = 0; i < 10; i++) {
                keys.push({
                    tenantId: testTenantId,
                    purpose: `purpose_${i}`,
                    algorithm: 'aes-256-gcm',
                    encryptedKey: `key_${i}`,
                    iv: `iv_${i}`,
                    authTag: `tag_${i}`,
                    version: 1,
                    status: i % 2 === 0 ? 'active' : 'deprecated'
                });
            }
            await prisma.encryptionKey.createMany({ data: keys });
            // Abfrage mit Index
            const startTime = Date.now();
            const result = await prisma.encryptionKey.findMany({
                where: {
                    tenantId: testTenantId,
                    status: 'active'
                }
            });
            const queryTime = Date.now() - startTime;
            expect(result.length).toBe(5);
            expect(queryTime).toBeLessThan(100); // Sollte schnell sein mit Index
        });
    });
});
