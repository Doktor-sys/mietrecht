import { PrismaClient, LegalKnowledge, LegalType } from '@prisma/client'
import { Client as ElasticsearchClient } from '@elastic/elasticsearch'
import { config } from '../config/config'
import { redis } from '../config/redis'
import { logger, loggers } from '../utils/logger'
import {
    ValidationError,
    NotFoundError
} from '../middleware/errorHandler'

/**
 * Search Filters Interface
 */
export interface SearchFilters {
    types?: LegalType[]
    jurisdictions?: string[]
    dateRange?: {
        from?: Date
        to?: Date
    }
    relevanceThreshold?: number
    tags?: string[]
}

export interface SearchResult {
    id: string
    type: LegalType
    reference: string
    title: string
    content: string
    jurisdiction: string
    effectiveDate: Date
    lastUpdated: Date
    tags: string[]
    score?: number
    highlights?: {
        title?: string[]
        content?: string[]
    }
}

export interface SearchResponse {
    results: SearchResult[]
    total: number
    page: number
    totalPages: number
    aggregations?: {
        types: Record<string, number>
        jurisdictions: Record<string, number>
        tags: Record<string, number>
    }
}

export interface LegalText {
    id: string
    reference: string
    title: string
    content: string
    type: LegalType
    jurisdiction: string
    effectiveDate: Date
    lastUpdated: Date
    tags: string[]
    relatedLaws?: LegalText[]
}

export interface UpdateResult {
    updated: number
    created: number
    errors: string[]
}

/**
 * Knowledge Service
 * Manages legal knowledge base with Elasticsearch integration
 */
export class KnowledgeService {
    private elasticsearch: ElasticsearchClient
    private indexName: string

    constructor(private prisma: PrismaClient) {
        this.elasticsearch = new ElasticsearchClient({
            node: config.elasticsearch.url,
            requestTimeout: 30000,
            maxRetries: 3,
        })
        this.indexName = config.elasticsearch.index
    }

    /**
     * Initialisiert Elasticsearch Index
     */
    async initializeIndex(): Promise<void> {
        try {
            const indexExists = await this.elasticsearch.indices.exists({
                index: this.indexName
            })

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
                })

                logger.info('Elasticsearch Index erstellt:', { index: this.indexName })
            }
        } catch (error) {
            logger.error('Fehler beim Initialisieren des Elasticsearch Index:', error)
            throw error
        }
    }

    /**
     * Fügt neuen Rechtstext hinzu
     */
    async addLegalContent(data: {
        reference: string
        title: string
        content: string
        type: LegalType
        jurisdiction: string
        effectiveDate: Date
        tags?: string[]
    }): Promise<LegalKnowledge> {
        try {
            // Validierung
            this.validateLegalContent(data)

            // Prüfe auf Duplikate
            const existing = await this.prisma.legalKnowledge.findUnique({
                where: { reference: data.reference }
            })

            if (existing) {
                throw new ValidationError(`Rechtstext mit Referenz ${data.reference} existiert bereits`)
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
            })

            // Indexiere in Elasticsearch
            await this.indexLegalContent(legalKnowledge)

            // Cache invalidieren
            await this.invalidateSearchCache()

            loggers.businessEvent('LEGAL_CONTENT_ADDED', '', {
                reference: data.reference,
                type: data.type
            })

            return legalKnowledge
        } catch (error) {
            logger.error('Fehler beim Hinzufügen von Rechtsinhalten:', error)
            throw error
        }
    }

    /**
     * Durchsucht die Rechtsdatenbank
     */
    async searchLegalContent(
        query: string,
        filters: SearchFilters,
        page: number = 1,
        limit: number = 20
    ): Promise<SearchResponse> {
        try {
            const from = (page - 1) * limit

            // Build Elasticsearch Query
            const must: any[] = [
                {
                    multi_match: {
                        query: query,
                        fields: ['title^3', 'content^2', 'tags', 'reference'],
                        fuzziness: 'AUTO'
                    }
                }
            ]

            const filter: any[] = []

            if (filters.types && filters.types.length > 0) {
                filter.push({ terms: { type: filters.types } })
            }

            if (filters.jurisdictions && filters.jurisdictions.length > 0) {
                filter.push({ terms: { jurisdiction: filters.jurisdictions } })
            }

            if (filters.tags && filters.tags.length > 0) {
                filter.push({ terms: { tags: filters.tags } })
            }

            if (filters.dateRange) {
                const range: any = { effectiveDate: {} }
                if (filters.dateRange.from) range.effectiveDate.gte = filters.dateRange.from
                if (filters.dateRange.to) range.effectiveDate.lte = filters.dateRange.to
                filter.push({ range })
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
            })

            const total = (response.hits.total as any).value
            const results: SearchResult[] = response.hits.hits.map((hit: any) => ({
                id: hit._id,
                ...hit._source,
                score: hit._score,
                highlights: hit.highlight
            }))

            return {
                results,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        } catch (error) {
            logger.error('Fehler bei der Suche:', error)
            throw error
        }
    }

    async getLegalText(reference: string): Promise<LegalText | null> {
        const legalKnowledge = await this.prisma.legalKnowledge.findUnique({
            where: { reference }
        })

        if (!legalKnowledge) return null

        return {
            ...legalKnowledge,
            relatedLaws: []
        }
    }

    async findSimilarContent(reference: string, limit: number = 5): Promise<SearchResult[]> {
        const legalText = await this.getLegalText(reference)
        if (!legalText) throw new NotFoundError('Referenz nicht gefunden')

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
        })

        return response.hits.hits.map((hit: any) => ({
            id: hit._id,
            ...hit._source,
            score: hit._score
        }))
    }

    async updateLegalContent(reference: string, data: any): Promise<LegalKnowledge> {
        const existing = await this.prisma.legalKnowledge.findUnique({
            where: { reference }
        })

        if (!existing) throw new NotFoundError('Rechtstext nicht gefunden')

        const updated = await this.prisma.legalKnowledge.update({
            where: { reference },
            data: {
                ...data,
                lastUpdated: new Date()
            }
        })

        await this.indexLegalContent(updated)
        await this.invalidateSearchCache()

        return updated
    }

    async deleteLegalContent(reference: string): Promise<void> {
        const existing = await this.prisma.legalKnowledge.findUnique({
            where: { reference }
        })

        if (!existing) throw new NotFoundError('Rechtstext nicht gefunden')

        await this.prisma.legalKnowledge.delete({
            where: { reference }
        })

        await this.elasticsearch.delete({
            index: this.indexName,
            id: existing.id
        })

        await this.invalidateSearchCache()
    }

    async updateKnowledgeBase(): Promise<UpdateResult> {
        return {
            updated: 0,
            created: 0,
            errors: []
        }
    }

    /**
     * Health Check für Elasticsearch
     */
    async healthCheck(): Promise<{ elasticsearch: boolean; database: boolean }> {
        try {
            const [esHealth, dbHealth] = await Promise.all([
                this.elasticsearch.ping().then(() => true).catch(() => false),
                this.prisma.legalKnowledge.count().then(() => true).catch(() => false)
            ])

            return {
                elasticsearch: esHealth,
                database: dbHealth
            }
        } catch (error) {
            return {
                elasticsearch: false,
                database: false
            }
        }
    }

    /**
     * Generiert Embeddings für Rechtstext
     * Nutzt OpenAI Service für semantische Suche
     */
    private async generateEmbeddings(title: string, content: string): Promise<number[]> {
        try {
            // Import OpenAIService dynamically to avoid circular dependencies
            const { openaiService } = await import('./OpenAIService')

            if (!openaiService.isConfigured()) {
                logger.warn('OpenAI nicht konfiguriert, keine Embeddings generiert')
                return []
            }

            const embeddings = await openaiService.generateLegalContentEmbedding(title, content)

            logger.debug('Embeddings generiert', {
                title: title.substring(0, 50),
                dimensions: embeddings.length
            })

            return embeddings
        } catch (error) {
            logger.error('Fehler beim Generieren von Embeddings:', error)
            // Fail-safe: Leeres Array zurückgeben
            return []
        }
    }

    /**
     * Hilfsmethoden
     */
    private async indexLegalContent(legalKnowledge: LegalKnowledge): Promise<void> {
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
            })
        } catch (error) {
            logger.error('Fehler beim Indexieren in Elasticsearch:', error)
            throw error
        }
    }

    private validateLegalContent(data: any): void {
        const errors: string[] = []

        if (!data.reference || data.reference.trim().length === 0) {
            errors.push('Referenz ist erforderlich')
        }

        if (!data.title || data.title.trim().length === 0) {
            errors.push('Titel ist erforderlich')
        }

        if (!data.content || data.content.trim().length === 0) {
            errors.push('Inhalt ist erforderlich')
        }

        if (!data.type || !Object.values(LegalType).includes(data.type)) {
            errors.push('Gültiger Typ ist erforderlich')
        }

        if (!data.jurisdiction || data.jurisdiction.trim().length === 0) {
            errors.push('Jurisdiktion ist erforderlich')
        }

        if (!data.effectiveDate || !(data.effectiveDate instanceof Date)) {
            errors.push('Gültiges Datum ist erforderlich')
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join(', '))
        }
    }

    private async invalidateSearchCache(): Promise<void> {
        try {
            // Lösche alle Search-Cache-Keys
            const pattern = 'search:*'
            const keys = await redis.getClient().keys(pattern)

            if (keys.length > 0) {
                for (const key of keys) {
                    await redis.getClient().del(key)
                }
            }
        } catch (error) {
            logger.warn('Fehler beim Invalidieren des Search-Cache:', error)
        }
    }
}
