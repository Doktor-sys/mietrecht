"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class TemplateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Generiert ein Dokument aus einer Vorlage
     */
    async generateDocument(templateId, data, userId) {
        try {
            logger_1.logger.info('Generating document from template', { templateId, userId });
            // Lade Template
            const template = await this.prisma.template.findUnique({
                where: { id: templateId }
            });
            if (!template) {
                throw new errorHandler_1.NotFoundError('Template nicht gefunden');
            }
            if (!template.isActive) {
                throw new errorHandler_1.ValidationError('Template ist nicht aktiv');
            }
            // Validiere erforderliche Felder
            this.validateTemplateData(template, data);
            // Generiere Inhalt
            const content = this.fillTemplate(template.content, data);
            // Generiere Anweisungen
            const instructions = this.generateInstructions(template.type, data);
            // Generiere rechtliche Hinweise
            const legalNotes = this.generateLegalNotes(template.category);
            // Log Business Event
            logger_1.loggers.businessEvent('TEMPLATE_GENERATED', userId, {
                templateId,
                templateName: template.name,
                category: template.category
            });
            return {
                id: `gen-${Date.now()}`,
                templateId: template.id,
                templateName: template.name,
                category: template.category,
                content,
                instructions,
                legalNotes,
                generatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating document:', error);
            throw error;
        }
    }
    /**
     * Füllt Template mit Daten
     */
    fillTemplate(templateContent, data) {
        let content = templateContent;
        // Ersetze Platzhalter
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = data[key];
            if (value !== undefined && value !== null) {
                // Formatiere Werte
                let formattedValue;
                if (value instanceof Date) {
                    formattedValue = this.formatDate(value);
                }
                else if (typeof value === 'number') {
                    formattedValue = this.formatNumber(value);
                }
                else if (Array.isArray(value)) {
                    formattedValue = value.join(', ');
                }
                else {
                    formattedValue = String(value);
                }
                content = content.replace(new RegExp(placeholder, 'g'), formattedValue);
            }
        });
        // Entferne nicht ersetzte Platzhalter
        content = content.replace(/\{\{[^}]+\}\}/g, '[NICHT AUSGEFÜLLT]');
        return content;
    }
    /**
     * Generiert Anweisungen für die Verwendung
     */
    generateInstructions(templateType, data) {
        const instructions = [];
        switch (templateType) {
            case 'rent_reduction':
                instructions.push('1. Prüfen Sie, ob der Mangel tatsächlich vorliegt und dokumentiert ist', '2. Setzen Sie dem Vermieter eine angemessene Frist zur Mängelbeseitigung (in der Regel 14 Tage)', '3. Versenden Sie das Schreiben per Einschreiben mit Rückschein', '4. Bewahren Sie eine Kopie und den Versandnachweis auf', '5. Mindern Sie die Miete erst nach Ablauf der Frist, wenn der Mangel nicht behoben wurde');
                if (data.rentReductionPercentage && data.rentReductionPercentage > 20) {
                    instructions.push('WICHTIG: Bei einer Mietminderung über 20% sollten Sie vorab rechtlichen Rat einholen');
                }
                break;
            case 'rent_increase_objection':
                instructions.push('1. Prüfen Sie die Begründung der Mieterhöhung', '2. Vergleichen Sie mit dem lokalen Mietspiegel', '3. Versenden Sie den Widerspruch innerhalb der Frist (meist 2 Monate)', '4. Senden Sie das Schreiben per Einschreiben mit Rückschein', '5. Zahlen Sie bis zur Klärung weiterhin die alte Miete');
                break;
            case 'deadline_letter':
                instructions.push('1. Beschreiben Sie den Mangel oder das Problem konkret', '2. Setzen Sie eine angemessene Frist (mindestens 14 Tage)', '3. Versenden Sie per Einschreiben mit Rückschein', '4. Dokumentieren Sie den Mangel mit Fotos', '5. Bewahren Sie alle Unterlagen auf');
                break;
            case 'utility_bill_objection':
                instructions.push('1. Prüfen Sie die Abrechnung auf Vollständigkeit und Richtigkeit', '2. Legen Sie innerhalb von 12 Monaten Widerspruch ein', '3. Fordern Sie Einsicht in Belege und Verträge', '4. Versenden Sie per Einschreiben mit Rückschein', '5. Zahlen Sie nur den unstrittigen Teil');
                break;
            default:
                instructions.push('1. Prüfen Sie alle Angaben auf Richtigkeit', '2. Versenden Sie das Schreiben per Einschreiben mit Rückschein', '3. Bewahren Sie eine Kopie auf', '4. Dokumentieren Sie alle relevanten Umstände');
        }
        return instructions;
    }
    /**
     * Generiert rechtliche Hinweise
     */
    generateLegalNotes(category) {
        const notes = [
            'WICHTIGER HINWEIS: Dieses Schreiben ersetzt keine individuelle Rechtsberatung.',
            'Bei komplexen Fällen oder hohen Streitwerten sollten Sie einen Fachanwalt für Mietrecht konsultieren.'
        ];
        switch (category) {
            case 'RENT_REDUCTION':
                notes.push('Rechtliche Grundlage: § 536 BGB - Mietminderung bei Mängeln', 'Die Höhe der Mietminderung richtet sich nach der Schwere des Mangels', 'Eine zu hohe Mietminderung kann zu Zahlungsrückständen und Kündigung führen');
                break;
            case 'RENT_INCREASE':
                notes.push('Rechtliche Grundlage: § 558 BGB - Mieterhöhung bis zur ortsüblichen Vergleichsmiete', 'Sie haben 2 Monate Zeit, um der Mieterhöhung zu widersprechen', 'Bei Widerspruch muss der Vermieter ggf. vor Gericht ziehen');
                break;
            case 'UTILITY_COSTS':
                notes.push('Rechtliche Grundlage: § 556 BGB und Betriebskostenverordnung (BetrKV)', 'Der Vermieter muss innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums abrechnen', 'Sie haben Anspruch auf Einsicht in alle Belege');
                break;
            case 'TERMINATION':
                notes.push('Rechtliche Grundlage: §§ 573-573c BGB - Kündigung des Mietverhältnisses', 'Bei Kündigungen sollten Sie unbedingt rechtlichen Rat einholen', 'Fristen und Formvorschriften müssen streng eingehalten werden');
                break;
            case 'REPAIRS':
                notes.push('Rechtliche Grundlage: § 535 BGB - Instandhaltungspflicht des Vermieters', 'Der Vermieter ist verpflichtet, die Mietsache in gebrauchsfähigem Zustand zu erhalten', 'Bei Gefahr im Verzug können Sie Mängel selbst beseitigen und Ersatz verlangen');
                break;
            default:
                notes.push('Bitte informieren Sie sich über die spezifischen rechtlichen Grundlagen Ihres Falls');
        }
        return notes;
    }
    /**
     * Validiert Template-Daten
     */
    validateTemplateData(template, data) {
        const errors = [];
        // Prüfe erforderliche Felder basierend auf Template-Typ
        const requiredFields = this.getRequiredFields(template.type);
        requiredFields.forEach(field => {
            if (!data[field]) {
                errors.push(`Erforderliches Feld fehlt: ${field}`);
            }
        });
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(`Template-Validierung fehlgeschlagen: ${errors.join(', ')}`);
        }
    }
    /**
     * Gibt erforderliche Felder für Template-Typ zurück
     */
    getRequiredFields(templateType) {
        const fieldMap = {
            rent_reduction: ['tenantName', 'landlordName', 'propertyAddress', 'defectDescription'],
            rent_increase_objection: ['tenantName', 'landlordName', 'propertyAddress', 'rentIncreaseAmount'],
            deadline_letter: ['tenantName', 'landlordName', 'propertyAddress', 'deadline'],
            utility_bill_objection: ['tenantName', 'landlordName', 'propertyAddress']
        };
        return fieldMap[templateType] || ['tenantName', 'landlordName'];
    }
    /**
     * Formatiert Datum im deutschen Format
     */
    formatDate(date) {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    /**
     * Formatiert Zahlen im deutschen Format
     */
    formatNumber(num) {
        return num.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    /**
     * Listet verfügbare Templates auf
     */
    async listTemplates(category) {
        try {
            const where = category ? { category, isActive: true } : { isActive: true };
            const templates = await this.prisma.template.findMany({
                where,
                orderBy: { name: 'asc' }
            });
            return templates.map(t => ({
                id: t.id,
                name: t.name,
                type: t.type,
                description: t.description,
                category: t.category,
                requiredFields: this.getRequiredFields(t.type),
                optionalFields: ['date', 'legalReferences']
            }));
        }
        catch (error) {
            logger_1.logger.error('Error listing templates:', error);
            throw error;
        }
    }
    /**
     * Ruft ein spezifisches Template ab
     */
    async getTemplate(templateId) {
        try {
            const template = await this.prisma.template.findUnique({
                where: { id: templateId }
            });
            if (!template) {
                return null;
            }
            return {
                id: template.id,
                name: template.name,
                type: template.type,
                description: template.description,
                category: template.category,
                requiredFields: this.getRequiredFields(template.type),
                optionalFields: ['date', 'legalReferences']
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting template:', error);
            throw error;
        }
    }
    /**
     * Erstellt ein neues Template (Admin-Funktion)
     */
    async createTemplate(data) {
        try {
            const template = await this.prisma.template.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    content: data.content,
                    category: data.category,
                    language: data.language || 'de',
                    isActive: true
                }
            });
            logger_1.loggers.businessEvent('TEMPLATE_CREATED', '', {
                templateId: template.id,
                name: template.name,
                category: template.category
            });
            return {
                id: template.id,
                name: template.name,
                type: template.type,
                description: template.description,
                category: template.category,
                requiredFields: this.getRequiredFields(template.type),
                optionalFields: ['date', 'legalReferences']
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating template:', error);
            throw error;
        }
    }
}
exports.TemplateService = TemplateService;
