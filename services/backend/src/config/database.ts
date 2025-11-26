import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import { config } from './config'

// Prisma Client Singleton
class DatabaseService {
  private static instance: DatabaseService
  private prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      datasources: {
        db: {
          url: config.database.url,
        },
      },
    })

    // Prisma Event Listeners für Logging
    this.prisma.$on('query', (e) => {
      if (config.nodeEnv === 'development') {
        logger.debug('Database Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        })
      }
    })

    this.prisma.$on('error', (e) => {
      logger.error('Database Error', {
        message: e.message,
        target: e.target,
      })
    })

    this.prisma.$on('info', (e) => {
      logger.info('Database Info', {
        message: e.message,
        target: e.target,
      })
    })

    this.prisma.$on('warn', (e) => {
      logger.warn('Database Warning', {
        message: e.message,
        target: e.target,
      })
    })
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  public getClient(): PrismaClient {
    return this.prisma
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      logger.info('Datenbankverbindung erfolgreich hergestellt')
    } catch (error) {
      logger.error('Fehler beim Verbinden zur Datenbank:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      logger.info('Datenbankverbindung getrennt')
    } catch (error) {
      logger.error('Fehler beim Trennen der Datenbankverbindung:', error)
      throw error
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error('Database Health Check fehlgeschlagen:', error)
      return false
    }
  }

  // Transaction Helper
  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn)
  }
}

// Exportiere Singleton-Instanz
export const db = DatabaseService.getInstance()
export const prisma = db.getClient()

// Helper-Funktion für die Verbindung
export const connectDatabase = async (): Promise<void> => {
  await db.connect()
}

// Helper-Funktion für Graceful Shutdown
export const disconnectDatabase = async (): Promise<void> => {
  await db.disconnect()
}

// Graceful Shutdown Handler
process.on('beforeExit', async () => {
  await disconnectDatabase()
})

process.on('SIGINT', async () => {
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDatabase()
  process.exit(0)
})