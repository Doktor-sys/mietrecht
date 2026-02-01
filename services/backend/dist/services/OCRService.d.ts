export interface OCRResult {
    text: string;
    confidence: number;
    language: string;
    pageCount?: number;
}
export interface ExtractedRentalData {
    landlordName?: string;
    tenantName?: string;
    address?: string;
    rentAmount?: number;
    startDate?: string;
    endDate?: string;
    deposit?: number;
    additionalCosts?: number;
    squareMeters?: number;
    roomCount?: number;
}
export interface PreprocessedText {
    originalText: string;
    cleanedText: string;
    normalizedText: string;
    paragraphs: string[];
    sentences: string[];
}
declare class OCRService {
    private worker;
    initialize(): Promise<void>;
    terminate(): Promise<void>;
    /**
     * Extract text from PDF document
     */
    extractTextFromPDF(buffer: Buffer): Promise<OCRResult>;
    /**
     * Extract text from image using OCR
     */
    extractTextFromImage(buffer: Buffer): Promise<OCRResult>;
    /**
     * Extract structured data from rental contract text
     */
    extractRentalContractData(text: string): ExtractedRentalData;
    /**
     * Preprocess German legal text
     */
    preprocessGermanLegalText(text: string): PreprocessedText;
    /**
     * Extract utility bill data
     */
    extractUtilityBillData(text: string): Record<string, any>;
    /**
     * Extract warning letter data
     */
    extractWarningLetterData(text: string): Record<string, any>;
}
declare const _default: OCRService;
export default _default;
