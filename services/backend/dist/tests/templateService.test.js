"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const TemplateService_1 = require("../services/TemplateService");
jest.mock('../utils/logger');
describe('TemplateService', () => {
    let prisma;
    let service;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        service = new TemplateService_1.TemplateService(prisma);
        jest.clearAllMocks();
    });
    afterEach(async () => {
        await prisma.$disconnect();
    });
    describe('generateDocument', () => {
        it('should generate rent reduction letter', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Mietminderungsschreiben',
                type: 'rent_reduction',
                description: 'Schreiben zur Mietminderung',
                content: `{{tenantName}}
{{tenantAddress}}

Sehr geehrte/r {{landlordName}},

hiermit zeige ich einen Mangel an: {{defectDescription}}

Ich mindere die Miete um {{rentReductionPercentage}}%.

Mit freundlichen Grüßen
{{tenantName}}`,
                category: 'RENT_REDUCTION',
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const templateData = {
                tenantName: 'Max Mustermann',
                tenantAddress: 'Musterstraße 1, 12345 Berlin',
                landlordName: 'Erika Musterfrau',
                propertyAddress: 'Teststraße 10, 12345 Berlin',
                defectDescription: 'Heizung funktioniert nicht',
                rentReductionPercentage: 20
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            const result = await service.generateDocument('template-1', templateData, 'user-1');
            expect(result.templateName).toBe('Mietminderungsschreiben');
            expect(result.category).toBe('RENT_REDUCTION');
            expect(result.content).toContain('Max Mustermann');
            expect(result.content).toContain('Heizung funktioniert nicht');
            expect(result.content).toContain('20%');
            expect(result.instructions.length).toBeGreaterThan(0);
            expect(result.legalNotes.length).toBeGreaterThan(0);
        });
        it('should generate rent increase objection', async () => {
            const mockTemplate = {
                id: 'template-2',
                name: 'Widerspruch Mieterhöhung',
                type: 'rent_increase_objection',
                description: 'Widerspruch gegen Mieterhöhung',
                content: `{{tenantName}}

Hiermit widerspreche ich der Mieterhöhung auf {{rentIncreaseAmount}} EUR.

{{tenantName}}`,
                category: 'RENT_INCREASE',
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const templateData = {
                tenantName: 'Max Mustermann',
                landlordName: 'Erika Musterfrau',
                propertyAddress: 'Teststraße 10, 12345 Berlin',
                rentIncreaseAmount: 1500
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            const result = await service.generateDocument('template-2', templateData, 'user-1');
            expect(result.content).toContain('Max Mustermann');
            expect(result.content).toContain('1.500,00');
            expect(result.instructions).toContain(expect.stringContaining('Widerspruch'));
        });
        it('should format dates correctly', async () => {
            const mockTemplate = {
                id: 'template-3',
                name: 'Fristsetzung',
                type: 'deadline_letter',
                description: 'Fristsetzung',
                content: 'Frist bis: {{deadline}}',
                category: 'REPAIRS',
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const templateData = {
                tenantName: 'Max Mustermann',
                landlordName: 'Erika Musterfrau',
                propertyAddress: 'Teststraße 10',
                deadline: new Date('2024-12-31')
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            const result = await service.generateDocument('template-3', templateData, 'user-1');
            expect(result.content).toContain('31.12.2024');
        });
        it('should throw error for missing required fields', async () => {
            const mockTemplate = {
                id: 'template-4',
                name: 'Test Template',
                type: 'rent_reduction',
                description: 'Test',
                content: 'Test',
                category: 'RENT_REDUCTION',
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const incompleteData = {
                tenantName: 'Max Mustermann'
                // Missing required fields
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            await expect(service.generateDocument('template-4', incompleteData, 'user-1')).rejects.toThrow('Template-Validierung fehlgeschlagen');
        });
        it('should throw error for inactive template', async () => {
            const mockTemplate = {
                id: 'template-5',
                name: 'Inactive Template',
                type: 'rent_reduction',
                description: 'Test',
                content: 'Test',
                category: 'RENT_REDUCTION',
                language: 'de',
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            await expect(service.generateDocument('template-5', {}, 'user-1')).rejects.toThrow('Template ist nicht aktiv');
        });
    });
    describe('listTemplates', () => {
        it('should list all active templates', async () => {
            const mockTemplates = [
                {
                    id: 'template-1',
                    name: 'Mietminderung',
                    type: 'rent_reduction',
                    description: 'Mietminderungsschreiben',
                    content: 'Content',
                    category: 'RENT_REDUCTION',
                    language: 'de',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'template-2',
                    name: 'Widerspruch',
                    type: 'rent_increase_objection',
                    description: 'Widerspruch Mieterhöhung',
                    content: 'Content',
                    category: 'RENT_INCREASE',
                    language: 'de',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
            jest.spyOn(prisma.template, 'findMany').mockResolvedValue(mockTemplates);
            const result = await service.listTemplates();
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Mietminderung');
            expect(result[0].requiredFields).toContain('tenantName');
            expect(result[1].name).toBe('Widerspruch');
        });
        it('should filter templates by category', async () => {
            const mockTemplates = [
                {
                    id: 'template-1',
                    name: 'Mietminderung',
                    type: 'rent_reduction',
                    description: 'Mietminderungsschreiben',
                    content: 'Content',
                    category: 'RENT_REDUCTION',
                    language: 'de',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
            jest.spyOn(prisma.template, 'findMany').mockResolvedValue(mockTemplates);
            const result = await service.listTemplates('RENT_REDUCTION');
            expect(result).toHaveLength(1);
            expect(result[0].category).toBe('RENT_REDUCTION');
        });
    });
    describe('getTemplate', () => {
        it('should get template by id', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Mietminderung',
                type: 'rent_reduction',
                description: 'Mietminderungsschreiben',
                content: 'Content',
                category: 'RENT_REDUCTION',
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            const result = await service.getTemplate('template-1');
            expect(result).toBeDefined();
            expect(result?.name).toBe('Mietminderung');
            expect(result?.requiredFields).toContain('tenantName');
        });
        it('should return null for non-existent template', async () => {
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(null);
            const result = await service.getTemplate('non-existent');
            expect(result).toBeNull();
        });
    });
    describe('createTemplate', () => {
        it('should create new template', async () => {
            const newTemplate = {
                name: 'Neues Template',
                type: 'custom',
                description: 'Beschreibung',
                content: 'Inhalt mit {{placeholder}}',
                category: 'OTHER'
            };
            const mockCreated = {
                id: 'template-new',
                ...newTemplate,
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            jest.spyOn(prisma.template, 'create').mockResolvedValue(mockCreated);
            const result = await service.createTemplate(newTemplate);
            expect(result.id).toBe('template-new');
            expect(result.name).toBe('Neues Template');
        });
    });
    describe('generateInstructions', () => {
        it('should generate specific instructions for rent reduction', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Mietminderung',
                type: 'rent_reduction',
                description: 'Test',
                content: 'Test {{tenantName}}',
                category: 'RENT_REDUCTION',
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const templateData = {
                tenantName: 'Max Mustermann',
                landlordName: 'Erika Musterfrau',
                propertyAddress: 'Test',
                defectDescription: 'Test',
                rentReductionPercentage: 25
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            const result = await service.generateDocument('template-1', templateData, 'user-1');
            expect(result.instructions).toContain(expect.stringContaining('Einschreiben'));
            expect(result.instructions).toContain(expect.stringContaining('20%'));
        });
    });
    describe('generateLegalNotes', () => {
        it('should generate category-specific legal notes', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Test',
                type: 'rent_reduction',
                description: 'Test',
                content: 'Test {{tenantName}}',
                category: 'RENT_REDUCTION',
                language: 'de',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const templateData = {
                tenantName: 'Max Mustermann',
                landlordName: 'Erika Musterfrau',
                propertyAddress: 'Test',
                defectDescription: 'Test'
            };
            jest.spyOn(prisma.template, 'findUnique').mockResolvedValue(mockTemplate);
            const result = await service.generateDocument('template-1', templateData, 'user-1');
            expect(result.legalNotes).toContain(expect.stringContaining('§ 536 BGB'));
            expect(result.legalNotes).toContain(expect.stringContaining('Rechtsberatung'));
        });
    });
});
