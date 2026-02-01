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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGeneratorService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const logger_1 = require("../utils/logger");
const TemplateService_1 = require("./TemplateService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DocumentGeneratorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.templateService = new TemplateService_1.TemplateService(prisma);
    }
    /**
     * Generiert ein PDF-Dokument aus einem Template
     */
    async generatePDF(generatedTemplate, options = {}) {
        try {
            logger_1.logger.info('Generating PDF document', {
                templateId: generatedTemplate.templateId,
                templateName: generatedTemplate.templateName
            });
            const { includeInstructions = true, includeLegalNotes = true, fontSize = 11, margin = 50, pageSize = 'A4' } = options;
            // Erstelle PDF-Dokument
            const doc = new pdfkit_1.default({
                size: pageSize,
                margins: {
                    top: margin,
                    bottom: margin,
                    left: margin,
                    right: margin
                }
            });
            // Buffer für PDF-Daten
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            // Schreibe Inhalt
            this.writePDFContent(doc, generatedTemplate, {
                includeInstructions,
                includeLegalNotes,
                fontSize
            });
            // Finalisiere PDF
            doc.end();
            // Warte auf Fertigstellung
            const buffer = await new Promise((resolve, reject) => {
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
            });
            const filename = this.generateFilename(generatedTemplate);
            logger_1.loggers.businessEvent('PDF_GENERATED', '', {
                templateName: generatedTemplate.templateName,
                size: buffer.length
            });
            return {
                buffer,
                filename,
                mimeType: 'application/pdf',
                size: buffer.length
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating PDF:', error);
            throw error;
        }
    }
    /**
     * Schreibt Inhalt in PDF
     */
    writePDFContent(doc, template, options) {
        const { includeInstructions, includeLegalNotes, fontSize } = options;
        // Titel
        doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .text(template.templateName, { align: 'center' })
            .moveDown(2);
        // Hauptinhalt
        doc
            .fontSize(fontSize)
            .font('Helvetica')
            .text(template.content, {
            align: 'left',
            lineGap: 5
        })
            .moveDown(2);
        // Anweisungen
        if (includeInstructions && template.instructions.length > 0) {
            doc.addPage();
            doc
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Anweisungen zur Verwendung', { underline: true })
                .moveDown(1);
            doc.fontSize(fontSize).font('Helvetica');
            template.instructions.forEach((instruction, index) => {
                doc
                    .text(instruction, {
                    indent: 20,
                    lineGap: 3
                })
                    .moveDown(0.5);
            });
            doc.moveDown(1);
        }
        // Rechtliche Hinweise
        if (includeLegalNotes && template.legalNotes.length > 0) {
            if (!includeInstructions) {
                doc.addPage();
            }
            doc
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Rechtliche Hinweise', { underline: true })
                .moveDown(1);
            doc.fontSize(fontSize - 1).font('Helvetica');
            template.legalNotes.forEach((note, index) => {
                doc
                    .text(`• ${note}`, {
                    indent: 20,
                    lineGap: 3
                })
                    .moveDown(0.5);
            });
        }
        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc
                .fontSize(8)
                .font('Helvetica')
                .text(`Generiert am ${this.formatDate(template.generatedAt)} | Seite ${i + 1} von ${pages.count}`, 50, doc.page.height - 30, {
                align: 'center'
            });
        }
    }
    /**
     * Generiert Dateinamen für PDF
     */
    generateFilename(template) {
        const date = template.generatedAt.toISOString().split('T')[0];
        const safeName = template.templateName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        return `${safeName}-${date}.pdf`;
    }
    /**
     * Erstellt eine Vorschau des Dokuments
     */
    async generatePreview(templateId, data, userId) {
        try {
            logger_1.logger.info('Generating document preview', { templateId, userId });
            const generatedTemplate = await this.templateService.generateDocument(templateId, data, userId);
            return {
                content: generatedTemplate.content,
                instructions: generatedTemplate.instructions,
                legalNotes: generatedTemplate.legalNotes,
                metadata: {
                    templateName: generatedTemplate.templateName,
                    category: generatedTemplate.category,
                    generatedAt: generatedTemplate.generatedAt
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating preview:', error);
            throw error;
        }
    }
    /**
     * Speichert generiertes PDF
     */
    async savePDF(pdf, userId, templateId) {
        try {
            // Erstelle Verzeichnis falls nicht vorhanden
            const uploadDir = path.join(process.cwd(), 'uploads', 'generated-documents', userId);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, pdf.filename);
            // Schreibe PDF-Datei
            fs.writeFileSync(filePath, pdf.buffer);
            logger_1.logger.info('PDF saved successfully', {
                userId,
                filename: pdf.filename,
                size: pdf.size
            });
            return filePath;
        }
        catch (error) {
            logger_1.logger.error('Error saving PDF:', error);
            throw error;
        }
    }
    /**
     * Generiert und speichert PDF in einem Schritt
     */
    async generateAndSavePDF(templateId, data, userId, options) {
        try {
            // Generiere Template
            const generatedTemplate = await this.templateService.generateDocument(templateId, data, userId);
            // Generiere PDF
            const pdf = await this.generatePDF(generatedTemplate, options);
            // Speichere PDF
            const filePath = await this.savePDF(pdf, userId, templateId);
            logger_1.loggers.businessEvent('DOCUMENT_GENERATED_AND_SAVED', userId, {
                templateId,
                filename: pdf.filename,
                size: pdf.size
            });
            return { filePath, pdf };
        }
        catch (error) {
            logger_1.logger.error('Error generating and saving PDF:', error);
            throw error;
        }
    }
    /**
     * Exportiert Dokument als Text-Datei
     */
    async exportAsText(generatedTemplate, includeMetadata = true) {
        try {
            let content = '';
            if (includeMetadata) {
                content += `${generatedTemplate.templateName}\n`;
                content += `Generiert am: ${this.formatDate(generatedTemplate.generatedAt)}\n`;
                content += `Kategorie: ${generatedTemplate.category}\n`;
                content += '\n' + '='.repeat(80) + '\n\n';
            }
            content += generatedTemplate.content;
            if (generatedTemplate.instructions.length > 0) {
                content += '\n\n' + '='.repeat(80) + '\n\n';
                content += 'ANWEISUNGEN ZUR VERWENDUNG\n\n';
                generatedTemplate.instructions.forEach((instruction, index) => {
                    content += `${instruction}\n\n`;
                });
            }
            if (generatedTemplate.legalNotes.length > 0) {
                content += '\n' + '='.repeat(80) + '\n\n';
                content += 'RECHTLICHE HINWEISE\n\n';
                generatedTemplate.legalNotes.forEach((note, index) => {
                    content += `• ${note}\n\n`;
                });
            }
            const buffer = Buffer.from(content, 'utf-8');
            const filename = this.generateFilename(generatedTemplate).replace('.pdf', '.txt');
            return { buffer, filename };
        }
        catch (error) {
            logger_1.logger.error('Error exporting as text:', error);
            throw error;
        }
    }
    /**
     * Formatiert Datum im deutschen Format
     */
    formatDate(date) {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    /**
     * Validiert PDF-Optionen
     */
    validatePDFOptions(options) {
        if (options.fontSize && (options.fontSize < 8 || options.fontSize > 16)) {
            throw new Error('Font size must be between 8 and 16');
        }
        if (options.margin && (options.margin < 20 || options.margin > 100)) {
            throw new Error('Margin must be between 20 and 100');
        }
        if (options.pageSize && !['A4', 'LETTER'].includes(options.pageSize)) {
            throw new Error('Page size must be A4 or LETTER');
        }
    }
    /**
     * Erstellt Batch-PDFs für mehrere Templates
     */
    async generateBatchPDFs(requests) {
        const results = [];
        for (const request of requests) {
            try {
                const generatedTemplate = await this.templateService.generateDocument(request.templateId, request.data, request.userId);
                const pdf = await this.generatePDF(generatedTemplate, request.options);
                results.push({ success: true, pdf });
            }
            catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return results;
    }
}
exports.DocumentGeneratorService = DocumentGeneratorService;
