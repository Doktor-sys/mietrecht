"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const client_1 = require("@prisma/client");
const elasticsearch_1 = require("@elastic/elasticsearch");
const config_1 = require("../config/config");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Knowledge Service
 * Manages legal knowledge base with Elasticsearch integration
 */
class KnowledgeService {
    constructor(prisma) {
        this.prisma = prisma;
        this.elasticsearch = new elasticsearch_1.Client({
            node: config_1.config.elasticsearch.url,
            requestTimeout: 30000,
            maxRetries: 3,
        });
        this.indexName = config_1.config.elasticsearch.index;
    }
    /**
     * Initialisiert Elasticsearch Index
     */
    async initializeIndex() {
        try {
            const indexExists = await this.elasticsearch.indices.exists({
                index: this.indexName
            });
            if (!indexExists) {
                await this.elasticsearch.indices.create({
                    index: this.indexName,
                    body: {
                        settings: {
                            number_of_shards: 1,
                            number_of_replicas: 0,
                            analysis: {
                                analyzer: {
                                    german_analyzer: {
                                        type: 'custom',
                                        tokenizer: 'standard',
                                        filter: [
                                            'lowercase',
                                            'german_normalization',
                                            'german_keywords',
                                            'german_stemmer'
                                        ]
                                    }
                                },
                                filter: {
                                    german_keywords: {
                                        type: 'keyword_marker',
                                        keywords: ['BGB', 'StGB', 'ZPO', 'GG', 'WEG']
                                    },
                                    german_stemmer: {
                                        type: 'stemmer',
                                        language: 'light_german'
                                    }
                                }
                            }
                        },
                        mappings: {
                            properties: {
                                reference: {
                                    type: 'keyword'
                                },
                                title: {
                                    type: 'text',
                                    analyzer: 'german_analyzer',
                                    fields: {
                                        keyword: {
                                            type: 'keyword'
                                        }
                                    }
                                },
                                content: {
                                    type: 'text',
                                    analyzer: 'german_analyzer'
                                },
                                type: {
                                    type: 'keyword'
                                },
                                jurisdiction: {
                                    type: 'keyword'
                                },
                                effectiveDate: {
                                    type: 'date'
                                },
                                lastUpdated: {
                                    type: 'date'
                                },
                                tags: {
                                    type: 'keyword'
                                },
                                embeddings: {
                                    type: 'dense_vector',
                                    dims: 1536 // OpenAI Embedding Dimension
                                }
                            }
                        }
                    }
                });
                logger_1.logger.info('Elasticsearch Index erstellt:', { index: this.indexName });
            }
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Initialisieren des Elasticsearch Index:', error);
            throw error;
        }
    }
    /**
     * Fügt neuen Rechtstext hinzu
     */
    async addLegalContent(data) {
        try {
            // Validierung
            this.validateLegalContent(data);
            // Prüfe auf Duplikate
            const existing = await this.prisma.legalKnowledge.findUnique({
                where: { reference: data.reference }
            });
            if (existing) {
                throw new errorHandler_1.ValidationError(`Rechtstext mit Referenz ${data.reference} existiert bereits`);
            }
            // Erstelle in Datenbank mit Embeddings
            const legalKnowledge = await this.prisma.legalKnowledge.create({
                data: {
                    reference: data.reference,
                    title: data.title,
                    content: data.content,
                    type: data.type,
                    jurisdiction: data.jurisdiction,
                    effectiveDate: data.effectiveDate,
                    tags: data.tags || [],
                    embeddings: await this.generateEmbeddings(data.title, data.content)
                }
            });
            // Indexiere in Elasticsearch
            await this.indexLegalContent(legalKnowledge);
            // Cache invalidieren
            await this.invalidateSearchCache();
            logger_1.loggers.businessEvent('LEGAL_CONTENT_ADDED', '', {
                reference: data.reference,
                type: data.type
            });
            return legalKnowledge;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Hinzufügen von Rechtsinhalten:', error);
            throw error;
        }
    }
    /**
     * Durchsucht die Rechtsdatenbank
     */
    async searchLegalContent(query, filters, page = 1, limit = 20) {
        try {
            const from = (page - 1) * limit;
            // Build Elasticsearch Query
            const must = [
                {
                    multi_match: {
                        query: query,
                        fields: ['title^3', 'content^2', 'tags', 'reference'],
                        fuzziness: 'AUTO'
                    }
                }
            ];
            const filter = [];
            if (filters.types && filters.types.length > 0) {
                filter.push({ terms: { type: filters.types } });
            }
            if (filters.jurisdictions && filters.jurisdictions.length > 0) {
                filter.push({ terms: { jurisdiction: filters.jurisdictions } });
            }
            if (filters.tags && filters.tags.length > 0) {
                filter.push({ terms: { tags: filters.tags } });
            }
            if (filters.dateRange) {
                const range = { effectiveDate: {} };
                if (filters.dateRange.from)
                    range.effectiveDate.gte = filters.dateRange.from;
                if (filters.dateRange.to)
                    range.effectiveDate.lte = filters.dateRange.to;
                filter.push({ range });
            }
            const response = await this.elasticsearch.search({
                index: this.indexName,
                from,
                size: limit,
                body: {
                    query: {
                        bool: {
                            must,
                            filter
                        }
                    },
                    highlight: {
                        fields: {
                            content: {},
                            title: {}
                        }
                    },
                    min_score: filters.relevanceThreshold || 0.5
                }
            });
            const total = response.hits.total.value;
            const results = response.hits.hits.map((hit) => ({
                id: hit._id,
                ...hit._source,
                score: hit._score,
                highlights: hit.highlight
            }));
            return {
                results,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Fehler bei der Suche:', error);
            throw error;
        }
    }
    async getLegalText(reference) {
        const legalKnowledge = await this.prisma.legalKnowledge.findUnique({
            where: { reference }
        });
        if (!legalKnowledge)
            return null;
        return {
            ...legalKnowledge,
            relatedLaws: []
        };
    }
    async findSimilarContent(reference, limit = 5) {
        const legalText = await this.getLegalText(reference);
        if (!legalText)
            throw new errorHandler_1.NotFoundError('Referenz nicht gefunden');
        const response = await this.elasticsearch.search({
            index: this.indexName,
            size: limit,
            body: {
                query: {
                    more_like_this: {
                        fields: ['title', 'content', 'tags'],
                        like: [
                            {
                                _index: this.indexName,
                                _id: legalText.id
                            }
                        ],
                        min_term_freq: 1,
                        max_query_terms: 12
                    }
                }
            }
        });
        return response.hits.hits.map((hit) => ({
            id: hit._id,
            ...hit._source,
            score: hit._score
        }));
    }
    async updateLegalContent(reference, data) {
        const existing = await this.prisma.legalKnowledge.findUnique({
            where: { reference }
        });
        if (!existing)
            throw new errorHandler_1.NotFoundError('Rechtstext nicht gefunden');
        const updated = await this.prisma.legalKnowledge.update({
            where: { reference },
            data: {
                ...data,
                lastUpdated: new Date()
            }
        });
        await this.indexLegalContent(updated);
        await this.invalidateSearchCache();
        return updated;
    }
    async deleteLegalContent(reference) {
        const existing = await this.prisma.legalKnowledge.findUnique({
            where: { reference }
        });
        if (!existing)
            throw new errorHandler_1.NotFoundError('Rechtstext nicht gefunden');
        await this.prisma.legalKnowledge.delete({
            where: { reference }
        });
        await this.elasticsearch.delete({
            index: this.indexName,
            id: existing.id
        });
        await this.invalidateSearchCache();
    }
    async updateKnowledgeBase() {
        return {
            updated: 0,
            created: 0,
            errors: []
        };
    }
    /**
     * Health Check für Elasticsearch
     */
    async healthCheck() {
        try {
            const [esHealth, dbHealth] = await Promise.all([
                this.elasticsearch.ping().then(() => true).catch(() => false),
                this.prisma.legalKnowledge.count().then(() => true).catch(() => false)
            ]);
            return {
                elasticsearch: esHealth,
                database: dbHealth
            };
        }
        catch (error) {
            return {
                elasticsearch: false,
                database: false
            };
        }
    }
    /**
     * Generiert Embeddings für Rechtstext
     * Nutzt OpenAI Service für semantische Suche
     */
    async generateEmbeddings(title, content) {
        try {
            // Import OpenAIService dynamically to avoid circular dependencies
            const { openaiService } = await Promise.resolve().then(() => __importStar(require('./OpenAIService')));
            if (!openaiService.isConfigured()) {
                logger_1.logger.warn('OpenAI nicht konfiguriert, keine Embeddings generiert');
                return [];
            }
            const embeddings = await openaiService.generateLegalContentEmbedding(title, content);
            logger_1.logger.debug('Embeddings generiert', {
                title: title.substring(0, 50),
                dimensions: embeddings.length
            });
            return embeddings;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Generieren von Embeddings:', error);
            // Fail-safe: Leeres Array zurückgeben
            return [];
        }
    }
    /**
     * Hilfsmethoden
     */
    async indexLegalContent(legalKnowledge) {
        try {
            await this.elasticsearch.index({
                index: this.indexName,
                id: legalKnowledge.id,
                body: {
                    reference: legalKnowledge.reference,
                    title: legalKnowledge.title,
                    content: legalKnowledge.content,
                    type: legalKnowledge.type,
                    jurisdiction: legalKnowledge.jurisdiction,
                    effectiveDate: legalKnowledge.effectiveDate,
                    lastUpdated: legalKnowledge.lastUpdated,
                    tags: legalKnowledge.tags,
                    embeddings: legalKnowledge.embeddings
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Indexieren in Elasticsearch:', error);
            throw error;
        }
    }
    validateLegalContent(data) {
        const errors = [];
        if (!data.reference || data.reference.trim().length === 0) {
            errors.push('Referenz ist erforderlich');
        }
        if (!data.title || data.title.trim().length === 0) {
            errors.push('Titel ist erforderlich');
        }
        if (!data.content || data.content.trim().length === 0) {
            errors.push('Inhalt ist erforderlich');
        }
        if (!data.type || !Object.values(client_1.LegalType).includes(data.type)) {
            errors.push('Gültiger Typ ist erforderlich');
        }
        if (!data.jurisdiction || data.jurisdiction.trim().length === 0) {
            errors.push('Jurisdiktion ist erforderlich');
        }
        if (!data.effectiveDate || !(data.effectiveDate instanceof Date)) {
            errors.push('Gültiges Datum ist erforderlich');
        }
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(errors.join(', '));
        }
    }
    async invalidateSearchCache() {
        try {
            // Lösche alle Search-Cache-Keys
            const pattern = 'search:*';
            const keys = await redis_1.redis.getClient().keys(pattern);
            if (keys.length > 0) {
                for (const key of keys) {
                    await redis_1.redis.getClient().del(key);
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('Fehler beim Invalidieren des Search-Cache:', error);
        }
    }
}
exports.KnowledgeService = KnowledgeService;
