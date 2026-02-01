"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JurisApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 600 });
class JurisApiClient {
    constructor() {
        this.baseUrl = process.env.JURIS_API_BASE_URL || 'https://juris.api.example.com';
        this.apiKey = process.env.JURIS_API_KEY || 'dummy-key';
    }
    async getDocuments(limit = 10) {
        const cacheKey = `juris_documents_${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/documents`, {
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
            console.error('Error fetching juris documents:', error);
            return this.getMockDocuments(limit);
        }
    }
    async getDocumentById(id) {
        const cacheKey = `juris_document_${id}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/documents/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching juris document ${id}:`, error);
            return this.getMockDocument(id);
        }
    }
    async searchDocuments(keyword, limit = 10) {
        const cacheKey = `juris_search_${keyword}_${limit}`;
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
            console.error(`Error searching juris documents for "${keyword}":`, error);
            return this.getMockSearchResults(keyword, limit);
        }
    }
    async getDatabases() {
        const cacheKey = 'juris_databases';
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/databases`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching juris databases:', error);
            return this.getMockDatabases();
        }
    }
    getMockDocuments(limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `juris-${i + 1}`,
            title: `juris Dokument ${i + 1} zum Mietrecht`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Zusammenfassung des juris Dokuments ${i + 1} im Bereich Mietrecht.`,
            url: `https://juris.example.com/dokument/${i + 1}`,
            topics: ['Mietrecht', 'Rechtsprechung', 'Kommentare'],
            database: 'Juris',
            type: 'Dokument'
        }));
    }
    getMockDocument(id) {
        return {
            id,
            title: `juris Dokument ${id} zum Mietrecht`,
            date: new Date().toISOString().split('T')[0],
            summary: `Ausführliche Zusammenfassung des juris Dokuments ${id} im Bereich Mietrecht.`,
            content: `Vollständiger Text des juris Dokuments ${id}.`,
            url: `https://juris.example.com/dokument/${id}`,
            topics: ['Mietrecht', 'Rechtsprechung', 'Kommentare'],
            database: 'Juris',
            type: 'Dokument',
            references: []
        };
    }
    getMockSearchResults(keyword, limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `juris-search-${i + 1}`,
            title: `Suchergebnis ${i + 1} für "${keyword}"`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Suchergebnis ${i + 1} für das Stichwort "${keyword}" im Bereich Mietrecht.`,
            url: `https://juris.example.com/suche/${keyword}/${i + 1}`,
            topics: ['Mietrecht', 'Rechtsprechung', 'Kommentare'],
            database: 'Juris',
            type: 'Dokument'
        }));
    }
    getMockDatabases() {
        return [
            'NJW',
            'NStZ',
            'NZM',
            'MietR',
            'WRP',
            'ZInsO'
        ];
    }
}
exports.JurisApiClient = JurisApiClient;
//# sourceMappingURL=jurisApiClient.js.map