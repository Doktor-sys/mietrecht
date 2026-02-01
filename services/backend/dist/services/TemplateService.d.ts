import { PrismaClient, LegalCategory } from '@prisma/client';
export interface TemplateData {
    tenantName?: string;
    tenantAddress?: string;
    landlordName?: string;
    landlordAddress?: string;
    propertyAddress?: string;
    rentAmount?: number;
    date?: Date;
    deadline?: Date;
    defectDescription?: string;
    rentReductionAmount?: number;
    rentReductionPercentage?: number;
    rentIncreaseAmount?: number;
    legalReferences?: string[];
    [key: string]: any;
}
export interface GeneratedTemplate {
    id: string;
    templateId: string;
    templateName: string;
    category: LegalCategory;
    content: string;
    instructions: string[];
    legalNotes: string[];
    generatedAt: Date;
}
export interface TemplateMetadata {
    id: string;
    name: string;
    type: string;
    description: string;
    category: LegalCategory;
    requiredFields: string[];
    optionalFields: string[];
}
export declare class TemplateService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generiert ein Dokument aus einer Vorlage
     */
    generateDocument(templateId: string, data: TemplateData, userId: string): Promise<GeneratedTemplate>;
    /**
     * Füllt Template mit Daten
     */
    private fillTemplate;
    /**
     * Generiert Anweisungen für die Verwendung
     */
    private generateInstructions;
    /**
     * Generiert rechtliche Hinweise
     */
    private generateLegalNotes;
    /**
     * Validiert Template-Daten
     */
    private validateTemplateData;
    /**
     * Gibt erforderliche Felder für Template-Typ zurück
     */
    private getRequiredFields;
    /**
     * Formatiert Datum im deutschen Format
     */
    private formatDate;
    /**
     * Formatiert Zahlen im deutschen Format
     */
    private formatNumber;
    /**
     * Listet verfügbare Templates auf
     */
    listTemplates(category?: LegalCategory): Promise<TemplateMetadata[]>;
    /**
     * Ruft ein spezifisches Template ab
     */
    getTemplate(templateId: string): Promise<TemplateMetadata | null>;
    /**
     * Erstellt ein neues Template (Admin-Funktion)
     */
    createTemplate(data: {
        name: string;
        type: string;
        description: string;
        content: string;
        category: LegalCategory;
        language?: string;
    }): Promise<TemplateMetadata>;
}
