"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandgerichteApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 600 });
class LandgerichteApiClient {
    constructor() {
        this.baseUrl = process.env.LANDGERICHTE_API_BASE_URL || 'https://landgerichte.api.example.com';
        this.apiKey = process.env.LANDGERICHTE_API_KEY || 'dummy-key';
    }
    async getDecisions(limit = 10, region) {
        const cacheKey = `landgerichte_decisions_${limit}_${region || 'all'}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/decisions`, {
                params: {
                    limit,
                    jurisdiction: 'mietrecht',
                    region
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
            console.error('Error fetching Landgerichte decisions:', error);
            return this.getMockDecisions(limit);
        }
    }
    async getDecisionById(id) {
        const cacheKey = `landgerichte_decision_${id}`;
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
            console.error(`Error fetching Landgerichte decision ${id}:`, error);
            return this.getMockDecision(id);
        }
    }
    async getRegions() {
        const cacheKey = 'landgerichte_regions';
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/regions`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            cache.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching Landgerichte regions:', error);
            return this.getMockRegions();
        }
    }
    getMockDecisions(limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `lg-${i + 1}`,
            title: `Landgericht Entscheidung ${i + 1} zum Mietrecht`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Zusammenfassung der Landgericht-Entscheidung ${i + 1} im Bereich Mietrecht.`,
            url: `https://landgericht.example.com/entscheidung/${i + 1}`,
            topics: ['Mietrecht', 'Nebenkosten', 'Modernisierung'],
            court: 'Landgericht',
            type: 'Urteil',
            region: 'Berlin'
        }));
    }
    getMockDecision(id) {
        return {
            id,
            title: `Landgericht Entscheidung ${id} zum Mietrecht`,
            date: new Date().toISOString().split('T')[0],
            summary: `Ausführliche Zusammenfassung der Landgericht-Entscheidung ${id} im Bereich Mietrecht.`,
            content: `Vollständiger Text der Landgericht-Entscheidung ${id}.`,
            url: `https://landgericht.example.com/entscheidung/${id}`,
            topics: ['Mietrecht', 'Nebenkosten', 'Modernisierung'],
            court: 'Landgericht',
            type: 'Urteil',
            region: 'Berlin',
            references: []
        };
    }
    getMockRegions() {
        return [
            'Baden-Württemberg',
            'Bayern',
            'Berlin',
            'Brandenburg',
            'Bremen',
            'Hamburg',
            'Hessen',
            'Mecklenburg-Vorpommern',
            'Niedersachsen',
            'Nordrhein-Westfalen',
            'Rheinland-Pfalz',
            'Saarland',
            'Sachsen',
            'Sachsen-Anhalt',
            'Schleswig-Holstein',
            'Thüringen'
        ];
    }
}
exports.LandgerichteApiClient = LandgerichteApiClient;
//# sourceMappingURL=landgerichteApiClient.js.map