import { PrismaClient } from '@prisma/client';
import { GeneratedTemplate } from './TemplateService';
export interface PDFOptions {
    includeInstructions?: boolean;
    includeLegalNotes?: boolean;
    fontSize?: number;
    margin?: number;
    pageSize?: 'A4' | 'LETTER';
}
export interface GeneratedPDF {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    size: number;
}
export interface DocumentPreview {
    content: string;
    instructions: string[];
    legalNotes: string[];
    metadata: {
        templateName: string;
        category: string;
        generatedAt: Date;
    };
}
export declare class DocumentGeneratorService {
    private prisma;
    private templateService;
    constructor(prisma: PrismaClient);
    /**
     * Generiert ein PDF-Dokument aus einem Template
     */
    generatePDF(generatedTemplate: GeneratedTemplate, options?: PDFOptions): Promise<GeneratedPDF>;
    /**
     * Schreibt Inhalt in PDF
     */
    private writePDFContent;
    /**
     * Generiert Dateinamen für PDF
     */
    private generateFilename;
    /**
     * Erstellt eine Vorschau des Dokuments
     */
    generatePreview(templateId: string, data: any, userId: string): Promise<DocumentPreview>;
    /**
     * Speichert generiertes PDF
     */
    savePDF(pdf: GeneratedPDF, userId: string, templateId: string): Promise<string>;
    /**
     * Generiert und speichert PDF in einem Schritt
     */
    generateAndSavePDF(templateId: string, data: any, userId: string, options?: PDFOptions): Promise<{
        filePath: string;
        pdf: GeneratedPDF;
    }>;
    /**
     * Exportiert Dokument als Text-Datei
     */
    exportAsText(generatedTemplate: GeneratedTemplate, includeMetadata?: boolean): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    /**
     * Formatiert Datum im deutschen Format
     */
    private formatDate;
    /**
     * Validiert PDF-Optionen
     */
    private validatePDFOptions;
    /**
     * Erstellt Batch-PDFs für mehrere Templates
     */
    generateBatchPDFs(requests: Array<{
        templateId: string;
        data: any;
        userId: string;
        options?: PDFOptions;
    }>): Promise<Array<{
        success: boolean;
        pdf?: GeneratedPDF;
        error?: string;
    }>>;
}
