import { Client as ElasticsearchClient } from '@elastic/elasticsearch'
import { config } from './config'
import { logger } from '../utils/logger'

/**
 * Elasticsearch Client Singleton
 */
class ElasticsearchService {
  private static instance: ElasticsearchService
  private client: ElasticsearchClient

  private constructor() {
    this.client = new ElasticsearchClient({
      node: config.elasticsearch.url,
      requestTimeout: 30000,
      maxRetries: 3,
      sniffOnStart: false,
      sniffOnConnectionFault: false,
      auth: config.elasticsearch.auth ? {
        username: config.elasticsearch.auth.username,
        password: config.elasticsearch.auth.password
      } : undefined
    })

    // Event Listeners
    this.client.on('response', (err, result) => {
      if (err) {
        logger.error('Elasticsearch Response Error:', err)
      } else if (config.nodeEnv === 'development') {
        logger.debug('Elasticsearch Response:', {
          statusCode: result?.statusCode,
          method: result?.meta?.request?.params?.method,
          path: result?.meta?.request?.params?.path
        })
      }
    })

    this.client.on('request', (err, result) => {
      if (err) {
        logger.error('Elasticsearch Request Error:', err)
      }
    })
  }

  public static getInstance(): ElasticsearchService {
    if (!ElasticsearchService.instance) {
      ElasticsearchService.instance = new ElasticsearchService()
    }
    return ElasticsearchService.instance
  }

  public getClient(): ElasticsearchClient {
    return this.client
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.ping()
      return response.statusCode === 200
    } catch (error) {
      logger.error('Elasticsearch Health Check fehlgeschlagen:', error)
      return false
    }
  }

  public async getClusterInfo(): Promise<any> {
    try {
      const response = await this.client.info()
      return response.body
    } catch (error) {
      logger.error('Fehler beim Abrufen der Cluster-Informationen:', error)
      throw error
    }
  }

  public async createIndex(indexName: string, settings: any): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName })
      
      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: settings
        })
        logger.info(`Elasticsearch Index '${indexName}' erstellt`)
      } else {
        logger.info(`Elasticsearch Index '${indexName}' existiert bereits`)
      }
    } catch (error) {
      logger.error(`Fehler beim Erstellen des Index '${indexName}':`, error)
      throw error
    }
  }

  public async deleteIndex(indexName: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName })
      
      if (exists) {
        await this.client.indices.delete({ index: indexName })
        logger.info(`Elasticsearch Index '${indexName}' gelöscht`)
      }
    } catch (error) {
      logger.error(`Fehler beim Löschen des Index '${indexName}':`, error)
      throw error
    }
  }

  public async reindex(sourceIndex: string, destIndex: string): Promise<void> {
    try {
      const response = await this.client.reindex({
        body: {
          source: { index: sourceIndex },
          dest: { index: destIndex }
        },
        wait_for_completion: true
      })

      logger.info(`Reindexing von '${sourceIndex}' zu '${destIndex}' abgeschlossen`, {
        took: response.body.took,
        total: response.body.total
      })
    } catch (error) {
      logger.error(`Fehler beim Reindexing von '${sourceIndex}' zu '${destIndex}':`, error)
      throw error
    }
  }

  public async updateIndexSettings(indexName: string, settings: any): Promise<void> {
    try {
      await this.client.indices.putSettings({
        index: indexName,
        body: settings
      })
      logger.info(`Index-Einstellungen für '${indexName}' aktualisiert`)
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren der Index-Einstellungen für '${indexName}':`, error)
      throw error
    }
  }

  public async getIndexStats(indexName: string): Promise<any> {
    try {
      const response = await this.client.indices.stats({ index: indexName })
      return response.body
    } catch (error) {
      logger.error(`Fehler beim Abrufen der Index-Statistiken für '${indexName}':`, error)
      throw error
    }
  }

  public async refreshIndex(indexName: string): Promise<void> {
    try {
      await this.client.indices.refresh({ index: indexName })
      logger.debug(`Index '${indexName}' aktualisiert`)
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Index '${indexName}':`, error)
      throw error
    }
  }

  public async bulkIndex(indexName: string, documents: any[]): Promise<any> {
    try {
      const body: any[] = []

      documents.forEach(doc => {
        body.push({
          index: {
            _index: indexName,
            _id: doc.id
          }
        })
        body.push(doc)
      })

      const response = await this.client.bulk({ body })
      
      if (response.body.errors) {
        const errors = response.body.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => item.index.error)
        
        logger.warn('Bulk-Indexing Fehler:', errors)
      }

      return response.body
    } catch (error) {
      logger.error('Fehler beim Bulk-Indexing:', error)
      throw error
    }
  }

  public async close(): Promise<void> {
    try {
      await this.client.close()
      logger.info('Elasticsearch Client geschlossen')
    } catch (error) {
      logger.error('Fehler beim Schließen des Elasticsearch Client:', error)
    }
  }
}

// Exportiere Singleton-Instanz
export const elasticsearch = ElasticsearchService.getInstance()

// Helper-Funktion für Graceful Shutdown
export const closeElasticsearch = async (): Promise<void> => {
  await elasticsearch.close()
}

// Graceful Shutdown Handler
process.on('beforeExit', async () => {
  await closeElasticsearch()
})

process.on('SIGINT', async () => {
  await closeElasticsearch()
})

process.on('SIGTERM', async () => {
  await closeElasticsearch()
})

/**
 * Standard Index-Einstellungen für deutsche Rechtstexte
 */
export const GERMAN_LEGAL_INDEX_SETTINGS = {
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
}