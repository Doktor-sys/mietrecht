import { PrismaClient, User, Case, Document } from '@prisma/client';
interface QueryOptions {
    cache?: boolean;
    ttl?: number;
    optimize?: boolean;
}
export declare class OptimizedDatabaseService {
    private prisma;
    private queryOptimizer;
    private databaseOptimizer;
    private cacheService;
    constructor(prisma: PrismaClient);
    /**
     * Holt einen Benutzer mit optimierten Abfragen
     */
    getUserById(id: string, options?: QueryOptions): Promise<User | null>;
    /**
     * Holt Fälle eines Benutzers mit Paginierung
     */
    getUserCases(userId: string, page?: number, pageSize?: number, options?: QueryOptions): Promise<{
        cases: Case[];
        totalCount: number;
    }>;
    /**
     * Holt Dokumente mit komplexen Filtern
     */
    getDocumentsWithFilters(filters: {
        userId?: string;
        caseId?: string;
        documentType?: string;
        status?: string;
        searchQuery?: string;
    }, page?: number, pageSize?: number, options?: QueryOptions): Promise<{
        documents: Document[];
        totalCount: number;
    }>;
    /**
     * Erstellt einen neuen Fall mit optimierten Abfragen
     */
    createCase(caseData: {
        userId: string;
        title: string;
        description?: string;
        status?: string;
        priority?: string;
        category?: string;
    }): Promise<Case>;
    /**
     * Aktualisiert einen Fall
     */
    updateCase(id: string, updates: Partial<Case>): Promise<Case>;
    /**
     * Löscht einen Fall
     */
    deleteCase(id: string): Promise<void>;
    /**
     * Löscht Cache-Einträge für Benutzerfälle
     */
    private invalidateUserCasesCache;
    /**
     * Analysiert langsame Abfragen
     */
    analyzeSlowQueries(): Promise<void>;
    /**
     * Generiert Index-Empfehlungen
     */
    generateIndexRecommendations(): Promise<void>;
}
export {};
