import { PrismaClient } from '@prisma/client'
import { db, connectDatabase, disconnectDatabase } from '../config/database'

// Test-spezifische Prisma-Instanz
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/smartlaw_test',
    },
  },
})

describe('Database Configuration Tests', () => {
  beforeAll(async () => {
    // Verwende Test-Datenbank
    await testPrisma.$connect()
  })

  afterAll(async () => {
    await testPrisma.$disconnect()
  })

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const isHealthy = await db.healthCheck()
      expect(isHealthy).toBe(true)
    })

    it('should execute raw queries', async () => {
      const result = await testPrisma.$queryRaw`SELECT 1 as test`
      expect(result).toEqual([{ test: 1 }])
    })
  })

  describe('Database Schema', () => {
    it('should have all required tables', async () => {
      const tables = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `

      const tableNames = tables.map(t => t.tablename)

      const expectedTables = [
        'users',
        'user_profiles',
        'user_preferences',
        'cases',
        'messages',
        'documents',
        'document_analyses',
        'issues',
        'recommendations',
        'legal_knowledge',
        'case_legal_references',
        'lawyers',
        'time_slots',
        'bookings',
        'lawyer_reviews',
        'mietspiegel_data',
        'user_sessions',
        'templates',
      ]

      expectedTables.forEach(table => {
        expect(tableNames).toContain(table)
      })
    })

    it('should have proper indexes', async () => {
      const indexes = await testPrisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
      `

      const indexNames = indexes.map(i => i.indexname)

      // Prüfe wichtige Indizes
      expect(indexNames).toContain('users_email_key')
      expect(indexNames).toContain('legal_knowledge_reference_key')
      expect(indexNames).toContain('lawyers_email_key')
    })
  })

  describe('Database Operations', () => {
    beforeEach(async () => {
      // Cleanup vor jedem Test
      await testPrisma.user.deleteMany()
    })

    it('should create and retrieve user', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        userType: 'TENANT' as const,
      }

      const createdUser = await testPrisma.user.create({
        data: userData,
      })

      expect(createdUser.email).toBe(userData.email)
      expect(createdUser.userType).toBe(userData.userType)
      expect(createdUser.id).toBeDefined()

      const retrievedUser = await testPrisma.user.findUnique({
        where: { email: userData.email },
      })

      expect(retrievedUser).toBeTruthy()
      expect(retrievedUser?.email).toBe(userData.email)
    })

    it('should create user with profile and preferences', async () => {
      const user = await testPrisma.user.create({
        data: {
          email: 'profile@example.com',
          passwordHash: 'hashed_password',
          userType: 'TENANT',
          profile: {
            create: {
              firstName: 'Max',
              lastName: 'Mustermann',
              city: 'Berlin',
            },
          },
          preferences: {
            create: {
              language: 'de',
            },
          },
        },
        include: {
          profile: true,
          preferences: true,
        },
      })

      expect(user.profile).toBeTruthy()
      expect(user.profile?.firstName).toBe('Max')
      expect(user.preferences).toBeTruthy()
      expect(user.preferences?.language).toBe('de')
    })

    it('should enforce unique constraints', async () => {
      const userData = {
        email: 'unique@example.com',
        passwordHash: 'hashed_password',
        userType: 'TENANT' as const,
      }

      await testPrisma.user.create({ data: userData })

      // Versuche, denselben Benutzer nochmals zu erstellen
      await expect(
        testPrisma.user.create({ data: userData })
      ).rejects.toThrow()
    })

    it('should handle cascading deletes', async () => {
      const user = await testPrisma.user.create({
        data: {
          email: 'cascade@example.com',
          passwordHash: 'hashed_password',
          userType: 'TENANT',
          profile: {
            create: {
              firstName: 'Test',
              lastName: 'User',
            },
          },
          cases: {
            create: {
              title: 'Test Case',
              category: 'RENT_REDUCTION',
            },
          },
        },
      })

      // Lösche Benutzer
      await testPrisma.user.delete({
        where: { id: user.id },
      })

      // Prüfe, ob Profile und Cases auch gelöscht wurden
      const profile = await testPrisma.userProfile.findUnique({
        where: { userId: user.id },
      })
      expect(profile).toBeNull()

      const cases = await testPrisma.case.findMany({
        where: { userId: user.id },
      })
      expect(cases).toHaveLength(0)
    })
  })

  describe('Transaction Support', () => {
    beforeEach(async () => {
      await testPrisma.user.deleteMany()
    })

    it('should support database transactions', async () => {
      const result = await testPrisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'transaction@example.com',
            passwordHash: 'hashed_password',
            userType: 'TENANT',
          },
        })

        const profile = await tx.userProfile.create({
          data: {
            userId: user.id,
            firstName: 'Transaction',
            lastName: 'Test',
          },
        })

        return { user, profile }
      })

      expect(result.user.email).toBe('transaction@example.com')
      expect(result.profile.firstName).toBe('Transaction')

      // Prüfe, ob beide Datensätze erstellt wurden
      const user = await testPrisma.user.findUnique({
        where: { email: 'transaction@example.com' },
        include: { profile: true },
      })

      expect(user).toBeTruthy()
      expect(user?.profile).toBeTruthy()
    })

    it('should rollback failed transactions', async () => {
      await expect(
        testPrisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'rollback@example.com',
              passwordHash: 'hashed_password',
              userType: 'TENANT',
            },
          })

          // Simuliere einen Fehler
          throw new Error('Transaction should rollback')
        })
      ).rejects.toThrow('Transaction should rollback')

      // Prüfe, ob der Benutzer nicht erstellt wurde
      const user = await testPrisma.user.findUnique({
        where: { email: 'rollback@example.com' },
      })

      expect(user).toBeNull()
    })
  })
})
