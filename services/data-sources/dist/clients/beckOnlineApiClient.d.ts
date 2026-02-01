export declare class BeckOnlineApiClient {
    private baseUrl;
    private apiKey;
    constructor();
    getArticles(limit?: number): Promise<any[]>;
    getArticleById(id: string): Promise<any>;
    searchArticles(keyword: string, limit?: number): Promise<any[]>;
    private getMockArticles;
    private getMockArticle;
    private getMockSearchResults;
}
//# sourceMappingURL=beckOnlineApiClient.d.ts.map