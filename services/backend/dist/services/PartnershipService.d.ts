type PartnershipType = 'LEGAL_TECH' | 'REAL_ESTATE' | 'FINANCIAL_SERVICES' | 'INSURANCE' | 'PROPERTY_MANAGEMENT' | 'GOVERNMENT' | 'NON_PROFIT' | 'OTHER';
type PartnershipStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
interface Partnership {
    id: string;
    organizationId: string;
    partnerName: string;
    partnerType: PartnershipType;
    partnerId?: string;
    status: PartnershipStatus;
    integrationType?: string;
    apiKey?: string;
    config?: any;
    startDate: Date;
    endDate?: Date;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface PartnershipInteraction {
    id: string;
    partnershipId: string;
    interactionType: string;
    description?: string;
    metadata?: any;
    createdAt: Date;
}
export declare class PartnershipService {
    /**
     * Create a new partnership
     */
    createPartnership(data: {
        organizationId: string;
        partnerName: string;
        partnerType: PartnershipType;
        partnerId?: string;
        status?: PartnershipStatus;
        integrationType?: string;
        apiKey?: string;
        config?: any;
        contactEmail?: string;
        contactPhone?: string;
        notes?: string;
    }): Promise<Partnership>;
    /**
     * Get all partnerships for an organization
     */
    getPartnerships(organizationId: string): Promise<Partnership[]>;
    /**
     * Get a specific partnership by ID
     */
    getPartnershipById(id: string): Promise<Partnership | null>;
    /**
     * Update a partnership
     */
    updatePartnership(id: string, data: Partial<Partnership>): Promise<Partnership>;
    /**
     * Delete a partnership
     */
    deletePartnership(id: string): Promise<Partnership>;
    /**
     * Record a partnership interaction
     */
    recordInteraction(data: {
        partnershipId: string;
        interactionType: string;
        description?: string;
        metadata?: any;
    }): Promise<PartnershipInteraction>;
    /**
     * Get partnership interactions
     */
    getInteractions(partnershipId: string, limit?: number): Promise<PartnershipInteraction[]>;
    /**
     * Helper method to convert camelCase to snake_case
     */
    private camelToSnake;
    /**
     * Helper method to generate IDs
     */
    private generateId;
    /**
     * Map database row to Partnership interface
     */
    private mapPartnership;
    /**
     * Map database row to PartnershipInteraction interface
     */
    private mapInteraction;
}
export {};
