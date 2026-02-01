export declare class LandgerichteApiClient {
    private baseUrl;
    private apiKey;
    constructor();
    getDecisions(limit?: number, region?: string): Promise<any[]>;
    getDecisionById(id: string): Promise<any>;
    getRegions(): Promise<string[]>;
    private getMockDecisions;
    private getMockDecision;
    private getMockRegions;
}
//# sourceMappingURL=landgerichteApiClient.d.ts.map