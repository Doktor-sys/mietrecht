"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAnalysisService = void 0;
const OCRService_1 = __importDefault(require("./OCRService"));
const KnowledgeService_1 = require("./KnowledgeService");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class DocumentAnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
        this.knowledgeService = new KnowledgeService_1.KnowledgeService(prisma);
    }
    /**
     * Analysiert ein hochgeladenes Dokument
     */
    async analyzeDocument(documentId) {
        try {
            logger_1.logger.info('Starting document analysis', { documentId });
            // Lade Dokument aus Datenbank
            const document = await this.prisma.document.findUnique({
                where: { id: documentId },
                include: { user: true }
            });
            if (!document) {
                throw new errorHandler_1.NotFoundError('Dokument nicht gefunden');
            }
            // Extrahiere Text aus Dokument
            const extractedText = await this.extractTextFromDocument(document);
            // Analysiere basierend auf Dokumenttyp
            let analysis;
            switch (document.documentType) {
                case 'RENTAL_CONTRACT':
                    analysis = await this.analyzeRentalContract(documentId, extractedText);
                    break;
                case 'UTILITY_BILL':
                    analysis = await this.analyzeUtilityBill(documentId, extractedText);
                    break;
                case 'WARNING_LETTER':
                    analysis = await this.analyzeWarningLetter(documentId, extractedText);
                    break;
                default:
                    analysis = await this.analyzeGenericDocument(documentId, extractedText, document.documentType);
            }
            // Speichere Analyse in Datenbank
            await this.saveAnalysis(documentId, analysis);
            logger_1.loggers.businessEvent('DOCUMENT_ANALYZED', document.userId || 'unknown', {
                documentId,
                documentType: document.documentType,
                riskLevel: analysis.riskLevel,
                issuesCount: analysis.issues.length
            });
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing document:', error);
            throw error;
        }
    }
    /**
     * Analysiert einen Mietvertrag
     */
    async analyzeRentalContract(documentId, text) {
        const issues = [];
        const recommendations = [];
        let riskLevel = 'low';
        // Extrahiere strukturierte Daten
        const extractedData = OCRService_1.default.extractRentalContractData(text);
        // Prüfe auf unwirksame Klauseln
        const invalidClauses = this.detectInvalidClauses(text);
        if (invalidClauses.length > 0) {
            invalidClauses.forEach(clause => {
                issues.push({
                    type: 'invalid_clause',
                    severity: 'critical',
                    description: clause.description,
                    legalBasis: clause.legalBasis,
                    suggestedAction: 'Diese Klausel ist unwirksam und kann angefochten werden.'
                });
            });
            riskLevel = 'high';
        }
        // Prüfe Mietpreis
        if (extractedData.rentAmount && extractedData.address) {
            const rentCheck = await this.checkRentPrice(extractedData.rentAmount, extractedData.address, extractedData.squareMeters);
            if (rentCheck.excessive) {
                issues.push({
                    type: 'excessive_rent',
                    severity: 'warning',
                    description: `Die Miete liegt ${rentCheck.percentageAbove}% über dem lokalen Mietspiegel.`,
                    legalBasis: '§ 556d BGB (Mietpreisbremse)',
                    suggestedAction: 'Prüfen Sie, ob die Mietpreisbremse anwendbar ist.'
                });
                recommendations.push({
                    type: 'rent_reduction',
                    description: 'Mögliche Mietminderung aufgrund überhöhter Miete',
                    priority: 'high',
                    actionRequired: true,
                    legalReferences: ['§ 556d BGB']
                });
                if (riskLevel === 'low')
                    riskLevel = 'medium';
            }
        }
        // Prüfe Kaution
        if (extractedData.deposit && extractedData.rentAmount) {
            const maxDeposit = extractedData.rentAmount * 3;
            if (extractedData.deposit > maxDeposit) {
                issues.push({
                    type: 'excessive_deposit',
                    severity: 'warning',
                    description: `Die Kaution von ${extractedData.deposit}€ überschreitet das gesetzliche Maximum von ${maxDeposit}€.`,
                    legalBasis: '§ 551 BGB',
                    suggestedAction: 'Die Kaution muss auf maximal 3 Monatskaltmieten reduziert werden.'
                });
                if (riskLevel === 'low')
                    riskLevel = 'medium';
            }
        }
        // Prüfe fehlende Pflichtangaben
        const missingFields = this.checkMissingMandatoryFields(extractedData);
        if (missingFields.length > 0) {
            issues.push({
                type: 'missing_information',
                severity: 'info',
                description: `Folgende Pflichtangaben fehlen: ${missingFields.join(', ')}`,
                suggestedAction: 'Fordern Sie die fehlenden Informationen vom Vermieter an.'
            });
        }
        // Prüfe Kündigungsfristen
        const terminationIssues = this.checkTerminationClauses(text);
        if (terminationIssues.length > 0) {
            issues.push(...terminationIssues);
            if (riskLevel === 'low')
                riskLevel = 'medium';
        }
        // Prüfe Schönheitsreparaturen
        const renovationIssues = this.checkRenovationClauses(text);
        if (renovationIssues.length > 0) {
            issues.push(...renovationIssues);
        }
        // Allgemeine Empfehlungen
        if (issues.length === 0) {
            recommendations.push({
                type: 'general',
                description: 'Der Mietvertrag scheint keine offensichtlichen rechtlichen Probleme zu enthalten.',
                priority: 'low',
                actionRequired: false
            });
        }
        else {
            recommendations.push({
                type: 'legal_review',
                description: 'Lassen Sie den Vertrag von einem Fachanwalt prüfen, bevor Sie unterschreiben.',
                priority: issues.some(i => i.severity === 'critical') ? 'high' : 'medium',
                actionRequired: true
            });
        }
        return {
            documentId,
            documentType: 'RENTAL_CONTRACT',
            extractedData,
            issues,
            recommendations,
            riskLevel,
            confidence: this.calculateConfidence(extractedData, issues),
            analyzedAt: new Date()
        };
    }
    /**
     * Analysiert eine Nebenkostenabrechnung
     */
    async analyzeUtilityBill(documentId, text) {
        const issues = [];
        const recommendations = [];
        let riskLevel = 'low';
        // Extrahiere Daten
        const extractedData = OCRService_1.default.extractUtilityBillData(text);
        // Prüfe Abrechnungszeitraum
        if (extractedData.billingPeriodStart && extractedData.billingPeriodEnd) {
            const periodCheck = this.checkBillingPeriod(extractedData.billingPeriodStart, extractedData.billingPeriodEnd);
            if (!periodCheck.valid) {
                issues.push({
                    type: 'invalid_billing_period',
                    severity: 'warning',
                    description: periodCheck.reason || 'Ungültiger Abrechnungszeitraum',
                    legalBasis: '§ 556 Abs. 3 BGB',
                    suggestedAction: 'Fordern Sie eine korrigierte Abrechnung an.'
                });
                riskLevel = 'medium';
            }
        }
        // Prüfe auf nicht umlagefähige Kosten
        const nonDeductibleCosts = this.detectNonDeductibleCosts(text);
        if (nonDeductibleCosts.length > 0) {
            nonDeductibleCosts.forEach(cost => {
                issues.push({
                    type: 'non_deductible_cost',
                    severity: 'warning',
                    description: `Nicht umlagefähige Kosten gefunden: ${cost.description}`,
                    legalBasis: '§ 556 Abs. 1 BGB, BetrKV',
                    suggestedAction: `Widersprechen Sie der Position "${cost.description}".`
                });
            });
            riskLevel = 'medium';
        }
        // Prüfe Abrechnungsfrist
        const deadlineCheck = this.checkBillingDeadline(extractedData);
        if (!deadlineCheck.valid) {
            issues.push({
                type: 'missed_deadline',
                severity: 'critical',
                description: 'Die Abrechnung wurde verspätet erstellt.',
                legalBasis: '§ 556 Abs. 3 S. 2 BGB',
                suggestedAction: 'Sie müssen Nachforderungen nicht zahlen, wenn die 12-Monats-Frist überschritten wurde.'
            });
            riskLevel = 'high';
        }
        // Prüfe Berechnungsfehler
        const calculationErrors = this.detectCalculationErrors(extractedData);
        if (calculationErrors.length > 0) {
            calculationErrors.forEach(error => {
                issues.push({
                    type: 'calculation_error',
                    severity: 'warning',
                    description: error.description,
                    suggestedAction: 'Fordern Sie eine Korrektur der Berechnung an.'
                });
            });
            if (riskLevel === 'low')
                riskLevel = 'medium';
        }
        // Empfehlungen
        if (issues.length > 0) {
            recommendations.push({
                type: 'objection',
                description: 'Legen Sie schriftlich Widerspruch gegen die Nebenkostenabrechnung ein.',
                priority: 'high',
                actionRequired: true,
                legalReferences: ['§ 556 BGB', 'BetrKV']
            });
        }
        else {
            recommendations.push({
                type: 'general',
                description: 'Die Nebenkostenabrechnung scheint formal korrekt zu sein.',
                priority: 'low',
                actionRequired: false
            });
        }
        return {
            documentId,
            documentType: 'UTILITY_BILL',
            extractedData,
            issues,
            recommendations,
            riskLevel,
            confidence: this.calculateConfidence(extractedData, issues),
            analyzedAt: new Date()
        };
    }
    /**
     * Analysiert eine Abmahnung
     */
    async analyzeWarningLetter(documentId, text) {
        const issues = [];
        const recommendations = [];
        let riskLevel = 'medium'; // Abmahnungen sind grundsätzlich ernst
        // Extrahiere Daten
        const extractedData = OCRService_1.default.extractWarningLetterData(text);
        // Prüfe auf Kündigungsandrohung
        if (extractedData.containsTerminationThreat) {
            issues.push({
                type: 'termination_threat',
                severity: 'critical',
                description: 'Das Schreiben enthält eine Kündigungsandrohung.',
                legalBasis: '§ 543 BGB, § 569 BGB',
                suggestedAction: 'Reagieren Sie umgehend und holen Sie rechtlichen Rat ein.'
            });
            riskLevel = 'high';
            recommendations.push({
                type: 'urgent_action',
                description: 'Kontaktieren Sie sofort einen Fachanwalt für Mietrecht.',
                priority: 'high',
                actionRequired: true
            });
        }
        // Prüfe Frist
        if (extractedData.deadline) {
            const deadline = this.parseGermanDate(extractedData.deadline);
            const daysUntilDeadline = this.calculateDaysUntil(deadline);
            if (daysUntilDeadline < 7) {
                issues.push({
                    type: 'urgent_deadline',
                    severity: 'critical',
                    description: `Die Frist läuft in ${daysUntilDeadline} Tagen ab.`,
                    suggestedAction: 'Handeln Sie sofort, um die Frist einzuhalten.'
                });
            }
            recommendations.push({
                type: 'deadline_response',
                description: `Reagieren Sie vor dem ${extractedData.deadline} auf die Abmahnung.`,
                priority: 'high',
                actionRequired: true
            });
        }
        // Prüfe Rechtmäßigkeit der Abmahnung
        const validityCheck = this.checkWarningLetterValidity(text);
        if (!validityCheck.valid) {
            issues.push({
                type: 'invalid_warning',
                severity: 'info',
                description: validityCheck.reason || 'Die Abmahnung könnte formale Mängel aufweisen',
                suggestedAction: 'Die Abmahnung könnte rechtlich anfechtbar sein.'
            });
            recommendations.push({
                type: 'challenge_warning',
                description: 'Prüfen Sie mit einem Anwalt, ob die Abmahnung rechtmäßig ist.',
                priority: 'medium',
                actionRequired: true
            });
        }
        // Allgemeine Empfehlungen
        recommendations.push({
            type: 'documentation',
            description: 'Dokumentieren Sie alle relevanten Umstände und sammeln Sie Beweise.',
            priority: 'high',
            actionRequired: true
        });
        recommendations.push({
            type: 'written_response',
            description: 'Antworten Sie schriftlich und bewahren Sie alle Kopien auf.',
            priority: 'high',
            actionRequired: true
        });
        return {
            documentId,
            documentType: 'WARNING_LETTER',
            extractedData,
            issues,
            recommendations,
            riskLevel,
            confidence: this.calculateConfidence(extractedData, issues),
            analyzedAt: new Date()
        };
    }
    /**
     * Analysiert ein generisches Dokument
     */
    async analyzeGenericDocument(documentId, text, documentType) {
        const issues = [];
        const recommendations = [];
        // Suche nach relevanten Rechtsbegriffen
        const legalTerms = this.extractLegalTerms(text);
        if (legalTerms.length > 0) {
            recommendations.push({
                type: 'legal_terms_found',
                description: `Folgende rechtliche Begriffe wurden gefunden: ${legalTerms.join(', ')}`,
                priority: 'medium',
                actionRequired: false
            });
        }
        recommendations.push({
            type: 'manual_review',
            description: 'Für eine detaillierte Analyse empfehlen wir eine manuelle Prüfung durch einen Fachanwalt.',
            priority: 'medium',
            actionRequired: false
        });
        return {
            documentId,
            documentType,
            extractedData: { legalTerms },
            issues,
            recommendations,
            riskLevel: 'low',
            confidence: 0.5,
            analyzedAt: new Date()
        };
    }
    /**
     * Hilfsmethoden für die Analyse
     */
    detectInvalidClauses(text) {
        const invalidClauses = [];
        // Schönheitsreparaturen ohne Renovierung bei Einzug
        if (/Schönheitsreparaturen.*Mieter/i.test(text) && !/renoviert|gestrichen|instand gesetzt/i.test(text)) {
            invalidClauses.push({
                description: 'Unwirksame Schönheitsreparaturklausel: Mieter muss nur renovieren, wenn die Wohnung bei Einzug renoviert war.',
                legalBasis: 'BGH VIII ZR 185/14'
            });
        }
        // Kleinreparaturklausel über 100€
        const smallRepairMatch = text.match(/Kleinreparatur.*?(\d+)\s*€/i);
        if (smallRepairMatch && parseInt(smallRepairMatch[1]) > 100) {
            invalidClauses.push({
                description: 'Unwirksame Kleinreparaturklausel: Einzelbetrag darf 100€ nicht überschreiten.',
                legalBasis: 'BGH VIII ZR 52/06'
            });
        }
        // Pauschale Tierhaltungsverbote
        if (/Tierhaltung.*verboten/i.test(text) && !/Hund|Katze/i.test(text)) {
            invalidClauses.push({
                description: 'Unwirksames pauschales Tierhaltungsverbot: Kleintierhaltung kann nicht generell verboten werden.',
                legalBasis: 'BGH VIII ZR 168/12'
            });
        }
        return invalidClauses;
    }
    async checkRentPrice(rentAmount, address, squareMeters) {
        // Vereinfachte Prüfung - in Produktion würde hier der MietspiegelService verwendet
        // Annahme: Durchschnittsmiete 12€/m²
        const averageRentPerSqm = 12;
        if (squareMeters) {
            const expectedRent = averageRentPerSqm * squareMeters;
            const percentageAbove = ((rentAmount - expectedRent) / expectedRent) * 100;
            return {
                excessive: percentageAbove > 10, // Mietpreisbremse: max 10% über Mietspiegel
                percentageAbove: Math.round(percentageAbove)
            };
        }
        return { excessive: false, percentageAbove: 0 };
    }
    checkMissingMandatoryFields(data) {
        const missing = [];
        if (!data.landlordName)
            missing.push('Vermieter');
        if (!data.tenantName)
            missing.push('Mieter');
        if (!data.address)
            missing.push('Mietobjekt-Adresse');
        if (!data.rentAmount)
            missing.push('Miethöhe');
        if (!data.startDate)
            missing.push('Mietbeginn');
        return missing;
    }
    checkTerminationClauses(text) {
        const issues = [];
        // Prüfe auf verkürzte Kündigungsfristen
        if (/Kündigungsfrist.*\d+\s*Monat/i.test(text)) {
            const match = text.match(/Kündigungsfrist.*?(\d+)\s*Monat/i);
            if (match && parseInt(match[1]) < 3) {
                issues.push({
                    type: 'invalid_termination_period',
                    severity: 'warning',
                    description: 'Unwirksame Kündigungsfrist: Gesetzliche Mindestfrist beträgt 3 Monate.',
                    legalBasis: '§ 573c BGB',
                    suggestedAction: 'Es gilt die gesetzliche Kündigungsfrist von 3 Monaten.'
                });
            }
        }
        return issues;
    }
    checkRenovationClauses(text) {
        const issues = [];
        // Prüfe auf starre Renovierungsfristen
        if (/alle\s*\d+\s*Jahre.*renovier/i.test(text)) {
            issues.push({
                type: 'invalid_renovation_clause',
                severity: 'info',
                description: 'Starre Renovierungsfristen sind unwirksam.',
                legalBasis: 'BGH VIII ZR 242/06',
                suggestedAction: 'Diese Klausel ist nicht bindend.'
            });
        }
        return issues;
    }
    checkBillingPeriod(startDate, endDate) {
        const start = this.parseGermanDate(startDate);
        const end = this.parseGermanDate(endDate);
        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());
        if (monthsDiff !== 12) {
            return {
                valid: false,
                reason: `Der Abrechnungszeitraum beträgt ${monthsDiff} Monate statt der üblichen 12 Monate.`
            };
        }
        return { valid: true };
    }
    detectNonDeductibleCosts(text) {
        const nonDeductible = [];
        const invalidCosts = [
            'Verwaltungskosten',
            'Instandhaltung',
            'Reparatur',
            'Bankgebühren',
            'Hauswart.*Lohn', // Hauswartlohn ist nicht umlagefähig
            'Rücklagen'
        ];
        invalidCosts.forEach(cost => {
            const regex = new RegExp(cost, 'i');
            if (regex.test(text)) {
                nonDeductible.push({ description: cost });
            }
        });
        return nonDeductible;
    }
    checkBillingDeadline(data) {
        if (!data.billingPeriodEnd)
            return { valid: true };
        const periodEnd = this.parseGermanDate(data.billingPeriodEnd);
        const now = new Date();
        const monthsSinceEnd = (now.getFullYear() - periodEnd.getFullYear()) * 12 +
            (now.getMonth() - periodEnd.getMonth());
        // Abrechnung muss innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums erfolgen
        return { valid: monthsSinceEnd <= 12 };
    }
    detectCalculationErrors(data) {
        const errors = [];
        // Vereinfachte Prüfung - in Produktion würde hier eine detaillierte Berechnung erfolgen
        if (data.totalAmount && data.heatingCosts && data.waterCosts) {
            const sum = (data.heatingCosts || 0) + (data.waterCosts || 0);
            if (Math.abs(data.totalAmount - sum) > sum * 0.5) {
                errors.push({
                    description: 'Die Summe der Einzelposten stimmt nicht mit dem Gesamtbetrag überein.'
                });
            }
        }
        return errors;
    }
    checkWarningLetterValidity(text) {
        // Prüfe ob Abmahnung konkret genug ist
        if (!/\d{1,2}\.\d{1,2}\.\d{4}/.test(text)) {
            return {
                valid: false,
                reason: 'Die Abmahnung enthält keine konkreten Datumsangaben.'
            };
        }
        // Prüfe ob Frist gesetzt wurde
        if (!/Frist|bis zum/i.test(text)) {
            return {
                valid: false,
                reason: 'Die Abmahnung enthält keine angemessene Frist zur Abhilfe.'
            };
        }
        return { valid: true };
    }
    extractLegalTerms(text) {
        const legalTerms = [
            'BGB', 'Mietminderung', 'Kündigung', 'Kaution', 'Nebenkosten',
            'Schönheitsreparaturen', 'Mietpreisbremse', 'Mietspiegel'
        ];
        return legalTerms.filter(term => new RegExp(term, 'i').test(text));
    }
    calculateConfidence(extractedData, issues) {
        const dataFieldsFound = Object.keys(extractedData).length;
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        // Basis-Konfidenz basierend auf extrahierten Daten
        let confidence = Math.min(dataFieldsFound / 10, 1.0);
        // Reduziere Konfidenz bei kritischen Problemen
        confidence -= criticalIssues * 0.1;
        return Math.max(Math.min(confidence, 1.0), 0.3);
    }
    parseGermanDate(dateStr) {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return new Date();
    }
    calculateDaysUntil(date) {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    async extractTextFromDocument(document) {
        // In Produktion würde hier der Text aus MinIO geladen und mit OCR verarbeitet
        // Für jetzt simulieren wir das
        logger_1.logger.info('Extracting text from document', { documentId: document.id });
        // Placeholder - würde in Produktion OCRService verwenden
        return 'Extracted text from document...';
    }
    async saveAnalysis(documentId, analysis) {
        try {
            // Erstelle die Analyse
            const savedAnalysis = await this.prisma.documentAnalysis.create({
                data: {
                    documentId,
                    extractedData: analysis.extractedData,
                    riskLevel: analysis.riskLevel.toUpperCase(),
                    confidence: analysis.confidence,
                    analyzedAt: analysis.analyzedAt
                }
            });
            // Erstelle Issues
            if (analysis.issues.length > 0) {
                await this.prisma.issue.createMany({
                    data: analysis.issues.map(issue => ({
                        analysisId: savedAnalysis.id,
                        type: issue.type,
                        severity: issue.severity.toUpperCase(),
                        description: issue.description,
                        legalBasis: issue.legalBasis,
                        suggestedAction: issue.suggestedAction
                    }))
                });
            }
            // Erstelle Recommendations
            if (analysis.recommendations.length > 0) {
                await this.prisma.recommendation.createMany({
                    data: analysis.recommendations.map(rec => ({
                        analysisId: savedAnalysis.id,
                        type: rec.type,
                        description: rec.description,
                        priority: rec.priority.toUpperCase(),
                        actionRequired: rec.actionRequired
                    }))
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error saving analysis:', error);
            throw error;
        }
    }
    /**
     * Ruft eine gespeicherte Analyse ab
     */
    async getAnalysis(documentId) {
        try {
            const analysis = await this.prisma.documentAnalysis.findUnique({
                where: { documentId },
                include: {
                    issues: true,
                    recommendations: true,
                    document: true
                }
            });
            if (!analysis) {
                return null;
            }
            return {
                documentId: analysis.documentId,
                documentType: analysis.document.documentType,
                extractedData: analysis.extractedData,
                issues: analysis.issues.map(issue => ({
                    type: issue.type,
                    severity: issue.severity.toLowerCase(),
                    description: issue.description,
                    legalBasis: issue.legalBasis || undefined,
                    suggestedAction: issue.suggestedAction || undefined
                })),
                recommendations: analysis.recommendations.map(rec => ({
                    type: rec.type,
                    description: rec.description,
                    priority: rec.priority.toLowerCase(),
                    actionRequired: rec.actionRequired
                })),
                riskLevel: analysis.riskLevel.toLowerCase(),
                confidence: analysis.confidence,
                analyzedAt: analysis.analyzedAt
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving analysis:', error);
            throw error;
        }
    }
    /**
     * Ruft alle Analysen eines Nutzers ab
     */
    async getUserAnalyses(userId) {
        try {
            const documents = await this.prisma.document.findMany({
                where: { userId },
                include: {
                    analysis: {
                        include: {
                            issues: true,
                            recommendations: true
                        }
                    }
                }
            });
            return documents
                .filter(doc => doc.analysis)
                .map(doc => ({
                documentId: doc.analysis.documentId,
                documentType: doc.documentType,
                extractedData: doc.analysis.extractedData,
                issues: doc.analysis.issues.map(issue => ({
                    type: issue.type,
                    severity: issue.severity.toLowerCase(),
                    description: issue.description,
                    legalBasis: issue.legalBasis || undefined,
                    suggestedAction: issue.suggestedAction || undefined
                })),
                recommendations: doc.analysis.recommendations.map(rec => ({
                    type: rec.type,
                    description: rec.description,
                    priority: rec.priority.toLowerCase(),
                    actionRequired: rec.actionRequired
                })),
                riskLevel: doc.analysis.riskLevel.toLowerCase(),
                confidence: doc.analysis.confidence,
                analyzedAt: doc.analysis.analyzedAt
            }));
        }
        catch (error) {
            logger_1.logger.error('Error retrieving user analyses:', error);
            throw error;
        }
    }
}
exports.DocumentAnalysisService = DocumentAnalysisService;
