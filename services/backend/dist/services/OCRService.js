"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tesseract_js_1 = require("tesseract.js");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const logger_1 = require("../utils/logger");
class OCRService {
    constructor() {
        this.worker = null;
    }
    async initialize() {
        if (!this.worker) {
            logger_1.logger.info('Initializing Tesseract OCR worker for German language');
            this.worker = await (0, tesseract_js_1.createWorker)('deu');
        }
    }
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            logger_1.logger.info('Tesseract OCR worker terminated');
        }
    }
    /**
     * Extract text from PDF document
     */
    async extractTextFromPDF(buffer) {
        try {
            logger_1.logger.info('Extracting text from PDF document');
            const data = await (0, pdf_parse_1.default)(buffer);
            return {
                text: data.text,
                confidence: 1.0, // PDF text extraction is deterministic
                language: 'deu',
                pageCount: data.numpages,
            };
        }
        catch (error) {
            logger_1.logger.error('Error extracting text from PDF:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }
    /**
     * Extract text from image using OCR
     */
    async extractTextFromImage(buffer) {
        try {
            await this.initialize();
            logger_1.logger.info('Performing OCR on image document');
            const { data } = await this.worker.recognize(buffer);
            return {
                text: data.text,
                confidence: data.confidence / 100, // Convert to 0-1 range
                language: 'deu',
            };
        }
        catch (error) {
            logger_1.logger.error('Error performing OCR on image:', error);
            throw new Error('Failed to perform OCR on image');
        }
    }
    /**
     * Extract structured data from rental contract text
     */
    extractRentalContractData(text) {
        const data = {};
        // Extract landlord name
        const landlordMatch = text.match(/Vermieter[:\s]+([^\n]+)/i);
        if (landlordMatch) {
            data.landlordName = landlordMatch[1].trim();
        }
        // Extract tenant name
        const tenantMatch = text.match(/Mieter[:\s]+([^\n]+)/i);
        if (tenantMatch) {
            data.tenantName = tenantMatch[1].trim();
        }
        // Extract address
        const addressMatch = text.match(/(?:Mietobjekt|Wohnung)[:\s]+([^\n]+)/i);
        if (addressMatch) {
            data.address = addressMatch[1].trim();
        }
        // Extract rent amount
        const rentMatch = text.match(/(?:Grundmiete|Kaltmiete|Nettomiete)[:\s]+(\d+[.,]\d+)/i);
        if (rentMatch) {
            data.rentAmount = parseFloat(rentMatch[1].replace(',', '.'));
        }
        // Extract deposit
        const depositMatch = text.match(/(?:Kaution|Sicherheit)[:\s]+(\d+[.,]\d+)/i);
        if (depositMatch) {
            data.deposit = parseFloat(depositMatch[1].replace(',', '.'));
        }
        // Extract additional costs
        const costsMatch = text.match(/(?:Nebenkosten|Betriebskosten)[:\s]+(\d+[.,]\d+)/i);
        if (costsMatch) {
            data.additionalCosts = parseFloat(costsMatch[1].replace(',', '.'));
        }
        // Extract square meters
        const sqmMatch = text.match(/(\d+[.,]?\d*)\s*(?:m²|qm|Quadratmeter)/i);
        if (sqmMatch) {
            data.squareMeters = parseFloat(sqmMatch[1].replace(',', '.'));
        }
        // Extract room count
        const roomMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:Zimmer|Räume)/i);
        if (roomMatch) {
            data.roomCount = parseFloat(roomMatch[1].replace(',', '.'));
        }
        // Extract start date
        const startDateMatch = text.match(/(?:Mietbeginn|ab dem)[:\s]+(\d{1,2}\.\d{1,2}\.\d{4})/i);
        if (startDateMatch) {
            data.startDate = startDateMatch[1];
        }
        // Extract end date (if fixed-term)
        const endDateMatch = text.match(/(?:Mietende|bis zum)[:\s]+(\d{1,2}\.\d{1,2}\.\d{4})/i);
        if (endDateMatch) {
            data.endDate = endDateMatch[1];
        }
        logger_1.logger.info('Extracted rental contract data', { fieldsFound: Object.keys(data).length });
        return data;
    }
    /**
     * Preprocess German legal text
     */
    preprocessGermanLegalText(text) {
        // Remove excessive whitespace
        let cleanedText = text.replace(/\s+/g, ' ').trim();
        // Normalize German special characters
        let normalizedText = cleanedText
            .replace(/ß/g, 'ss')
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/Ä/g, 'Ae')
            .replace(/Ö/g, 'Oe')
            .replace(/Ü/g, 'Ue');
        // Split into paragraphs
        const paragraphs = cleanedText
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
        // Split into sentences
        const sentences = cleanedText
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        logger_1.logger.info('Preprocessed German legal text', {
            originalLength: text.length,
            cleanedLength: cleanedText.length,
            paragraphCount: paragraphs.length,
            sentenceCount: sentences.length,
        });
        return {
            originalText: text,
            cleanedText,
            normalizedText,
            paragraphs,
            sentences,
        };
    }
    /**
     * Extract utility bill data
     */
    extractUtilityBillData(text) {
        const data = {};
        // Extract billing period
        const periodMatch = text.match(/(?:Abrechnungszeitraum|Zeitraum)[:\s]+(\d{1,2}\.\d{1,2}\.\d{4})\s*[-–]\s*(\d{1,2}\.\d{1,2}\.\d{4})/i);
        if (periodMatch) {
            data.billingPeriodStart = periodMatch[1];
            data.billingPeriodEnd = periodMatch[2];
        }
        // Extract total amount
        const totalMatch = text.match(/(?:Gesamtbetrag|Nachzahlung|Guthaben)[:\s]+(\d+[.,]\d+)/i);
        if (totalMatch) {
            data.totalAmount = parseFloat(totalMatch[1].replace(',', '.'));
        }
        // Extract heating costs
        const heatingMatch = text.match(/(?:Heizkosten)[:\s]+(\d+[.,]\d+)/i);
        if (heatingMatch) {
            data.heatingCosts = parseFloat(heatingMatch[1].replace(',', '.'));
        }
        // Extract water costs
        const waterMatch = text.match(/(?:Wasserkosten|Wasser)[:\s]+(\d+[.,]\d+)/i);
        if (waterMatch) {
            data.waterCosts = parseFloat(waterMatch[1].replace(',', '.'));
        }
        logger_1.logger.info('Extracted utility bill data', { fieldsFound: Object.keys(data).length });
        return data;
    }
    /**
     * Extract warning letter data
     */
    extractWarningLetterData(text) {
        const data = {};
        // Extract date
        const dateMatch = text.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (dateMatch) {
            data.date = dateMatch[1];
        }
        // Extract deadline
        const deadlineMatch = text.match(/(?:Frist|bis zum)[:\s]+(\d{1,2}\.\d{1,2}\.\d{4})/i);
        if (deadlineMatch) {
            data.deadline = deadlineMatch[1];
        }
        // Check for termination threat
        const terminationThreat = /Kündigung/i.test(text);
        data.containsTerminationThreat = terminationThreat;
        // Check for legal action threat
        const legalThreat = /(?:Klage|Gericht|rechtliche Schritte)/i.test(text);
        data.containsLegalThreat = legalThreat;
        logger_1.logger.info('Extracted warning letter data', { fieldsFound: Object.keys(data).length });
        return data;
    }
}
exports.default = new OCRService();
