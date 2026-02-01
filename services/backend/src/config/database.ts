import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '../utils/logger'
import { config } from './config'

// Prisma Client Singleton
class DatabaseService {
  private static instance: DatabaseService
  private prisma: PrismaClient

  private constructor() {
    // Construct database URL with connection pool parameters
    const dbUrl = new URL(config.database.url);
    dbUrl.searchParams.set('connection_limit', config.database.pool.max.toString());
    dbUrl.searchParams.set('pool_timeout', '10');
    
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
          url: dbUrl.toString(),
        },
      },
    })

    // Prisma Event Listeners für Logging (disabled due to typing issues)
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
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(fn)
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