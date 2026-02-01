export declare class JurisApiClient {
    private baseUrl;
    private apiKey;
    constructor();
    getDocuments(limit?: number): Promise<any[]>;
    getDocumentById(id: string): Promise<any>;
    searchDocuments(keyword: string, limit?: number): Promise<any[]>;
    getDatabases(): Promise<string[]>;
    private getMockDocuments;
    private getMockDocument;
    private getMockSearchResults;
    private getMockDatabases;
}
//# sourceMappingURL=jurisApiClient.d.ts.map