import { PrismaClient } from '@prisma/client';
interface IntegrationConfig {
    id: string;
    name: string;
    type: string;
    baseUrl: string;
    apiKey?: string;
    accessToken?: string;
    secretKey?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class IntegrationService {
    private prisma;
    private integrations;
    constructor(prisma: PrismaClient);
    /**
     * Initialisiert alle aktiven Integrationen
     */
    initializeIntegrations(): Promise<void>;
    /**
     * Initialisiert eine einzelne Integration
     */
    private initializeIntegration;
    /**
     * Holt eine Integration anhand ihrer ID
     */
    getIntegration(integrationId: string): any;
    /**
     * Holt eine Integration anhand ihres Typs
     */
    getIntegrationByType(type: string): any;
    /**
     * Bestimmt den Typ einer Integration
     */
    private getIntegrationType;
    /**
     * Fügt eine neue Integration hinzu
     */
    addIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig>;
    /**
     * Aktualisiert eine bestehende Integration
     */
    updateIntegration(integrationId: string, config: Partial<Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<IntegrationConfig>;
    /**
     * Löscht eine Integration
     */
    deleteIntegration(integrationId: string): Promise<void>;
    /**
     * Synchronisiert Daten für alle aktiven Integrationen
     */
    syncAllIntegrations(): Promise<void>;
    /**
     * Holt den Status aller Integrationen
     */
    getIntegrationStatus(): Promise<Array<{
        id: string;
        name: string;
        type: string;
        active: boolean;
        lastSync?: Date;
    }>>;
}
export {};
