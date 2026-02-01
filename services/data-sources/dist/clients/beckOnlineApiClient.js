"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeckOnlineApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 600 });
class BeckOnlineApiClient {
    constructor() {
        this.baseUrl = process.env.BECK_ONLINE_API_BASE_URL || 'https://beck-online.api.example.com';
        this.apiKey = process.env.BECK_ONLINE_API_KEY || 'dummy-key';
    }
    async getArticles(limit = 10) {
        const cacheKey = `beck_online_articles_${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/articles`, {
                params: {
                    limit,
                    category: 'mietrecht'
                },
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching Beck Online articles:', error);
            return this.getMockArticles(limit);
        }
    }
    async getArticleById(id) {
        const cacheKey = `beck_online_article_${id}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/articles/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching Beck Online article ${id}:`, error);
            return this.getMockArticle(id);
        }
    }
    async searchArticles(keyword, limit = 10) {
        const cacheKey = `beck_online_search_${keyword}_${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/search`, {
                params: {
                    q: keyword,
                    limit
                },
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error(`Error searching Beck Online articles for "${keyword}":`, error);
            return this.getMockSearchResults(keyword, limit);
        }
    }
    getMockArticles(limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `beck-${i + 1}`,
            title: `Beck Online Artikel ${i + 1} zum Mietrecht`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Zusammenfassung des Beck Online Artikels ${i + 1} im Bereich Mietrecht.`,
            url: `https://beck-online.example.com/artikel/${i + 1}`,
            topics: ['Mietrecht', 'Rechtsprechung', 'Praxis'],
            journal: 'NJW',
            type: 'Artikel'
        }));
    }
    getMockArticle(id) {
        return {
            id,
            title: `Beck Online Artikel ${id} zum Mietrecht`,
            date: new Date().toISOString().split('T')[0],
            summary: `Ausführliche Zusammenfassung des Beck Online Artikels ${id} im Bereich Mietrecht.`,
            content: `Vollständiger Text des Beck Online Artikels ${id}.`,
            url: `https://beck-online.example.com/artikel/${id}`,
            topics: ['Mietrecht', 'Rechtsprechung', 'Praxis'],
            journal: 'NJW',
            type: 'Artikel',
            references: []
        };
    }
    getMockSearchResults(keyword, limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `beck-search-${i + 1}`,
            title: `Suchergebnis ${i + 1} für "${keyword}"`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Suchergebnis ${i + 1} für das Stichwort "${keyword}" im Bereich Mietrecht.`,
            url: `https://beck-online.example.com/suche/${keyword}/${i + 1}`,
            topics: ['Mietrecht', 'Rechtsprechung', 'Praxis'],
            journal: 'NJW',
            type: 'Artikel'
        }));
    }
}
exports.BeckOnlineApiClient = BeckOnlineApiClient;
//# sourceMappingURL=beckOnlineApiClient.js.map