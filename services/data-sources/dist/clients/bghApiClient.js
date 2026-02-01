"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BGHApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 600 });
class BGHApiClient {
    constructor() {
        this.baseUrl = process.env.BGH_API_BASE_URL || 'https://bgh.api.example.com';
        this.apiKey = process.env.BGH_API_KEY || 'dummy-key';
    }
    async getDecisions(limit = 10) {
        const cacheKey = `bgh_decisions_${limit}`;
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
            console.error('Error fetching BGH decisions:', error);
            return this.getMockDecisions(limit);
        }
    }
    async getDecisionById(id) {
        const cacheKey = `bgh_decision_${id}`;
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
            console.error(`Error fetching BGH decision ${id}:`, error);
            return this.getMockDecision(id);
        }
    }
    getMockDecisions(limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: `bgh-${i + 1}`,
            title: `BGH Entscheidung ${i + 1} zum Mietrecht`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            summary: `Zusammenfassung der BGH-Entscheidung ${i + 1} im Bereich Mietrecht.`,
            url: `https://bgh.example.com/entscheidung/${i + 1}`,
            topics: ['Mietrecht', 'Kündigung', 'Mietminderung'],
            court: 'Bundesgerichtshof',
            type: 'Urteil'
        }));
    }
    getMockDecision(id) {
        return {
            id,
            title: `BGH Entscheidung ${id} zum Mietrecht`,
            date: new Date().toISOString().split('T')[0],
            summary: `Ausführliche Zusammenfassung der BGH-Entscheidung ${id} im Bereich Mietrecht.`,
            content: `Vollständiger Text der BGH-Entscheidung ${id}.`,
            url: `https://bgh.example.com/entscheidung/${id}`,
            topics: ['Mietrecht', 'Kündigung', 'Mietminderung'],
            court: 'Bundesgerichtshof',
            type: 'Urteil',
            references: []
        };
    }
}
exports.BGHApiClient = BGHApiClient;
//# sourceMappingURL=bghApiClient.js.map