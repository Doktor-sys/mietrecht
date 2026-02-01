import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserService, UpdateProfileData, UpdatePreferencesData } from '../services/UserService'
import { redis } from '../config/redis'
import {
  ValidationError,
  NotFoundError,
  AuthorizationError
} from '../middleware/errorHandler'

// Test-spezifische Prisma-Instanz
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/smartlaw_test',
    },
  },
})

describe('UserService Unit Tests', () => {
  let userService: UserService
  let testUserId: string

  beforeAll(async () => {
    await testPrisma.$connect()
    await redis.connect()
    userService = new UserService(testPrisma)
  })

  afterAll(async () => {
    await testPrisma.$disconnect()
    await redis.disconnect()
  })

  beforeEach(async () => {
    // Cleanup vor jedem Test
    await testPrisma.userSession.deleteMany()
    await testPrisma.userPreferences.deleteMany()
    await testPrisma.userProfile.deleteMany()
    await testPrisma.user.deleteMany()

    // Redis cleanup
    const client = redis.getClient()
    if (client.isOpen) {
      await client.flushDb()
    }

    // Erstelle Test-Benutzer
    const passwordHash = await bcrypt.hash('password123', 12)
    const user = await testPrisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash,
        userType: UserType.TENANT,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Max',
            lastName: 'Mustermann',
            city: 'Berlin',
            language: 'de'
          }
        },
        preferences: {
          create: {
            language: 'de',
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,

            privacy: {
              dataSharing: false,
              analytics: true,
              marketing: false
            }
          }
        }
      }
    })

    testUserId = user.id
  })

  describe('getUserById', () => {
    it('should return user with profile and preferences', async () => {
      const user = await userService.getUserById(testUserId)

      expect(user).toBeTruthy()
      expect(user?.id).toBe(testUserId)
      expect(user?.email).toBe('test@example.com')
      expect(user?.profile?.firstName).toBe('Max')
      expect(user?.preferences?.language).toBe('de')
      expect(user).not.toHaveProperty('passwordHash')
    })

    it('should return null for non-existent user', async () => {
      const user = await userService.getUserById('non-existent-id')
      expect(user).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const user = await userService.getUserByEmail('test@example.com')

      expect(user).toBeTruthy()
      expect(user?.email).toBe('test@example.com')
      expect(user?.profile?.firstName).toBe('Max')
    })

    it('should be case insensitive', async () => {
      const user = await userService.getUserByEmail('TEST@EXAMPLE.COM')

      expect(user).toBeTruthy()
      expect(user?.email).toBe('test@example.com')
    })

    it('should return null for non-existent email', async () => {
      const user = await userService.getUserByEmail('nonexistent@example.com')
      expect(user).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        location: 'München',
        language: 'en'
      }

      const updatedProfile = await userService.updateProfile(testUserId, updateData)

      expect(updatedProfile.firstName).toBe('John')
      expect(updatedProfile.lastName).toBe('Doe')
      expect(updatedProfile.location).toBe('München')
      expect(updatedProfile.language).toBe('en')
    })

    it('should update accessibility needs', async () => {
      const updateData: UpdateProfileData = {
        accessibilityNeeds: {
          screenReader: true,
          highContrast: true,
          largeText: false,
          keyboardNavigation: true
        }
      }

      const updatedProfile = await userService.updateProfile(testUserId, updateData)

      expect(updatedProfile.accessibilityNeeds).toEqual(updateData.accessibilityNeeds)
    })

    it('should create profile if it does not exist', async () => {
      // Lösche existierendes Profil
      await testPrisma.userProfile.delete({
        where: { userId: testUserId }
      })

      const updateData: UpdateProfileData = {
        firstName: 'New',
        lastName: 'User'
      }

      const profile = await userService.updateProfile(testUserId, updateData)

      expect(profile.firstName).toBe('New')
      expect(profile.lastName).toBe('User')
      expect(profile.language).toBe('de') // Default
    })

    it('should reject invalid data', async () => {
      const invalidData: UpdateProfileData = {
        firstName: '', // Zu kurz
        language: 'invalid' // Ungültige Sprache
      }

      await expect(userService.updateProfile(testUserId, invalidData)).rejects.toThrow(ValidationError)
    })

    it('should throw error for non-existent user', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Test'
      }

      await expect(userService.updateProfile('non-existent', updateData)).rejects.toThrow(NotFoundError)
    })
  })

  describe('getPreferences', () => {
    it('should get preferences successfully', async () => {
      // First update preferences
      const updateData: UpdatePreferencesData = {
        language: 'en',
        notifications: {
          email: false,
          push: true
        }
      }

      await userService.updatePreferences(testUserId, updateData)

      // Then get preferences
      const preferences = await userService.getPreferences(testUserId)

      expect(preferences).toBeDefined()
      expect(preferences?.language).toBe('en')
      expect((preferences?.notifications as any).email).toBe(false)
      expect((preferences?.notifications as any).push).toBe(true)
    })

    it('should return null if preferences do not exist', async () => {
      // Delete existing preferences
      await testPrisma.userPreferences.delete({
        where: { userId: testUserId }
      })

      const preferences = await userService.getPreferences(testUserId)

      expect(preferences).toBeNull()
    })

    it('should get enhanced profile preferences', async () => {
      // First update preferences with enhanced profile data
      const updateData: UpdatePreferencesData = {
        accessibility: {
          highContrast: true,
          dyslexiaFriendly: false
        },
        legalTopics: ['tenant-protection'],
        frequentDocuments: ['rental-contract'],
        alerts: {
          newCaseLaw: 'weekly',
          documentUpdates: 'daily'
        }
      }

      await userService.updatePreferences(testUserId, updateData)

      // Then get preferences
      const preferences = await userService.getPreferences(testUserId)

      expect(preferences).toBeDefined()
      expect((preferences as any)['accessibility']['highContrast']).toBe(true)
      expect((preferences as any)['accessibility']['dyslexiaFriendly']).toBe(false)
      expect((preferences as any)['legalTopics']).toEqual(['tenant-protection'])
      expect((preferences as any)['frequentDocuments']).toEqual(['rental-contract'])
      expect((preferences as any)['alerts']['newCaseLaw']).toBe('weekly')
      expect((preferences as any)['alerts']['documentUpdates']).toBe('daily')
    })
  })

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      const updateData: UpdatePreferencesData = {
        notifications: {
          email: false,
          push: true,
          sms: true
        },
        privacy: {
          dataSharing: true,
          analytics: false,
          marketing: true
        },
        language: 'en'
      }

      const updatedPreferences = await userService.updatePreferences(testUserId, updateData)

      expect(updatedPreferences.language).toBe('en')
      expect((updatedPreferences.notifications as any).email).toBe(false)
      expect((updatedPreferences.privacy as any).dataSharing).toBe(true)
    })

    it('should merge with existing preferences', async () => {
      const updateData: UpdatePreferencesData = {
        notifications: {
          email: false // Nur E-Mail ändern
        }
      }

      const updatedPreferences = await userService.updatePreferences(testUserId, updateData)

      // E-Mail sollte geändert sein
      expect((updatedPreferences.notifications as any).email).toBe(false)
      // Push sollte unverändert bleiben
      expect((updatedPreferences.notifications as any).push).toBe(true)
    })

    it('should create preferences if they do not exist', async () => {
      // Lösche existierende Präferenzen
      await testPrisma.userPreferences.delete({
        where: { userId: testUserId }
      })

      const updateData: UpdatePreferencesData = {
        language: 'en'
      }

      const preferences = await userService.updatePreferences(testUserId, updateData)

      expect(preferences.language).toBe('en')
    })

    it('should reject invalid language', async () => {
      const invalidData: UpdatePreferencesData = {
        language: 'invalid'
      }

      await expect(userService.updatePreferences(testUserId, invalidData)).rejects.toThrow(ValidationError)
    })

    it('should update enhanced profile preferences successfully', async () => {
      const updateData: UpdatePreferencesData = {
        accessibility: {
          highContrast: true,
          dyslexiaFriendly: true,
          reducedMotion: false,
          largerText: true,
          screenReaderMode: false
        },
        legalTopics: ['tenant-protection', 'modernization'],
        frequentDocuments: ['rental-contract', 'warning-letter'],
        alerts: {
          newCaseLaw: 'daily',
          documentUpdates: 'instant',
          newsletter: 'monthly'
        }
      }

      const updatedPreferences = await userService.updatePreferences(testUserId, updateData)

      // Access the new fields through bracket notation to avoid TypeScript errors
      expect((updatedPreferences as any)['accessibility']['highContrast']).toBe(true)
      expect((updatedPreferences as any)['accessibility']['dyslexiaFriendly']).toBe(true)
      expect((updatedPreferences as any)['legalTopics']).toEqual(['tenant-protection', 'modernization'])
      expect((updatedPreferences as any)['frequentDocuments']).toEqual(['rental-contract', 'warning-letter'])
      expect((updatedPreferences as any)['alerts']['newCaseLaw']).toBe('daily')
      expect((updatedPreferences as any)['alerts']['documentUpdates']).toBe('instant')
      expect((updatedPreferences as any)['alerts']['newsletter']).toBe('monthly')
    })

    it('should validate enhanced profile preferences', async () => {
      const invalidData: UpdatePreferencesData = {
        alerts: {
          newCaseLaw: 'invalid-value' as any,
          documentUpdates: 'daily',
          newsletter: 'monthly'
        }
      }

      await expect(userService.updatePreferences(testUserId, invalidData)).rejects.toThrow(ValidationError)
    })
  })

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      await userService.deactivateUser(testUserId, 'Test reason')

      const user = await testPrisma.user.findUnique({
        where: { id: testUserId }
      })

      expect(user?.isActive).toBe(false)
    })

    it('should delete all user sessions', async () => {
      // Erstelle Test-Session
      const sessionToken = 'test-session'
      await testPrisma.userSession.create({
        data: {
          userId: testUserId,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })

      await redis.setSession(sessionToken, { userId: testUserId })

      await userService.deactivateUser(testUserId)

      // Prüfe ob Sessions gelöscht wurden
      const sessions = await testPrisma.userSession.findMany({
        where: { userId: testUserId }
      })
      expect(sessions).toHaveLength(0)

      const redisSession = await redis.getSession(sessionToken)
      expect(redisSession).toBeNull()
    })

    it('should throw error for already deactivated user', async () => {
      // Deaktiviere Benutzer
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isActive: false }
      })

      await expect(userService.deactivateUser(testUserId)).rejects.toThrow(ValidationError)
    })

    it('should throw error for non-existent user', async () => {
      await expect(userService.deactivateUser('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('reactivateUser', () => {
    beforeEach(async () => {
      // Deaktiviere Benutzer für Tests
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isActive: false }
      })
    })

    it('should reactivate user successfully', async () => {
      await userService.reactivateUser(testUserId)

      const user = await testPrisma.user.findUnique({
        where: { id: testUserId }
      })

      expect(user?.isActive).toBe(true)
    })

    it('should throw error for already active user', async () => {
      // Reaktiviere Benutzer
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isActive: true }
      })

      await expect(userService.reactivateUser(testUserId)).rejects.toThrow(ValidationError)
    })
  })

  describe('verifyEmail', () => {
    beforeEach(async () => {
      // Setze Benutzer als nicht verifiziert
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isVerified: false }
      })
    })

    it('should verify email successfully', async () => {
      await userService.verifyEmail(testUserId)

      const user = await testPrisma.user.findUnique({
        where: { id: testUserId }
      })

      expect(user?.isVerified).toBe(true)
    })

    it('should throw error for already verified user', async () => {
      // Verifiziere Benutzer
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isVerified: true }
      })

      await expect(userService.verifyEmail(testUserId)).rejects.toThrow(ValidationError)
    })
  })

  describe('searchUsers', () => {
    beforeEach(async () => {
      // Erstelle zusätzliche Test-Benutzer
      const passwordHash = await bcrypt.hash('password123', 12)

      await testPrisma.user.create({
        data: {
          email: 'landlord@example.com',
          passwordHash,
          userType: UserType.LANDLORD,
          isVerified: true,
          profile: {
            create: {
              firstName: 'Anna',
              lastName: 'Vermieter',
              city: 'München',
              language: 'de'
            }
          }
        }
      })

      await testPrisma.user.create({
        data: {
          email: 'business@example.com',
          passwordHash,
          userType: UserType.BUSINESS,
          isVerified: false,
          profile: {
            create: {
              firstName: 'Business',
              lastName: 'User',
              city: 'Hamburg',
              language: 'en'
            }
          }
        }
      })
    })

    it('should search users successfully for business user', async () => {
      const result = await userService.searchUsers(
        { userType: UserType.TENANT },
        1,
        10,
        UserType.BUSINESS
      )

      expect(result.users).toHaveLength(1)
      expect(result.users[0].userType).toBe(UserType.TENANT)
      expect(result.total).toBe(1)
    })

    it('should filter by location', async () => {
      const result = await userService.searchUsers(
        { location: 'München' },
        1,
        10,
        UserType.BUSINESS
      )

      expect(result.users).toHaveLength(1)
      expect(result.users[0].profile?.location).toBe('München')
    })

    it('should filter by verification status', async () => {
      const result = await userService.searchUsers(
        { isVerified: false },
        1,
        10,
        UserType.BUSINESS
      )

      expect(result.users).toHaveLength(1)
      expect(result.users[0].isVerified).toBe(false)
    })

    it('should reject search for non-business user', async () => {
      await expect(
        userService.searchUsers({}, 1, 10, UserType.TENANT)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should handle pagination correctly', async () => {
      const result = await userService.searchUsers(
        {},
        1,
        2,
        UserType.BUSINESS
      )

      expect(result.users).toHaveLength(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(2) // 3 Benutzer total, 2 pro Seite
    })
  })

  describe('getUserStats', () => {
    beforeEach(async () => {
      // Erstelle zusätzliche Benutzer für Statistiken
      const passwordHash = await bcrypt.hash('password123', 12)

      await testPrisma.user.create({
        data: {
          email: 'landlord@example.com',
          passwordHash,
          userType: UserType.LANDLORD,
          isVerified: true,
          isActive: false, // Inaktiv
          profile: {
            create: {
              city: 'München',
              language: 'de'
            }
          }
        }
      })

      await testPrisma.user.create({
        data: {
          email: 'business@example.com',
          passwordHash,
          userType: UserType.BUSINESS,
          isVerified: false,
          profile: {
            create: {
              city: 'Berlin',
              language: 'de'
            }
          }
        }
      })
    })

    it('should return user statistics for business user', async () => {
      const stats = await userService.getUserStats(UserType.BUSINESS)

      expect(stats.totalUsers).toBe(3)
      expect(stats.activeUsers).toBe(2) // Ein Benutzer ist inaktiv
      expect(stats.verifiedUsers).toBe(2) // Ein Benutzer ist nicht verifiziert
      expect(stats.usersByType.tenant).toBe(1)
      expect(stats.usersByType.landlord).toBe(1)
      expect(stats.usersByType.business).toBe(1)
      expect(stats.usersByLocation.Berlin).toBe(2) // Test-Benutzer + Business-Benutzer
      expect(stats.usersByLocation.München).toBe(1)
    })

    it('should reject stats request for non-business user', async () => {
      await expect(
        userService.getUserStats(UserType.TENANT)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should cache statistics', async () => {
      // Erster Aufruf
      const stats1 = await userService.getUserStats(UserType.BUSINESS)

      // Zweiter Aufruf sollte aus Cache kommen
      const stats2 = await userService.getUserStats(UserType.BUSINESS)

      expect(stats1).toEqual(stats2)
    })
  })

  describe('exportUserData', () => {
    it('should export all user data', async () => {
      const exportData = await userService.exportUserData(testUserId)

      expect(exportData.exportDate).toBeDefined()
      expect(exportData.userData.id).toBe(testUserId)
      expect(exportData.userData.email).toBe('test@example.com')
      expect(exportData.userData.profile).toBeDefined()
      expect(exportData.userData.preferences).toBeDefined()
      expect(exportData.userData).not.toHaveProperty('passwordHash')
    })

    it('should throw error for non-existent user', async () => {
      await expect(userService.exportUserData('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteUserData', () => {
    it('should delete all user data', async () => {
      // Erstelle Session
      const sessionToken = 'test-session'
      await testPrisma.userSession.create({
        data: {
          userId: testUserId,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })
      await redis.setSession(sessionToken, { userId: testUserId })

      await userService.deleteUserData(testUserId)

      // Prüfe ob Benutzer gelöscht wurde
      const user = await testPrisma.user.findUnique({
        where: { id: testUserId }
      })
      expect(user).toBeNull()

      // Prüfe ob Profile gelöscht wurden (Cascading Delete)
      const profile = await testPrisma.userProfile.findUnique({
        where: { userId: testUserId }
      })
      expect(profile).toBeNull()

      // Prüfe ob Sessions gelöscht wurden
      const redisSession = await redis.getSession(sessionToken)
      expect(redisSession).toBeNull()
    })

    it('should throw error for non-existent user', async () => {
      await expect(userService.deleteUserData('non-existent')).rejects.toThrow(NotFoundError)
    })
  })
})
