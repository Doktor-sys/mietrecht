export declare class BVerfGApiClient {
    private baseUrl;
    private apiKey;
    constructor();
    getDecisions(limit?: number): Promise<any[]>;
    getDecisionById(id: string): Promise<any>;
    searchDecisions(keyword: string, limit?: number): Promise<any[]>;
    getCourtDivisions(): Promise<string[]>;
    private getMockDecisions;
    private getMockDecision;
    private getMockSearchResults;
    private getMockCourtDivisions;
}
//# sourceMappingURL=bverfgApiClient.d.ts.map