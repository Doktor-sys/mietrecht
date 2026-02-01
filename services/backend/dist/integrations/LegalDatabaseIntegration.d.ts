interface LegalDocument {
    id: string;
    title: string;
    content: string;
    type: 'case_law' | 'statute' | 'regulation' | 'article' | 'commentary';
    jurisdiction: string;
    date: Date;
    citation?: string;
    keywords: string[];
    relatedDocuments: string[];
}
interface SearchResult {
    documents: LegalDocument[];
    totalResults: number;
    currentPage: number;
    totalPages: number;
}
interface Statute {
    id: string;
    title: string;
    section: string;
    content: string;
    effectiveDate: Date;
    repealedDate?: Date;
    amendments: Amendment[];
}
interface Amendment {
    date: Date;
    description: string;
    changedSections: string[];
}
export declare class LegalDatabaseIntegration {
    private apiClient;
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    /**
     * Sucht nach juristischen Dokumenten
     */
    searchDocuments(query: string, filters?: {
        type?: string;
        jurisdiction?: string;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<SearchResult>;
    /**
     * Holt ein bestimmtes juristisches Dokument anhand seiner ID
     */
    getDocumentById(documentId: string): Promise<LegalDocument>;
    /**
     * Holt verwandte Dokumente
     */
    getRelatedDocuments(documentId: string, limit?: number): Promise<LegalDocument[]>;
    /**
     * Holt eine Gesetzesnorm anhand ihrer Kennung
     */
    getStatuteById(statuteId: string): Promise<Statute>;
    /**
     * Sucht nach Gesetzesnormen
     */
    searchStatutes(query: string, jurisdiction?: string): Promise<Statute[]>;
    /**
     * Holt aktuelle rechtliche Entwicklungen
     */
    getRecentLegalDevelopments(limit?: number): Promise<LegalDocument[]>;
    /**
     * Holt rechtliche Kommentare und Analysen
     */
    getCommentaries(topic: string, limit?: number): Promise<LegalDocument[]>;
    /**
     * Holt Zitierhäufigkeiten für ein Dokument
     */
    getDocumentCitations(documentId: string): Promise<number>;
    /**
     * Holt die rechtliche Historie eines Dokuments
     */
    getDocumentHistory(documentId: string): Promise<LegalDocument[]>;
}
export {};
