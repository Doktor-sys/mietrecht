export declare class BGHApiClient {
    private baseUrl;
    private apiKey;
    constructor();
    getDecisions(limit?: number): Promise<any[]>;
    getDecisionById(id: string): Promise<any>;
    private getMockDecisions;
    private getMockDecision;
}
//# sourceMappingURL=bghApiClient.d.ts.map