   import { PrismaClient, UserType, User, UserProfile, UserPreferences } from '@prisma/client'
import { logger, loggers } from '../utils/logger'
import { redis } from '../config/redis'
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '../middleware/errorHandler'
import { EncryptionServiceWithKMS } from './EncryptionService'
import { KeyPurpose } from '../types/kms'

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  location?: string
  language?: string
  accessibilityNeeds?: {
    screenReader?: boolean
    highContrast?: boolean
    largeText?: boolean
    keyboardNavigation?: boolean
  }
}

export interface UpdatePreferencesData {
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  privacy?: {
    dataSharing?: boolean
    analytics?: boolean
    marketing?: boolean
  }
  language?: string
}

export interface UserWithDetails extends User {
  profile?: UserProfile | null
  preferences?: UserPreferences | null
}

export interface UserSearchFilters {
  userType?: UserType
  location?: string
  isVerified?: boolean
  isActive?: boolean
  createdAfter?: Date
  createdBefore?: Date
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  usersByType: {
    tenant: number
    landlord: number
    business: number
  }
  usersByLocation: Record<string, number>
  recentRegistrations: number
}

export class UserService {
  constructor(
    private prisma: PrismaClient,
    private encryptionService?: EncryptionServiceWithKMS
  ) {}

  /**
   * Ruft Benutzerinformationen mit Profil und Präferenzen ab
   */
  async getUserById(userId: string): Promise<UserWithDetails | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true
        }
      })

      if (!user) {
        return null
      }

      // Entferne sensible Daten
      const { passwordHash, ...userWithoutPassword } = user

      // Entschlüssele Profildaten falls KMS verfügbar und Daten verschlüsselt sind
      // Note: Encryption is optional and handled transparently
      if (this.encryptionService && user.profile?.accessibilityNeeds) {
        try {
          // Check if data is encrypted (has specific structure)
          const accessibilityData = user.profile.accessibilityNeeds as any
          if (accessibilityData.encryptedData) {
            const decryptedAccessibilityNeeds = await this.encryptionService.decryptObjectWithKMS(
              accessibilityData,
              userId,
              'UserService'
            )
            
            // Füge entschlüsselte Daten zum Profil hinzu
            if (userWithoutPassword.profile) {
              userWithoutPassword.profile = {
                ...userWithoutPassword.profile,
                accessibilityNeeds: decryptedAccessibilityNeeds
              }
            }
            
            logger.debug('Profile data decrypted with KMS', { userId })
          }
        } catch (decryptionError) {
          logger.warn('Failed to decrypt profile data:', decryptionError)
          // Continue with data as-is
        }
      }

      return userWithoutPassword as UserWithDetails
    } catch (error) {
      logger.error('Fehler beim Abrufen des Benutzers:', error)
      throw error
    }
  }

  /**
   * Ruft Benutzer anhand der E-Mail-Adresse ab
   */
  async getUserByEmail(email: string): Promise<UserWithDetails | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          profile: true,
          preferences: true
        }
      })

      if (!user) {
        return null
      }

      const { passwordHash, ...userWithoutPassword } = user
      return userWithoutPassword as UserWithDetails
    } catch (error) {
      logger.error('Fehler beim Abrufen des Benutzers per E-Mail:', error)
      throw error
    }
  }

  /**
   * Aktualisiert das Benutzerprofil
   */
  async updateProfile(userId: string, profileData: UpdateProfileData): Promise<UserProfile> {
    try {
      // Validiere Eingabedaten
      this.validateProfileData(profileData)

      // Prüfe ob Benutzer existiert
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      // Verschlüssele sensitive Daten falls KMS verfügbar
      let processedData = { ...profileData }
      if (this.encryptionService && profileData.accessibilityNeeds) {
        try {
          const encrypted = await this.encryptionService.encryptObjectWithKMS(
            profileData.accessibilityNeeds,
            userId, // Use userId as tenantId
            KeyPurpose.FIELD_ENCRYPTION,
            'UserService'
          )
          
          // Store encrypted data directly in accessibilityNeeds field
          processedData = {
            ...profileData,
            accessibilityNeeds: encrypted as any // Store encrypted structure
          }
          
          // Update with encrypted data
          const profile = await this.prisma.userProfile.upsert({
            where: { userId },
            update: {
              firstName: processedData.firstName,
              lastName: processedData.lastName,
              location: processedData.location,
              language: processedData.language,
              accessibilityNeeds: processedData.accessibilityNeeds
            },
            create: {
              userId,
              firstName: processedData.firstName,
              lastName: processedData.lastName,
              location: processedData.location,
              language: processedData.language || 'de',
              accessibilityNeeds: processedData.accessibilityNeeds
            }
          })

          logger.info('Profile updated with KMS encryption', { userId })
          
          // Invalidiere Cache
          await this.invalidateUserCache(userId)

          // Log Profilaktualisierung
          loggers.businessEvent('PROFILE_UPDATED', userId, {
            updatedFields: Object.keys(profileData),
            encrypted: true
          })

          return profile
        } catch (encryptionError) {
          logger.warn('KMS encryption failed, falling back to unencrypted storage:', encryptionError)
          // Fall back to unencrypted storage
        }
      }

      // Standard update without encryption
      const profile = await this.prisma.userProfile.upsert({
        where: { userId },
        update: {
          firstName: processedData.firstName,
          lastName: processedData.lastName,
          location: processedData.location,
          language: processedData.language,
          accessibilityNeeds: processedData.accessibilityNeeds
        },
        create: {
          userId,
          firstName: processedData.firstName,
          lastName: processedData.lastName,
          location: processedData.location,
          language: processedData.language || 'de',
          accessibilityNeeds: processedData.accessibilityNeeds
        }
      })

      // Invalidiere Cache
      await this.invalidateUserCache(userId)

      // Log Profilaktualisierung
      loggers.businessEvent('PROFILE_UPDATED', userId, {
        updatedFields: Object.keys(profileData)
      })

      return profile
    } catch (error) {
      logger.error('Fehler beim Aktualisieren des Profils:', error)
      throw error
    }
  }

  /**
   * Aktualisiert die Benutzerpräferenzen
   */
  async updatePreferences(userId: string, preferencesData: UpdatePreferencesData): Promise<UserPreferences> {
    try {
      // Validiere Eingabedaten
      this.validatePreferencesData(preferencesData)

      // Prüfe ob Benutzer existiert
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      // Hole aktuelle Präferenzen
      const currentPreferences = await this.prisma.userPreferences.findUnique({
        where: { userId }
      })

      // Merge neue Daten mit bestehenden
      const updatedNotifications = {
        ...((currentPreferences?.notifications as any) || {}),
        ...(preferencesData.notifications || {})
      }

      const updatedPrivacy = {
        ...((currentPreferences?.privacy as any) || {}),
        ...(preferencesData.privacy || {})
      }

      // Aktualisiere oder erstelle Präferenzen
      const preferences = await this.prisma.userPreferences.upsert({
        where: { userId },
        update: {
          notifications: updatedNotifications,
          privacy: updatedPrivacy,
          language: preferencesData.language || currentPreferences?.language || 'de'
        },
        create: {
          userId,
          notifications: updatedNotifications,
          privacy: updatedPrivacy,
          language: preferencesData.language || 'de'
        }
      })

      // Invalidiere Cache
      await this.invalidateUserCache(userId)

      // Log Präferenzaktualisierung
      loggers.businessEvent('PREFERENCES_UPDATED', userId, {
        updatedFields: Object.keys(preferencesData)
      })

      return preferences
    } catch (error) {
      logger.error('Fehler beim Aktualisieren der Präferenzen:', error)
      throw error
    }
  }

  /**
   * Deaktiviert einen Benutzer (Soft Delete)
   */
  async deactivateUser(userId: string, reason?: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      if (!user.isActive) {
        throw new ValidationError('Benutzer ist bereits deaktiviert')
      }

      // Deaktiviere Benutzer
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      })

      // Lösche alle aktiven Sessions
      const sessions = await this.prisma.userSession.findMany({
        where: { userId }
      })

      for (const session of sessions) {
        await redis.deleteSession(session.sessionToken)
      }

      await this.prisma.userSession.deleteMany({
        where: { userId }
      })

      // Invalidiere Cache
      await this.invalidateUserCache(userId)

      // Log Deaktivierung
      loggers.businessEvent('USER_DEACTIVATED', userId, { reason })

    } catch (error) {
      logger.error('Fehler beim Deaktivieren des Benutzers:', error)
      throw error
    }
  }

  /**
   * Reaktiviert einen Benutzer
   */
  async reactivateUser(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      if (user.isActive) {
        throw new ValidationError('Benutzer ist bereits aktiv')
      }

      // Reaktiviere Benutzer
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      })

      // Invalidiere Cache
      await this.invalidateUserCache(userId)

      // Log Reaktivierung
      loggers.businessEvent('USER_REACTIVATED', userId)

    } catch (error) {
      logger.error('Fehler beim Reaktivieren des Benutzers:', error)
      throw error
    }
  }

  /**
   * Verifiziert die E-Mail-Adresse eines Benutzers
   */
  async verifyEmail(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      if (user.isVerified) {
        throw new ValidationError('E-Mail-Adresse ist bereits verifiziert')
      }

      // Verifiziere E-Mail
      await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
      })

      // Invalidiere Cache
      await this.invalidateUserCache(userId)

      // Log E-Mail-Verifizierung
      loggers.businessEvent('EMAIL_VERIFIED', userId)

    } catch (error) {
      logger.error('Fehler beim Verifizieren der E-Mail:', error)
      throw error
    }
  }

  /**
   * Sucht Benutzer basierend auf Filtern (nur für Business-Benutzer)
   */
  async searchUsers(
    filters: UserSearchFilters,
    page: number = 1,
    limit: number = 20,
    requestingUserType: UserType
  ): Promise<{
    users: UserWithDetails[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      // Nur Business-Benutzer dürfen andere Benutzer suchen
      if (requestingUserType !== UserType.BUSINESS) {
        throw new AuthorizationError('Nicht autorisiert für Benutzersuche')
      }

      const skip = (page - 1) * limit

      // Baue Where-Klausel auf
      const where: any = {}

      if (filters.userType) {
        where.userType = filters.userType
      }

      if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {}
        if (filters.createdAfter) {
          where.createdAt.gte = filters.createdAfter
        }
        if (filters.createdBefore) {
          where.createdAt.lte = filters.createdBefore
        }
      }

      if (filters.location) {
        where.profile = {
          location: {
            contains: filters.location,
            mode: 'insensitive'
          }
        }
      }

      // Hole Benutzer und Gesamtanzahl
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            profile: true,
            preferences: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.user.count({ where })
      ])

      // Entferne sensible Daten
      const sanitizedUsers = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user
        return userWithoutPassword as UserWithDetails
      })

      return {
        users: sanitizedUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      logger.error('Fehler bei der Benutzersuche:', error)
      throw error
    }
  }

  /**
   * Ruft Benutzerstatistiken ab (nur für Business-Benutzer)
   */
  async getUserStats(requestingUserType: UserType): Promise<UserStats> {
    try {
      // Nur Business-Benutzer dürfen Statistiken abrufen
      if (requestingUserType !== UserType.BUSINESS) {
        throw new AuthorizationError('Nicht autorisiert für Benutzerstatistiken')
      }

      // Cache-Key für Statistiken
      const cacheKey = 'user_stats'
      const cachedStats = await redis.get<UserStats>(cacheKey)

      if (cachedStats) {
        return cachedStats
      }

      // Berechne Statistiken
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        tenantCount,
        landlordCount,
        businessCount,
        locationStats,
        recentRegistrations
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isVerified: true } }),
        this.prisma.user.count({ where: { userType: UserType.TENANT } }),
        this.prisma.user.count({ where: { userType: UserType.LANDLORD } }),
        this.prisma.user.count({ where: { userType: UserType.BUSINESS } }),
        this.prisma.userProfile.groupBy({
          by: ['location'],
          _count: { location: true },
          where: { location: { not: null } }
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Letzte 30 Tage
            }
          }
        })
      ])

      // Formatiere Standort-Statistiken
      const usersByLocation: Record<string, number> = {}
      locationStats.forEach(stat => {
        if (stat.location) {
          usersByLocation[stat.location] = stat._count.location
        }
      })

      const stats: UserStats = {
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByType: {
          tenant: tenantCount,
          landlord: landlordCount,
          business: businessCount
        },
        usersByLocation,
        recentRegistrations
      }

      // Cache für 1 Stunde
      await redis.set(cacheKey, stats, 3600)

      return stats
    } catch (error) {
      logger.error('Fehler beim Abrufen der Benutzerstatistiken:', error)
      throw error
    }
  }

  /**
   * Löscht alle Benutzerdaten (DSGVO-Recht auf Löschung)
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      // Lösche alle Benutzerdaten in einer Transaktion
      await this.prisma.$transaction(async (tx) => {
        // Lösche Sessions
        const sessions = await tx.userSession.findMany({
          where: { userId }
        })

        for (const session of sessions) {
          await redis.deleteSession(session.sessionToken)
        }

        // Lösche alle verknüpften Daten (Cascading Delete durch Schema)
        await tx.user.delete({
          where: { id: userId }
        })
      })

      // Invalidiere Cache
      await this.invalidateUserCache(userId)

      // Log Datenlöschung
      loggers.businessEvent('USER_DATA_DELETED', userId, {
        reason: 'GDPR_REQUEST'
      })

    } catch (error) {
      logger.error('Fehler beim Löschen der Benutzerdaten:', error)
      throw error
    }
  }

  /**
   * Exportiert alle Benutzerdaten (DSGVO-Recht auf Datenportabilität)
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true,
          cases: {
            include: {
              messages: true,
              documents: true
            }
          },
          documents: true,
          bookings: {
            include: {
              lawyer: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      // Entferne sensible Daten
      const { passwordHash, ...exportData } = user

      // Log Datenexport
      loggers.businessEvent('USER_DATA_EXPORTED', userId)

      return {
        exportDate: new Date().toISOString(),
        userData: exportData
      }
    } catch (error) {
      logger.error('Fehler beim Exportieren der Benutzerdaten:', error)
      throw error
    }
  }

  /**
   * Validiert Profildaten
   */
  private validateProfileData(data: UpdateProfileData): void {
    const errors: string[] = []

    if (data.firstName && (data.firstName.length < 1 || data.firstName.length > 50)) {
      errors.push('Vorname muss zwischen 1 und 50 Zeichen lang sein')
    }

    if (data.lastName && (data.lastName.length < 1 || data.lastName.length > 50)) {
      errors.push('Nachname muss zwischen 1 und 50 Zeichen lang sein')
    }

    if (data.location && data.location.length > 100) {
      errors.push('Standort darf maximal 100 Zeichen lang sein')
    }

    if (data.language && !['de', 'en', 'tr', 'ar'].includes(data.language)) {
      errors.push('Ungültige Sprache')
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '))
    }
  }

  /**
   * Validiert Präferenzdaten
   */
  private validatePreferencesData(data: UpdatePreferencesData): void {
    const errors: string[] = []

    if (data.language && !['de', 'en', 'tr', 'ar'].includes(data.language)) {
      errors.push('Ungültige Sprache')
    }

    // Validiere Notification-Struktur
    if (data.notifications) {
      const validKeys = ['email', 'push', 'sms']
      const invalidKeys = Object.keys(data.notifications).filter(key => !validKeys.includes(key))
      if (invalidKeys.length > 0) {
        errors.push(`Ungültige Notification-Einstellungen: ${invalidKeys.join(', ')}`)
      }
    }

    // Validiere Privacy-Struktur
    if (data.privacy) {
      const validKeys = ['dataSharing', 'analytics', 'marketing']
      const invalidKeys = Object.keys(data.privacy).filter(key => !validKeys.includes(key))
      if (invalidKeys.length > 0) {
        errors.push(`Ungültige Privacy-Einstellungen: ${invalidKeys.join(', ')}`)
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '))
    }
  }

  /**
   * Invalidiert Benutzer-Cache
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      await redis.del(`user:${userId}`)
      await redis.del('user_stats')
    } catch (error) {
      logger.warn('Fehler beim Invalidieren des Benutzer-Cache:', error)
    }
  }
}