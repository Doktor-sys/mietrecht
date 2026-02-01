import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
/**
 * Elasticsearch Client Singleton
 */
declare class ElasticsearchService {
    private static instance;
    private client;
    private constructor();
    static getInstance(): ElasticsearchService;
    getClient(): ElasticsearchClient;
    healthCheck(): Promise<boolean>;
    getClusterInfo(): Promise<any>;
    createIndex(indexName: string, settings: any): Promise<void>;
    deleteIndex(indexName: string): Promise<void>;
    reindex(sourceIndex: string, destIndex: string): Promise<void>;
    updateIndexSettings(indexName: string, settings: any): Promise<void>;
    getIndexStats(indexName: string): Promise<any>;
    refreshIndex(indexName: string): Promise<void>;
    bulkIndex(indexName: string, documents: any[]): Promise<any>;
    close(): Promise<void>;
}
export declare const elasticsearch: ElasticsearchService;
export declare const closeElasticsearch: () => Promise<void>;
/**
 * Standard Index-Einstellungen für deutsche Rechtstexte
 */
export declare const GERMAN_LEGAL_INDEX_SETTINGS: {
    settings: {
        number_of_shards: number;
        number_of_replicas: number;
        analysis: {
            analyzer: {
                german_legal_analyzer: {
                    type: string;
                    tokenizer: string;
                    filter: string[];
                };
                german_legal_search_analyzer: {
                    type: string;
                    tokenizer: string;
                    filter: string[];
                };
            };
            filter: {
                german_legal_keywords: {
                    type: string;
                    keywords: string[];
                };
                german_stemmer: {
                    type: string;
                    language: string;
                };
                german_legal_synonyms: {
                    type: string;
                    synonyms: string[];
                };
            };
        };
    };
    mappings: {
        properties: {
            reference: {
                type: string;
                fields: {
                    text: {
                        type: string;
                        analyzer: string;
                    };
                };
            };
            title: {
                type: string;
                analyzer: string;
                search_analyzer: string;
                fields: {
                    keyword: {
                        type: string;
                    };
                    suggest: {
                        type: string;
                    };
                };
            };
            content: {
                type: string;
                analyzer: string;
                search_analyzer: string;
            };
            type: {
                type: string;
            };
            jurisdiction: {
                type: string;
            };
            effectiveDate: {
                type: string;
            };
            lastUpdated: {
                type: string;
            };
            tags: {
                type: string;
                fields: {
                    text: {
                        type: string;
                        analyzer: string;
                    };
                };
            };
            embeddings: {
                type: string;
                dims: number;
            };
        };
    };
};
export {};
