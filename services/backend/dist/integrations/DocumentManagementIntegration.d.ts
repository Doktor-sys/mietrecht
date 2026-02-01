interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    metadata: Record<string, any>;
    url: string;
}
interface Folder {
    id: string;
    name: string;
    parentId?: string;
    createdAt: Date;
    updatedAt: Date;
    path: string;
}
interface DocumentVersion {
    id: string;
    documentId: string;
    version: number;
    createdAt: Date;
    createdBy: string;
    comment?: string;
    url: string;
}
export declare class DocumentManagementIntegration {
    private apiClient;
    private baseUrl;
    private accessToken;
    constructor(baseUrl: string, accessToken: string);
    /**
     * Holt alle Dokumente in einem Ordner
     */
    getDocuments(folderId?: string): Promise<Document[]>;
    /**
     * Holt ein bestimmtes Dokument anhand seiner ID
     */
    getDocumentById(documentId: string): Promise<Document>;
    /**
     * Lädt ein neues Dokument hoch
     */
    uploadDocument(fileBuffer: Buffer, filename: string, folderId?: string, tags?: string[]): Promise<Document>;
    /**
     * Aktualisiert ein bestehendes Dokument
     */
    updateDocument(documentId: string, updates: Partial<Document>): Promise<Document>;
    /**
     * Löscht ein Dokument
     */
    deleteDocument(documentId: string): Promise<void>;
    /**
     * Sucht nach Dokumenten
     */
    searchDocuments(query: string, filters?: {
        tags?: string[];
        type?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<Document[]>;
    /**
     * Holt alle Ordner
     */
    getFolders(parentId?: string): Promise<Folder[]>;
    /**
     * Erstellt einen neuen Ordner
     */
    createFolder(name: string, parentId?: string): Promise<Folder>;
    /**
     * Holt Versionen eines Dokuments
     */
    getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
    /**
     * Stellt eine frühere Version eines Dokuments wieder her
     */
    restoreDocumentVersion(documentId: string, versionId: string): Promise<Document>;
    /**
     * Fügt Tags zu einem Dokument hinzu
     */
    addTagsToDocument(documentId: string, tags: string[]): Promise<Document>;
    /**
     * Entfernt Tags von einem Dokument
     */
    removeTagsFromDocument(documentId: string, tags: string[]): Promise<Document>;
}
export {};
