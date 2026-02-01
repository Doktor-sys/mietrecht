"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const DocumentGeneratorService_1 = require("../services/DocumentGeneratorService");
jest.mock('../utils/logger');
jest.mock('../services/TemplateService');
describe('DocumentGeneratorService', () => {
    let prisma;
    let service;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        service = new DocumentGeneratorService_1.DocumentGeneratorService(prisma);
        jest.clearAllMocks();
    });
    afterEach(async () => {
        await prisma.$disconnect();
    });
    const mockGeneratedTemplate = {
        id: 'gen-1',
        templateId: 'template-1',
        templateName: 'Mietminderungsschreiben',
        category: 'RENT_REDUCTION',
        content: `Max Mustermann
Musterstraße 1, 12345 Berlin

Erika Musterfrau
Vermietergasse 10, 12345 Berlin

15.12.2024

Betreff: Mietminderung

Sehr geehrte Frau Musterfrau,

hiermit zeige ich einen Mangel an der Heizung an.

Mit freundlichen Grüßen
Max Mustermann`,
        instructions: [
            '1. Versenden Sie das Schreiben per Einschreiben',
            '2. Bewahren Sie eine Kopie auf',
            '3. Dokumentieren Sie den Mangel mit Fotos'
        ],
        legalNotes: [
            'Rechtliche Grundlage: § 536 BGB',
            'Dies ersetzt keine Rechtsberatung'
        ],
        generatedAt: new Date('2024-12-15T10:00:00Z')
    };
    describe('generatePDF', () => {
        it('should generate PDF with default options', async () => {
            const pdf = await service.generatePDF(mockGeneratedTemplate);
            expect(pdf.buffer).toBeInstanceOf(Buffer);
            expect(pdf.buffer.length).toBeGreaterThan(0);
            expect(pdf.filename).toContain('mietminderungsschreiben');
            expect(pdf.filename).toContain('2024-12-15');
            expect(pdf.filename).toEndWith('.pdf');
            expect(pdf.mimeType).toBe('application/pdf');
            expect(pdf.size).toBe(pdf.buffer.length);
        });
        it('should generate PDF without instructions', async () => {
            const pdf = await service.generatePDF(mockGeneratedTemplate, {
                includeInstructions: false
            });
            expect(pdf.buffer).toBeInstanceOf(Buffer);
            expect(pdf.size).toBeLessThan((await service.generatePDF(mockGeneratedTemplate)).size);
        });
        it('should generate PDF without legal notes', async () => {
            const pdf = await service.generatePDF(mockGeneratedTemplate, {
                includeLegalNotes: false
            });
            expect(pdf.buffer).toBeInstanceOf(Buffer);
            expect(pdf.size).toBeGreaterThan(0);
        });
        it('should generate PDF with custom font size', async () => {
            const pdf = await service.generatePDF(mockGeneratedTemplate, {
                fontSize: 14
            });
            expect(pdf.buffer).toBeInstanceOf(Buffer);
            expect(pdf.size).toBeGreaterThan(0);
        });
        it('should generate PDF with LETTER page size', async () => {
            const pdf = await service.generatePDF(mockGeneratedTemplate, {
                pageSize: 'LETTER'
            });
            expect(pdf.buffer).toBeInstanceOf(Buffer);
            expect(pdf.size).toBeGreaterThan(0);
        });
    });
    describe('generatePreview', () => {
        it('should generate document preview', async () => {
            const mockTemplateService = service['templateService'];
            jest.spyOn(mockTemplateService, 'generateDocument').mockResolvedValue(mockGeneratedTemplate);
            const preview = await service.generatePreview('template-1', { tenantName: 'Max Mustermann' }, 'user-1');
            expect(preview.content).toBe(mockGeneratedTemplate.content);
            expect(preview.instructions).toEqual(mockGeneratedTemplate.instructions);
            expect(preview.legalNotes).toEqual(mockGeneratedTemplate.legalNotes);
            expect(preview.metadata.templateName).toBe('Mietminderungsschreiben');
            expect(preview.metadata.category).toBe('RENT_REDUCTION');
        });
    });
    describe('exportAsText', () => {
        it('should export document as text with metadata', async () => {
            const result = await service.exportAsText(mockGeneratedTemplate, true);
            expect(result.buffer).toBeInstanceOf(Buffer);
            expect(result.filename).toContain('.txt');
            const content = result.buffer.toString('utf-8');
            expect(content).toContain('Mietminderungsschreiben');
            expect(content).toContain('Max Mustermann');
            expect(content).toContain('ANWEISUNGEN ZUR VERWENDUNG');
            expect(content).toContain('RECHTLICHE HINWEISE');
        });
        it('should export document as text without metadata', async () => {
            const result = await service.exportAsText(mockGeneratedTemplate, false);
            const content = result.buffer.toString('utf-8');
            expect(content).toContain('Max Mustermann');
            expect(content).not.toContain('Generiert am:');
        });
    });
    describe('generateBatchPDFs', () => {
        it('should generate multiple PDFs successfully', async () => {
            const mockTemplateService = service['templateService'];
            jest.spyOn(mockTemplateService, 'generateDocument').mockResolvedValue(mockGeneratedTemplate);
            const requests = [
                {
                    templateId: 'template-1',
                    data: { tenantName: 'User 1' },
                    userId: 'user-1'
                },
                {
                    templateId: 'template-2',
                    data: { tenantName: 'User 2' },
                    userId: 'user-2'
                }
            ];
            const results = await service.generateBatchPDFs(requests);
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[0].pdf).toBeDefined();
            expect(results[1].success).toBe(true);
            expect(results[1].pdf).toBeDefined();
        });
        it('should handle errors in batch generation', async () => {
            const mockTemplateService = service['templateService'];
            jest
                .spyOn(mockTemplateService, 'generateDocument')
                .mockRejectedValueOnce(new Error('Template not found'))
                .mockResolvedValueOnce(mockGeneratedTemplate);
            const requests = [
                {
                    templateId: 'invalid',
                    data: {},
                    userId: 'user-1'
                },
                {
                    templateId: 'template-1',
                    data: { tenantName: 'User 2' },
                    userId: 'user-2'
                }
            ];
            const results = await service.generateBatchPDFs(requests);
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toBe('Template not found');
            expect(results[1].success).toBe(true);
            expect(results[1].pdf).toBeDefined();
        });
    });
    describe('filename generation', () => {
        it('should generate safe filenames', async () => {
            const template = {
                ...mockGeneratedTemplate,
                templateName: 'Widerspruch gegen Mieterhöhung (§558 BGB)',
                generatedAt: new Date('2024-01-15')
            };
            const pdf = await service.generatePDF(template);
            expect(pdf.filename).toBe('widerspruch-gegen-mieterh-hung-558-bgb-2024-01-15.pdf');
            expect(pdf.filename).not.toContain('(');
            expect(pdf.filename).not.toContain(')');
            expect(pdf.filename).not.toContain('§');
        });
    });
    describe('PDF content', () => {
        it('should include all sections when enabled', async () => {
            const pdf = await service.generatePDF(mockGeneratedTemplate, {
                includeInstructions: true,
                includeLegalNotes: true
            });
            // PDF sollte größer sein wenn alle Abschnitte enthalten sind
            expect(pdf.size).toBeGreaterThan(1000);
        });
        it('should be smaller without optional sections', async () => {
            const fullPdf = await service.generatePDF(mockGeneratedTemplate, {
                includeInstructions: true,
                includeLegalNotes: true
            });
            const minimalPdf = await service.generatePDF(mockGeneratedTemplate, {
                includeInstructions: false,
                includeLegalNotes: false
            });
            expect(minimalPdf.size).toBeLessThan(fullPdf.size);
        });
    });
});
