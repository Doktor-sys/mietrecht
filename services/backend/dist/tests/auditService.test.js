"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuditService_1 = require("../services/AuditService");
const database_1 = require("../config/database");
jest.mock('../config/database');
describe('AuditService', () => {
    let auditService;
    beforeEach(() => {
        auditService = new AuditService_1.AuditService();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('logAuditEvent', () => {
        it('sollte Audit-Ereignis mit allen Details protokollieren', async () => {
            const auditEvent = {
                userId: 'user-123',
                action: 'document_access',
                resourceType: 'document',
                resourceId: 'doc-456',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                details: { operation: 'read' },
                timestamp: new Date(),
            };
            database_1.prisma.auditLog.create.mockResolvedValue({
                id: 'audit-123',
                ...auditEvent,
            });
            const result = await auditService.logAuditEvent(auditEvent);
            expect(result.id).toBe('audit-123');
            expect(database_1.prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: auditEvent.userId,
                    action: auditEvent.action,
                    resourceType: auditEvent.resourceType,
                }),
            });
        });
        it('sollte DSGVO-relevante Aktionen markieren', async () => {
            const gdprEvent = {
                userId: 'user-123',
                action: 'data_export',
                resourceType: 'user_data',
                resourceId: 'user-123',
                timestamp: new Date(),
            };
            database_1.prisma.auditLog.create.mockResolvedValue({
                ...gdprEvent,
                isGDPRRelevant: true,
            });
            const result = await auditService.logAuditEvent(gdprEvent);
            expect(result.isGDPRRelevant).toBe(true);
        });
    });
    describe('queryAuditLogs', () => {
        it('sollte Audit-Logs nach Nutzer filtern', async () => {
            const userId = 'user-123';
            const mockLogs = [
                { id: 'log-1', userId, action: 'login', timestamp: new Date() },
                { id: 'log-2', userId, action: 'document_access', timestamp: new Date() },
            ];
            database_1.prisma.auditLog.findMany.mockResolvedValue(mockLogs);
            const result = await auditService.queryAuditLogs({ userId });
            expect(result).toHaveLength(2);
            expect(database_1.prisma.auditLog.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { timestamp: 'desc' },
            });
        });
        it('sollte Audit-Logs nach Zeitraum filtern', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const mockLogs = [
                { id: 'log-1', action: 'login', timestamp: new Date('2024-01-15') },
            ];
            database_1.prisma.auditLog.findMany.mockResolvedValue(mockLogs);
            const result = await auditService.queryAuditLogs({
                startDate,
                endDate,
            });
            expect(result).toHaveLength(1);
            expect(database_1.prisma.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { timestamp: 'desc' },
            });
        });
        it('sollte Audit-Logs nach Aktion filtern', async () => {
            const action = 'document_delete';
            const mockLogs = [
                { id: 'log-1', action, timestamp: new Date() },
            ];
            database_1.prisma.auditLog.findMany.mockResolvedValue(mockLogs);
            const result = await auditService.queryAuditLogs({ action });
            expect(result).toHaveLength(1);
            expect(result[0].action).toBe(action);
        });
    });
    describe('getAuditTrail', () => {
        it('sollte vollständigen Audit-Trail für Ressource abrufen', async () => {
            const resourceId = 'doc-456';
            const resourceType = 'document';
            const mockTrail = [
                { id: 'log-1', action: 'create', timestamp: new Date('2024-01-01') },
                { id: 'log-2', action: 'update', timestamp: new Date('2024-01-02') },
                { id: 'log-3', action: 'access', timestamp: new Date('2024-01-03') },
            ];
            database_1.prisma.auditLog.findMany.mockResolvedValue(mockTrail);
            const result = await auditService.getAuditTrail(resourceId, resourceType);
            expect(result).toHaveLength(3);
            expect(result[0].action).toBe('create');
            expect(result[2].action).toBe('access');
        });
    });
    describe('generateComplianceReport', () => {
        it('sollte DSGVO-Compliance-Bericht generieren', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const mockGDPRLogs = [
                { action: 'data_export', userId: 'user-1', timestamp: new Date() },
                { action: 'data_deletion', userId: 'user-2', timestamp: new Date() },
                { action: 'consent_update', userId: 'user-3', timestamp: new Date() },
            ];
            database_1.prisma.auditLog.findMany.mockResolvedValue(mockGDPRLogs);
            const report = await auditService.generateComplianceReport(startDate, endDate);
            expect(report).toHaveProperty('totalGDPREvents');
            expect(report).toHaveProperty('dataExportRequests');
            expect(report).toHaveProperty('dataDeletionRequests');
            expect(report).toHaveProperty('consentUpdates');
            expect(report.totalGDPREvents).toBe(3);
        });
    });
    describe('detectUnauthorizedAccess', () => {
        it('sollte unberechtigte Zugriffe erkennen', async () => {
            const userId = 'user-123';
            const mockUnauthorizedLogs = [
                {
                    id: 'log-1',
                    userId,
                    action: 'access_denied',
                    resourceType: 'admin_panel',
                    timestamp: new Date(),
                },
            ];
            database_1.prisma.auditLog.findMany.mockResolvedValue(mockUnauthorizedLogs);
            const result = await auditService.detectUnauthorizedAccess(userId);
            expect(result).toHaveLength(1);
            expect(result[0].action).toBe('access_denied');
        });
    });
    describe('archiveOldLogs', () => {
        it('sollte alte Logs archivieren', async () => {
            const retentionDays = 90;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            database_1.prisma.auditLog.updateMany.mockResolvedValue({ count: 150 });
            const result = await auditService.archiveOldLogs(retentionDays);
            expect(result.archivedCount).toBe(150);
            expect(database_1.prisma.auditLog.updateMany).toHaveBeenCalledWith({
                where: {
                    timestamp: { lt: expect.any(Date) },
                    archived: false,
                },
                data: { archived: true },
            });
        });
    });
    describe('verifyAuditIntegrity', () => {
        it('sollte Integrität der Audit-Logs überprüfen', async () => {
            const mockLogs = [
                { id: 'log-1', checksum: 'abc123', data: 'test1' },
                { id: 'log-2', checksum: 'def456', data: 'test2' },
            ];
            database_1.prisma.auditLog.findMany.mockResolvedValue(mockLogs);
            const result = await auditService.verifyAuditIntegrity();
            expect(result.totalChecked).toBe(2);
            expect(result).toHaveProperty('integrityViolations');
        });
    });
});
