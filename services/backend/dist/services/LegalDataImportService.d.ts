import { PrismaClient, LegalKnowledge, LegalType } from '@prisma/client';
export interface LegalDataImport {
    type: LegalType;
    reference: string;
    title: string;
    content: string;
    jurisdiction: string;
    effectiveDate: Date;
    tags: string[];
}
export interface ImportResult {
    imported: number;
    updated: number;
    failed: number;
    errors: Array<{
        reference: string;
        error: string;
        data: any;
    }>;
}
export interface ImportOptions {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateOnly?: boolean;
    batchSize?: number;
}
export interface Statistics {
    total: number;
    byType: Record<string, number>;
    recentUpdates: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
}
export declare class LegalDataImportService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Importiert Rechtsdaten aus einem Array
     */
    importLegalData(data: LegalDataImport[], options?: ImportOptions): Promise<ImportResult>;
    /**
     * Importiert Rechtsdaten aus einer JSON-Datei
     */
    importFromFile(filePath: string, options?: ImportOptions): Promise<ImportResult>;
    /**
     * Importiert BGB-Paragraphen
     */
    importBGBParagraphs(paragraphs: Array<{
        paragraph: string;
        title: string;
        content: string;
    }>): Promise<ImportResult>;
    /**
     * Importiert Gerichtsentscheidungen
     */
    importCourtDecisions(decisions: Array<{
        reference: string;
        title: string;
        content: string;
        date: Date;
    }>): Promise<ImportResult>;
    /**
     * Aktualisiert bestehende Rechtsdaten
     */
    updateLegalData(reference: string, updates: Partial<LegalDataImport>): Promise<LegalKnowledge>;
    /**
     * Löscht veraltete Rechtsdaten
     */
    deleteOutdatedData(olderThan: Date): Promise<number>;
    /**
     * Findet Duplikate
     */
    findDuplicates(): Promise<Array<{
        reference: string;
        count: number;
    }>>;
    /**
     * Bereinigt Duplikate
     */
    cleanupDuplicates(): Promise<number>;
    /**
     * Ruft Statistiken ab
     */
    getStatistics(): Promise<Statistics>;
    /**
     * Private Hilfsmethoden
     */
    private validateLegalData;
    private processBatch;
    private createVersionSnapshot;
}
