"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BVerfGApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 600 });
class BVerfGApiClient {
    constructor() {
        this.baseUrl = process.env.BVERFG_API_BASE_URL || 'https://bverfg.api.example.com';
        this.apiKey = process.env.BVERFG_API_KEY || 'dummy-key';
    }
    async getDecisions(limit = 10) {
        const cacheKey = `bverfg_decisions_${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/decisions`, {
                params: {
                    limit,
                    jurisdiction: 'mietrecht'
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
            console.error('Error fetching BVerfG decisions:', error);
            return this.getMockDecisions(limit);
        }
    }
    async getDecisionById(id) {
        const cacheKey = `bverfg_decision_${id}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/decisions/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching BVerfG decision ${id}:`, error);
            return this.getMockDecision(id);
        }
    }
    async searchDecisions(keyword, limit = 10) {
        const cacheKey = `bverfg_search_${keyword}_${limit}`;
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
            console.error(`Error searching BVerfG decisions for "${keyword}":`, error);
            return this.getMockSearchResults(keyword, limit);
        }
    }
    async getCourtDivisions() {
        const cacheKey = 'bverfg_court_divisions';
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/divisions`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching BVerfG court divisions:', error);
            return this.getMockCourtDivisions();
        }
    }
    getMockDecisions(limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `bverfg-${i + 1}`,
            title: `BVerfG Entscheidung ${i + 1} zum Mietrecht`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Zusammenfassung der BVerfG-Entscheidung ${i + 1} im Bereich Mietrecht.`,
            url: `https://bverfg.example.com/entscheidung/${i + 1}`,
            topics: ['Mietrecht', 'Verfassungsrecht', 'Grundgesetz'],
            court: 'Bundesverfassungsgericht',
            type: 'Urteil',
            division: 'Erster Senat'
        }));
    }
    getMockDecision(id) {
        return {
            id,
            title: `BVerfG Entscheidung ${id} zum Mietrecht`,
            date: new Date().toISOString().split('T')[0],
            summary: `Ausführliche Zusammenfassung der BVerfG-Entscheidung ${id} im Bereich Mietrecht.`,
            content: `Vollständiger Text der BVerfG-Entscheidung ${id}.`,
            url: `https://bverfg.example.com/entscheidung/${id}`,
            topics: ['Mietrecht', 'Verfassungsrecht', 'Grundgesetz'],
            court: 'Bundesverfassungsgericht',
            type: 'Urteil',
            division: 'Erster Senat',
            references: []
        };
    }
    getMockSearchResults(keyword, limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `bverfg-search-${i + 1}`,
            title: `Suchergebnis ${i + 1} für "${keyword}"`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Suchergebnis ${i + 1} für das Stichwort "${keyword}" im Bereich Mietrecht.`,
            url: `https://bverfg.example.com/suche/${keyword}/${i + 1}`,
            topics: ['Mietrecht', 'Verfassungsrecht', 'Grundgesetz'],
            court: 'Bundesverfassungsgericht',
            type: 'Urteil',
            division: 'Erster Senat'
        }));
    }
    getMockCourtDivisions() {
        return [
            'Erster Senat',
            'Zweiter Senat',
            'Dritter Senat',
            'Vierter Senat',
            'Fünfter Senat',
            'Sechster Senat',
            'Siebenter Senat',
            'Achter Senat'
        ];
    }
}
exports.BVerfGApiClient = BVerfGApiClient;
//# sourceMappingURL=bverfgApiClient.js.map