"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LegalDataImportService_1 = require("../services/LegalDataImportService");
// Mock Prisma
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(),
    LegalType: {
        LAW: 'LAW',
        COURT_DECISION: 'COURT_DECISION',
        REGULATION: 'REGULATION'
    }
}));
// Mock Logger
jest.mock('../utils/logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
    },
    loggers: {
        businessEvent: jest.fn(),
    },
}));
describe('LegalDataImportService Unit Tests', () => {
    let service;
    let prismaMock;
    beforeEach(() => {
        prismaMock = {
            legalKnowledge: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                deleteMany: jest.fn(),
                count: jest.fn(),
                groupBy: jest.fn(),
            },
        };
        service = new LegalDataImportService_1.LegalDataImportService(prismaMock);
    });
    describe('Validierung', () => {
        it('sollte gültige Import-Daten akzeptieren', async () => {
            const validData = [
                {
                    type: 'LAW',
                    reference: '§ 536 BGB',
                    title: 'Mietminderung',
                    content: 'Inhalt...',
                    jurisdiction: 'Deutschland',
                    effectiveDate: new Date('2002-01-01'),
                    tags: ['BGB', 'Mietrecht']
                }
            ];
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(null);
            prismaMock.legalKnowledge.create.mockResolvedValue({});
            const result = await service.importLegalData(validData, {
                validateOnly: false
            });
            expect(result.success).toBe(true);
            expect(result.imported).toBe(1);
            expect(result.failed).toBe(0);
        });
        it('sollte Fehler für fehlende Referenz werfen', async () => {
            const invalidData = [
                {
                    type: 'LAW',
                    reference: '',
                    title: 'Test',
                    content: 'Inhalt',
                    jurisdiction: 'Deutschland',
                    effectiveDate: new Date(),
                    tags: []
                }
            ];
            const result = await service.importLegalData(invalidData);
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].error).toContain('Referenz ist erforderlich');
        });
        it('sollte Fehler für fehlenden Titel werfen', async () => {
            const invalidData = [
                {
                    type: 'LAW',
                    reference: '§ 536 BGB',
                    title: '',
                    content: 'Inhalt',
                    jurisdiction: 'Deutschland',
                    effectiveDate: new Date(),
                    tags: []
                }
            ];
            const result = await service.importLegalData(invalidData);
            expect(result.success).toBe(false);
            expect(result.errors[0].error).toContain('Titel ist erforderlich');
        });
        it('sollte Fehler für ungültigen Typ werfen', async () => {
            const invalidData = [
                {
                    type: 'INVALID_TYPE',
                    reference: '§ 536 BGB',
                    title: 'Test',
                    content: 'Inhalt',
                    jurisdiction: 'Deutschland',
                    effectiveDate: new Date(),
                    tags: []
                }
            ];
            const result = await service.importLegalData(invalidData);
            expect(result.success).toBe(false);
            expect(result.errors[0].error).toContain('Ungültiger Typ');
        });
    });
    describe('BGB-Import', () => {
        it('sollte BGB-Paragraphen korrekt importieren', async () => {
            const paragraphs = [
                {
                    paragraph: '536',
                    title: 'Minderung der Miete',
                    content: 'Inhalt des Paragraphen...',
                    book: 'Buch 2',
                    section: 'Mietrecht'
                }
            ];
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(null);
            prismaMock.legalKnowledge.create.mockResolvedValue({});
            const result = await service.importBGBParagraphs(paragraphs);
            expect(result.success).toBe(true);
            expect(result.imported).toBe(1);
            expect(prismaMock.legalKnowledge.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    reference: '§ 536 BGB',
                    type: 'LAW'
                })
            }));
        });
    });
    describe('Gerichtsentscheidungen-Import', () => {
        it('sollte Gerichtsentscheidungen korrekt importieren', async () => {
            const decisions = [
                {
                    court: 'BGH',
                    fileNumber: 'VIII ZR 123/23',
                    date: new Date('2023-05-15'),
                    title: 'Mietminderung bei Heizungsausfall',
                    summary: 'Zusammenfassung...',
                    keywords: ['Mietminderung', 'Heizung']
                }
            ];
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(null);
            prismaMock.legalKnowledge.create.mockResolvedValue({});
            const result = await service.importCourtDecisions(decisions);
            expect(result.success).toBe(true);
            expect(result.imported).toBe(1);
            expect(prismaMock.legalKnowledge.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    reference: 'BGH VIII ZR 123/23',
                    type: 'COURT_DECISION'
                })
            }));
        });
    });
    describe('Update-Funktionalität', () => {
        it('sollte bestehende Daten aktualisieren', async () => {
            const existingData = {
                id: '1',
                reference: '§ 536 BGB',
                title: 'Alter Titel',
                content: 'Alter Inhalt'
            };
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(existingData);
            prismaMock.legalKnowledge.update.mockResolvedValue({
                ...existingData,
                title: 'Neuer Titel'
            });
            const result = await service.updateLegalData('§ 536 BGB', {
                title: 'Neuer Titel'
            });
            expect(result.title).toBe('Neuer Titel');
            expect(prismaMock.legalKnowledge.update).toHaveBeenCalled();
        });
        it('sollte Fehler werfen wenn Daten nicht gefunden werden', async () => {
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(null);
            await expect(service.updateLegalData('§ 999 BGB', { title: 'Test' })).rejects.toThrow('nicht gefunden');
        });
    });
    describe('Duplikate', () => {
        it('sollte Duplikate finden', async () => {
            prismaMock.legalKnowledge.groupBy.mockResolvedValue([
                {
                    reference: '§ 536 BGB',
                    _count: { reference: 2 }
                }
            ]);
            const duplicates = await service.findDuplicates();
            expect(duplicates.length).toBe(1);
            expect(duplicates[0].reference).toBe('§ 536 BGB');
            expect(duplicates[0].count).toBe(2);
        });
        it('sollte Duplikate bereinigen', async () => {
            const duplicateEntries = [
                {
                    id: '1',
                    reference: '§ 536 BGB',
                    lastUpdated: new Date('2023-01-01')
                },
                {
                    id: '2',
                    reference: '§ 536 BGB',
                    lastUpdated: new Date('2024-01-01')
                }
            ];
            prismaMock.legalKnowledge.groupBy.mockResolvedValue([
                {
                    reference: '§ 536 BGB',
                    _count: { reference: 2 }
                }
            ]);
            prismaMock.legalKnowledge.findMany.mockResolvedValue(duplicateEntries);
            prismaMock.legalKnowledge.delete.mockResolvedValue({});
            const cleaned = await service.cleanupDuplicates();
            expect(cleaned).toBe(1); // Nur ältere Version gelöscht
            expect(prismaMock.legalKnowledge.delete).toHaveBeenCalledWith({
                where: { id: '1' }
            });
        });
    });
    describe('Statistiken', () => {
        it('sollte Statistiken korrekt berechnen', async () => {
            prismaMock.legalKnowledge.count.mockResolvedValue(100);
            prismaMock.legalKnowledge.groupBy.mockResolvedValue([
                { type: 'LAW', _count: { type: 60 } },
                { type: 'COURT_DECISION', _count: { type: 30 } },
                { type: 'REGULATION', _count: { type: 10 } }
            ]);
            prismaMock.legalKnowledge.findFirst
                .mockResolvedValueOnce({ effectiveDate: new Date('2000-01-01') })
                .mockResolvedValueOnce({ effectiveDate: new Date('2024-01-01') });
            const stats = await service.getStatistics();
            expect(stats.total).toBe(100);
            expect(stats.byType.LAW).toBe(60);
            expect(stats.byType.COURT_DECISION).toBe(30);
            expect(stats.byType.REGULATION).toBe(10);
            expect(stats.oldestEntry).toBeDefined();
            expect(stats.newestEntry).toBeDefined();
        });
    });
    describe('Batch-Verarbeitung', () => {
        it('sollte große Datenmengen in Batches verarbeiten', async () => {
            const largeDataset = Array.from({ length: 250 }, (_, i) => ({
                type: 'LAW',
                reference: `§ ${i + 1} BGB`,
                title: `Paragraph ${i + 1}`,
                content: 'Inhalt...',
                jurisdiction: 'Deutschland',
                effectiveDate: new Date(),
                tags: ['BGB']
            }));
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(null);
            prismaMock.legalKnowledge.create.mockResolvedValue({});
            const result = await service.importLegalData(largeDataset, {
                batchSize: 100
            });
            expect(result.success).toBe(true);
            expect(result.imported).toBe(250);
            // Sollte in 3 Batches verarbeitet werden (100, 100, 50)
        });
    });
    describe('Optionen', () => {
        it('sollte Duplikate überspringen wenn skipDuplicates=true', async () => {
            const data = [
                {
                    type: 'LAW',
                    reference: '§ 536 BGB',
                    title: 'Test',
                    content: 'Inhalt',
                    jurisdiction: 'Deutschland',
                    effectiveDate: new Date(),
                    tags: []
                }
            ];
            prismaMock.legalKnowledge.findUnique.mockResolvedValue({ id: '1' });
            const result = await service.importLegalData(data, {
                skipDuplicates: true,
                updateExisting: false
            });
            expect(result.imported).toBe(0);
            expect(result.updated).toBe(0);
            expect(prismaMock.legalKnowledge.create).not.toHaveBeenCalled();
            expect(prismaMock.legalKnowledge.update).not.toHaveBeenCalled();
        });
        it('sollte nur validieren wenn validateOnly=true', async () => {
            const data = [
                {
                    type: 'LAW',
                    reference: '§ 536 BGB',
                    title: 'Test',
                    content: 'Inhalt',
                    jurisdiction: 'Deutschland',
                    effectiveDate: new Date(),
                    tags: []
                }
            ];
            const result = await service.importLegalData(data, {
                validateOnly: true
            });
            expect(result.success).toBe(true);
            expect(result.imported).toBe(0);
            expect(prismaMock.legalKnowledge.create).not.toHaveBeenCalled();
        });
    });
});
