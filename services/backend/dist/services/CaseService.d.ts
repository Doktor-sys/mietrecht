import { PrismaClient, Case, CaseStatus } from '@prisma/client';
interface CaseWithDetails extends Case {
    user?: any;
    documents?: any[];
    messages?: any[];
}
export declare class CaseService {
    private prisma;
    private cacheService;
    constructor(prisma: PrismaClient);
    /**
     * Holt einen Fall anhand seiner ID (mit Caching)
     */
    getCaseById(id: string): Promise<CaseWithDetails | null>;
    /**
     * Erstellt einen neuen Fall
     */
    createCase(caseData: {
        userId: string;
        title: string;
        description?: string;
        status?: CaseStatus;
        priority?: string;
        category?: string;
    }): Promise<Case>;
    /**
     * Aktualisiert einen Fall
     */
    updateCase(id: string, updates: Partial<Case>): Promise<Case>;
    /**
     * Holt alle Fälle eines Benutzers mit Pagination
     */
    getUserCases(userId: string, page?: number, pageSize?: number, status?: CaseStatus): Promise<{
        cases: Case[];
        totalCount: number;
    }>;
    /**
     * Holt Fälle mit komplexen Filtern
     */
    getCasesWithFilters(filters: {
        userId?: string;
        status?: CaseStatus;
        priority?: string;
        category?: string;
        searchQuery?: string;
        fromDate?: Date;
        toDate?: Date;
    }, page?: number, pageSize?: number): Promise<{
        cases: Case[];
        totalCount: number;
    }>;
    /**
     * Löscht einen Fall
     */
    deleteCase(id: string): Promise<void>;
    /**
     * Schließt einen Fall
     */
    closeCase(id: string): Promise<Case>;
    /**
     * Löscht den Cache für einen Fall
     */
    clearCaseCache(id: string): void;
    /**
     * Holt Cache-Statistiken
     */
    getCacheStats(): any;
}
export {};
