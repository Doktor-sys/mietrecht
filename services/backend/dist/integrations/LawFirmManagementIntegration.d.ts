interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    cases: Case[];
}
interface Case {
    id: string;
    clientId: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}
interface Matter {
    id: string;
    caseId: string;
    billingMethod: 'hourly' | 'fixed' | 'contingency';
    hourlyRate?: number;
    fixedFee?: number;
    contingencyPercentage?: number;
    billedHours: number;
    totalBilled: number;
}
export declare class LawFirmManagementIntegration {
    private apiClient;
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    /**
     * Holt alle Mandanten aus dem Kanzleimanagementsystem
     */
    getClients(): Promise<Client[]>;
    /**
     * Holt einen bestimmten Mandanten anhand seiner ID
     */
    getClientById(clientId: string): Promise<Client>;
    /**
     * Holt alle Fälle eines Mandanten
     */
    getCasesForClient(clientId: string): Promise<Case[]>;
    /**
     * Holt alle Fälle aus dem Kanzleimanagementsystem
     */
    getAllCases(): Promise<Case[]>;
    /**
     * Holt einen bestimmten Fall anhand seiner ID
     */
    getCaseById(caseId: string): Promise<Case>;
    /**
     * Erstellt einen neuen Fall im Kanzleimanagementsystem
     */
    createCase(caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>): Promise<Case>;
    /**
     * Aktualisiert einen bestehenden Fall
     */
    updateCase(caseId: string, caseData: Partial<Case>): Promise<Case>;
    /**
     * Holt die Abrechnungsinformationen für einen Fall
     */
    getMatterForCase(caseId: string): Promise<Matter>;
    /**
     * Aktualisiert die Abrechnungsinformationen für einen Fall
     */
    updateMatter(caseId: string, matterData: Partial<Matter>): Promise<Matter>;
    /**
     * Synchronisiert Mandanten zwischen SmartLaw und dem Kanzleimanagementsystem
     */
    syncClients(): Promise<void>;
    /**
     * Synchronisiert Fälle zwischen SmartLaw und dem Kanzleimanagementsystem
     */
    syncCases(): Promise<void>;
}
export {};
