import { PrismaClient, Document, DocumentStatus, DocumentType } from '@prisma/client';
interface DocumentWithDetails extends Document {
    user?: any;
    case?: any;
}
export declare class DocumentService {
    private prisma;
    private cacheService;
    constructor(prisma: PrismaClient);
    /**
     * Holt ein Dokument anhand seiner ID (mit Caching)
     */
    getDocumentById(id: string): Promise<DocumentWithDetails | null>;
    /**
     * Erstellt ein neues Dokument
     */
    createDocument(documentData: {
        userId: string;
        title: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
        documentType: DocumentType;
        caseId?: string;
        description?: string;
    }): Promise<Document>;
    /**
     * Aktualisiert ein Dokument
     */
    updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
    /**
     * Holt alle Dokumente eines Benutzers mit Pagination
     */
    getUserDocuments(userId: string, page?: number, pageSize?: number, documentType?: DocumentType, status?: DocumentStatus): Promise<{
        documents: Document[];
        totalCount: number;
    }>;
    /**
     * Holt Dokumente mit komplexen Filtern
     */
    getDocumentsWithFilters(filters: {
        userId?: string;
        caseId?: string;
        documentType?: DocumentType;
        status?: DocumentStatus;
        searchQuery?: string;
        fromDate?: Date;
        toDate?: Date;
    }, page?: number, pageSize?: number): Promise<{
        documents: Document[];
        totalCount: number;
    }>;
    /**
     * Löscht ein Dokument
     */
    deleteDocument(id: string): Promise<void>;
    /**
     * Setzt den Analysestatus eines Dokuments
     */
    setDocumentAnalysisStatus(id: string, status: DocumentStatus, analysis?: any): Promise<Document>;
    /**
     * Löscht den Cache für ein Dokument
     */
    clearDocumentCache(id: string): void;
    /**
     * Holt Cache-Statistiken
     */
    getCacheStats(): any;
}
export {};
