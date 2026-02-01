interface CourtCase {
    id: string;
    courtId: string;
    caseNumber: string;
    title: string;
    parties: Party[];
    filingDate: Date;
    status: 'filed' | 'in_progress' | 'closed' | 'dismissed';
    nextHearing?: Date;
    judge?: string;
    documents: CourtDocument[];
}
interface Party {
    id: string;
    name: string;
    type: 'plaintiff' | 'defendant' | 'attorney' | 'judge';
    contact?: ContactInfo;
}
interface ContactInfo {
    email?: string;
    phone?: string;
    address?: string;
}
interface CourtDocument {
    id: string;
    name: string;
    type: 'pleading' | 'evidence' | 'order' | 'judgment';
    filingDate: Date;
    url?: string;
}
interface Court {
    id: string;
    name: string;
    jurisdiction: string;
    address?: string;
    website?: string;
}
export declare class CourtDataExchangeIntegration {
    private apiClient;
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    /**
     * Holt alle Gerichte in einer bestimmten Jurisdiktion
     */
    getCourts(jurisdiction: string): Promise<Court[]>;
    /**
     * Holt einen bestimmten Fall anhand seiner ID
     */
    getCaseById(caseId: string): Promise<CourtCase>;
    /**
     * Sucht nach Fällen basierend auf verschiedenen Kriterien
     */
    searchCases(criteria: {
        caseNumber?: string;
        partyName?: string;
        courtId?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<CourtCase[]>;
    /**
     * Reicht einen neuen Fall beim Gericht ein
     */
    fileCase(caseData: Omit<CourtCase, 'id' | 'documents'>): Promise<CourtCase>;
    /**
     * Holt alle Dokumente für einen bestimmten Fall
     */
    getCaseDocuments(caseId: string): Promise<CourtDocument[]>;
    /**
     * Reicht ein Dokument bei einem Fall ein
     */
    fileDocument(caseId: string, documentData: Omit<CourtDocument, 'id'>): Promise<CourtDocument>;
    /**
     * Holt Informationen über das nächste Verhandlungstermin
     */
    getNextHearing(caseId: string): Promise<Date | null>;
    /**
     * Holt den Status eines Falls
     */
    getCaseStatus(caseId: string): Promise<string>;
    /**
     * Holt aktuelle Gerichtsentscheidungen
     */
    getRecentDecisions(limit?: number): Promise<CourtCase[]>;
}
export {};
