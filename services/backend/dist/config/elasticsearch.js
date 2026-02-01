"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GERMAN_LEGAL_INDEX_SETTINGS = exports.closeElasticsearch = exports.elasticsearch = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const config_1 = require("./config");
const logger_1 = require("../utils/logger");
/**
 * Elasticsearch Client Singleton
 */
class ElasticsearchService {
    constructor() {
        this.client = new elasticsearch_1.Client({
            node: config_1.config.elasticsearch.url,
            requestTimeout: 30000,
            maxRetries: 3,
            sniffOnStart: false,
            sniffOnConnectionFault: false,
            auth: config_1.config.elasticsearch.auth ? {
                username: config_1.config.elasticsearch.auth.username,
                password: config_1.config.elasticsearch.auth.password
            } : undefined
        });
        // Event Listeners
        this.client.on('response', (err, result) => {
            if (err) {
                logger_1.logger.error('Elasticsearch Response Error:', err);
            }
            else if (config_1.config.nodeEnv === 'development') {
                logger_1.logger.debug('Elasticsearch Response:', {
                    statusCode: result?.statusCode,
                    method: result?.meta?.request?.params?.method,
                    path: result?.meta?.request?.params?.path
                });
            }
        });
        this.client.on('request', (err, result) => {
            if (err) {
                logger_1.logger.error('Elasticsearch Request Error:', err);
            }
        });
    }
    static getInstance() {
        if (!ElasticsearchService.instance) {
            ElasticsearchService.instance = new ElasticsearchService();
        }
        return ElasticsearchService.instance;
    }
    getClient() {
        return this.client;
    }
    async healthCheck() {
        try {
            const response = await this.client.ping();
            return response.statusCode === 200;
        }
        catch (error) {
            logger_1.logger.error('Elasticsearch Health Check fehlgeschlagen:', error);
            return false;
        }
    }
    async getClusterInfo() {
        try {
            const response = await this.client.info();
            return response.body;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Abrufen der Cluster-Informationen:', error);
            throw error;
        }
    }
    async createIndex(indexName, settings) {
        try {
            const exists = await this.client.indices.exists({ index: indexName });
            if (!exists) {
                await this.client.indices.create({
                    index: indexName,
                    body: settings
                });
                logger_1.logger.info(`Elasticsearch Index '${indexName}' erstellt`);
            }
            else {
                logger_1.logger.info(`Elasticsearch Index '${indexName}' existiert bereits`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Erstellen des Index '${indexName}':`, error);
            throw error;
        }
    }
    async deleteIndex(indexName) {
        try {
            const exists = await this.client.indices.exists({ index: indexName });
            if (exists) {
                await this.client.indices.delete({ index: indexName });
                logger_1.logger.info(`Elasticsearch Index '${indexName}' gelöscht`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Löschen des Index '${indexName}':`, error);
            throw error;
        }
    }
    async reindex(sourceIndex, destIndex) {
        try {
            const response = await this.client.reindex({
                body: {
                    source: { index: sourceIndex },
                    dest: { index: destIndex }
                },
                wait_for_completion: true
            });
            logger_1.logger.info(`Reindexing von '${sourceIndex}' zu '${destIndex}' abgeschlossen`, {
                took: response.body.took,
                total: response.body.total
            });
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Reindexing von '${sourceIndex}' zu '${destIndex}':`, error);
            throw error;
        }
    }
    async updateIndexSettings(indexName, settings) {
        try {
            await this.client.indices.putSettings({
                index: indexName,
                body: settings
            });
            logger_1.logger.info(`Index-Einstellungen für '${indexName}' aktualisiert`);
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Aktualisieren der Index-Einstellungen für '${indexName}':`, error);
            throw error;
        }
    }
    async getIndexStats(indexName) {
        try {
            const response = await this.client.indices.stats({ index: indexName });
            return response.body;
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Abrufen der Index-Statistiken für '${indexName}':`, error);
            throw error;
        }
    }
    async refreshIndex(indexName) {
        try {
            await this.client.indices.refresh({ index: indexName });
            logger_1.logger.debug(`Index '${indexName}' aktualisiert`);
        }
        catch (error) {
            logger_1.logger.error(`Fehler beim Aktualisieren des Index '${indexName}':`, error);
            throw error;
        }
    }
    async bulkIndex(indexName, documents) {
        try {
            const body = [];
            documents.forEach(doc => {
                body.push({
                    index: {
                        _index: indexName,
                        _id: doc.id
                    }
                });
                body.push(doc);
            });
            const response = await this.client.bulk({ body });
            if (response.body.errors) {
                const errors = response.body.items
                    .filter((item) => item.index?.error)
                    .map((item) => item.index.error);
                logger_1.logger.warn('Bulk-Indexing Fehler:', errors);
            }
            return response.body;
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Bulk-Indexing:', error);
            throw error;
        }
    }
    async close() {
        try {
            await this.client.close();
            logger_1.logger.info('Elasticsearch Client geschlossen');
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Schließen des Elasticsearch Client:', error);
        }
    }
}
// Exportiere Singleton-Instanz
exports.elasticsearch = ElasticsearchService.getInstance();
// Helper-Funktion für Graceful Shutdown
const closeElasticsearch = async () => {
    await exports.elasticsearch.close();
};
exports.closeElasticsearch = closeElasticsearch;
// Graceful Shutdown Handler
process.on('beforeExit', async () => {
    await (0, exports.closeElasticsearch)();
});
process.on('SIGINT', async () => {
    await (0, exports.closeElasticsearch)();
});
process.on('SIGTERM', async () => {
    await (0, exports.closeElasticsearch)();
});
/**
 * Standard Index-Einstellungen für deutsche Rechtstexte
 */
exports.GERMAN_LEGAL_INDEX_SETTINGS = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
            analyzer: {
                german_legal_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: [
                        'lowercase',
                        'german_normalization',
                        'german_legal_keywords',
                        'german_stemmer',
                        'german_legal_synonyms'
                    ]
                },
                german_legal_search_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: [
                        'lowercase',
                        'german_normalization',
                        'german_legal_keywords',
                        'german_stemmer'
                    ]
                }
            },
            filter: {
                german_legal_keywords: {
                    type: 'keyword_marker',
                    keywords: [
                        'BGB', 'StGB', 'ZPO', 'GG', 'WEG', 'BetrKV',
                        'BGH', 'BVerfG', 'OLG', 'LG', 'AG',
                        'Abs', 'Nr', 'Satz', 'Alt'
                    ]
                },
                german_stemmer: {
                    type: 'stemmer',
                    language: 'light_german'
                },
                german_legal_synonyms: {
                    type: 'synonym',
                    synonyms: [
                        'Mieter,Mieterin',
                        'Vermieter,Vermieterin',
                        'Wohnung,Mietsache,Mietobjekt',
                        'Kündigung,Beendigung',
                        'Mietminderung,Minderung',
                        'Nebenkosten,Betriebskosten'
                    ]
                }
            }
        }
    },
    mappings: {
        properties: {
            reference: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'german_legal_analyzer'
                    }
                }
            },
            title: {
                type: 'text',
                analyzer: 'german_legal_analyzer',
                search_analyzer: 'german_legal_search_analyzer',
                fields: {
                    keyword: {
                        type: 'keyword'
                    },
                    suggest: {
                        type: 'completion'
                    }
                }
            },
            content: {
                type: 'text',
                analyzer: 'german_legal_analyzer',
                search_analyzer: 'german_legal_search_analyzer'
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
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'german_legal_analyzer'
                    }
                }
            },
            embeddings: {
                type: 'dense_vector',
                dims: 1536 // OpenAI Embedding Dimension
            }
        }
    }
};
