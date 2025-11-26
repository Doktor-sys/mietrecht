import { createClient, RedisClientType } from 'redis'
import { logger } from '../utils/logger'
import { config } from './config'

class RedisService {
  private static instance: RedisService
  private client: RedisClientType

  private constructor() {
    this.client = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Maximale Anzahl von Reconnect-Versuchen erreicht')
            return new Error('Redis Reconnect fehlgeschlagen')
          }
          return Math.min(retries * 50, 1000)
        },
      },
    })

    // Event Listeners
    this.client.on('connect', () => {
      logger.info('Redis: Verbindung wird hergestellt...')
    })

    this.client.on('ready', () => {
      logger.info('Redis: Verbindung bereit')
    })

    this.client.on('error', (error) => {
      logger.error('Redis Fehler:', error)
    })

    this.client.on('end', () => {
      logger.info('Redis: Verbindung beendet')
    })

    this.client.on('reconnecting', () => {
      logger.info('Redis: Reconnecting...')
    })
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService()
    }
    return RedisService.instance
  }

  public getClient(): RedisClientType {
    return this.client
  }

  public async connect(): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      logger.info('Redis-Verbindung erfolgreich hergestellt')
    } catch (error) {
      logger.error('Fehler beim Verbinden zu Redis:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client.isOpen) {
        await this.client.disconnect()
      }
      logger.info('Redis-Verbindung getrennt')
    } catch (error) {
      logger.error('Fehler beim Trennen der Redis-Verbindung:', error)
      throw error
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      logger.error('Redis Health Check fehlgeschlagen:', error)
      return false
    }
  }

  // Cache Helper Methods
  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue)
      } else {
        await this.client.set(key, serializedValue)
      }
    } catch (error) {
      logger.error(`Redis SET Fehler für Key ${key}:`, error)
      throw error
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (value === null) {
        return null
      }
      return JSON.parse(value) as T
    } catch (error) {
      logger.error(`Redis GET Fehler für Key ${key}:`, error)
      throw error
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      logger.error(`Redis DEL Fehler für Key ${key}:`, error)
      throw error
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`Redis EXISTS Fehler für Key ${key}:`, error)
      throw error
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds)
    } catch (error) {
      logger.error(`Redis EXPIRE Fehler für Key ${key}:`, error)
      throw error
    }
  }

  // Session Management
  public async setSession(sessionId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> {
    const key = `session:${sessionId}`
    await this.set(key, sessionData, ttlSeconds)
  }

  public async getSession<T = any>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`
    return this.get<T>(key)
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    await this.del(key)
  }

  // Rate Limiting
  public async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    try {
      const multi = this.client.multi()
      multi.incr(key)
      multi.expire(key, windowSeconds)
      const results = await multi.exec()
      return results?.[0] as number || 0
    } catch (error) {
      logger.error(`Redis Rate Limit Fehler für Key ${key}:`, error)
      throw error
    }
  }

  // Cache Patterns
  public async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    try {
      // Versuche aus Cache zu lesen
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // Wenn nicht im Cache, lade Daten und speichere sie
      const data = await fetchFunction()
      await this.set(key, data, ttlSeconds)
      return data
    } catch (error) {
      logger.error(`Redis getOrSet Fehler für Key ${key}:`, error)
      throw error
    }
  }
}

// Exportiere Singleton-Instanz
export const redis = RedisService.getInstance()

// Helper-Funktion für die Verbindung
export const connectRedis = async (): Promise<RedisClientType> => {
  await redis.connect()
  return redis.getClient()
}

// Helper-Funktion für Graceful Shutdown
export const disconnectRedis = async (): Promise<void> => {
  await redis.disconnect()
}

// Graceful Shutdown Handler
process.on('beforeExit', async () => {
  await disconnectRedis()
})

process.on('SIGINT', async () => {
  await disconnectRedis()
})

process.on('SIGTERM', async () => {
  await disconnectRedis()
})