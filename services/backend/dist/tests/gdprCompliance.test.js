"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GDPRComplianceService_1 = require("../services/GDPRComplianceService");
const database_1 = require("../config/database");
const EncryptionService_1 = require("../services/EncryptionService");
jest.mock('../config/database');
jest.mock('../services/EncryptionService');
describe('GDPRComplianceService', () => {
    let gdprService;
    let mockEncryptionService;
    beforeEach(() => {
        mockEncryptionService = new EncryptionService_1.EncryptionService();
        gdprService = new GDPRComplianceService_1.GDPRComplianceService(mockEncryptionService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('exportUserData', () => {
        it('sollte alle Nutzerdaten exportieren (Recht auf Auskunft)', async () => {
            const userId = 'user-123';
            const mockUser = {
                id: userId,
                email: 'test@example.com',
                profile: { firstName: 'Max', lastName: 'Mustermann' },
                createdAt: new Date(),
            };
            const mockConversations = [
                { id: 'conv-1', title: 'Heizungsausfall', messages: [] },
            ];
            const mockDocuments = [
                { id: 'doc-1', filename: 'mietvertrag.pdf', uploadedAt: new Date() },
            ];
            database_1.prisma.user.findUnique.mockResolvedValue(mockUser);
            database_1.prisma.conversation.findMany.mockResolvedValue(mockConversations);
            database_1.prisma.document.findMany.mockResolvedValue(mockDocuments);
            const result = await gdprService.exportUserData(userId);
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('conversations');
            expect(result).toHaveProperty('documents');
            expect(result.user.email).toBe('test@example.com');
            expect(result.conversations).toHaveLength(1);
            expect(result.documents).toHaveLength(1);
        });
        it('sollte Fehler werfen wenn Nutzer nicht existiert', async () => {
            database_1.prisma.user.findUnique.mockResolvedValue(null);
            await expect(gdprService.exportUserData('non-existent')).rejects.toThrow('Nutzer nicht gefunden');
        });
    });
    describe('deleteUserData', () => {
        it('sollte alle Nutzerdaten vollständig löschen (Recht auf Löschung)', async () => {
            const userId = 'user-123';
            database_1.prisma.user.findUnique.mockResolvedValue({ id: userId });
            database_1.prisma.$transaction.mockImplementation(async (callback) => {
                return callback(database_1.prisma);
            });
            const result = await gdprService.deleteUserData(userId);
            expect(result.success).toBe(true);
            expect(result.deletedRecords).toHaveProperty('messages');
            expect(result.deletedRecords).toHaveProperty('conversations');
            expect(result.deletedRecords).toHaveProperty('documents');
            expect(result.deletedRecords).toHaveProperty('user');
        });
        it('sollte auch verschlüsselte Daten löschen', async () => {
            const userId = 'user-123';
            database_1.prisma.user.findUnique.mockResolvedValue({ id: userId });
            database_1.prisma.document.findMany.mockResolvedValue([
                { id: 'doc-1', encryptedPath: '/encrypted/doc1' },
            ]);
            await gdprService.deleteUserData(userId);
            expect(mockEncryptionService.deleteEncryptedFile).toHaveBeenCalled();
        });
    });
    describe('updateConsent', () => {
        it('sollte Einwilligungen granular verwalten', async () => {
            const userId = 'user-123';
            const consents = {
                dataProcessing: true,
                marketing: false,
                analytics: true,
            };
            database_1.prisma.userConsent.upsert.mockResolvedValue({
                userId,
                ...consents,
                updatedAt: new Date(),
            });
            const result = await gdprService.updateConsent(userId, consents);
            expect(result.dataProcessing).toBe(true);
            expect(result.marketing).toBe(false);
            expect(result.analytics).toBe(true);
        });
    });
    describe('getConsentStatus', () => {
        it('sollte aktuellen Einwilligungsstatus abrufen', async () => {
            const userId = 'user-123';
            const mockConsent = {
                userId,
                dataProcessing: true,
                marketing: false,
                analytics: true,
                updatedAt: new Date(),
            };
            database_1.prisma.userConsent.findUnique.mockResolvedValue(mockConsent);
            const result = await gdprService.getConsentStatus(userId);
            expect(result).toEqual(mockConsent);
        });
    });
    describe('anonymizeUserData', () => {
        it('sollte Nutzerdaten anonymisieren statt löschen', async () => {
            const userId = 'user-123';
            database_1.prisma.user.update.mockResolvedValue({
                id: userId,
                email: 'anonymized@example.com',
                profile: null,
            });
            const result = await gdprService.anonymizeUserData(userId);
            expect(result.success).toBe(true);
            expect(database_1.prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: expect.objectContaining({
                    email: expect.stringContaining('anonymized'),
                }),
            });
        });
    });
    describe('generateDataPortabilityExport', () => {
        it('sollte Daten in maschinenlesbarem Format exportieren', async () => {
            const userId = 'user-123';
            const mockData = {
                user: { id: userId, email: 'test@example.com' },
                conversations: [],
                documents: [],
            };
            database_1.prisma.user.findUnique.mockResolvedValue(mockData.user);
            database_1.prisma.conversation.findMany.mockResolvedValue(mockData.conversations);
            database_1.prisma.document.findMany.mockResolvedValue(mockData.documents);
            const result = await gdprService.generateDataPortabilityExport(userId);
            expect(result.format).toBe('JSON');
            expect(result.data).toHaveProperty('user');
            expect(typeof result.data).toBe('object');
        });
    });
});
