import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserType } from '@prisma/client'
import { config } from '../config/config'
import { redis } from '../config/redis'
import { logger, loggers } from '../utils/logger'
import { EmailService } from './EmailService'
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler'

export interface RegisterData {
  email: string
  password: string
  userType: UserType
  acceptedTerms: boolean
  location?: string
  firstName?: string
  lastName?: string
  language?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  user: {
    id: string
    email: string
    userType: UserType
    isVerified: boolean
    profile?: {
      firstName?: string
      lastName?: string
      location?: string
      language: string
    }
  }
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export interface TokenPayload {
  userId: string
  email: string
  userType: UserType
  sessionId: string
  type: 'access' | 'refresh'
}

export class AuthService {
  private emailService: EmailService

  constructor(private prisma: PrismaClient) {
    this.emailService = new EmailService()
  }

  /**
   * Registriert einen neuen Benutzer
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Validierung
      await this.validateRegistrationData(data)

      // Prüfe ob E-Mail bereits existiert
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      })

      if (existingUser) {
        throw new ConflictError('E-Mail-Adresse ist bereits registriert')
      }

      // Hash Passwort
      const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds)

      // Erstelle Benutzer mit Profil und Präferenzen
      const user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          userType: data.userType,
          profile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              location: data.location,
              language: data.language || 'de',
            }
          },
          preferences: {
            create: {
              language: data.language || 'de',
              notifications: {
                email: true,
                push: true,
                sms: false
              },
              privacy: {
                dataSharing: false,
                analytics: true,
                marketing: false
              }
            }
          }
        },
        include: {
          profile: true,
          preferences: true
        }
      })

      // Generiere Tokens
      const tokens = await this.generateTokens(user)

      // Sende Verifizierungs-E-Mail
      await this.sendVerificationEmail(user)

      // Log Registrierung
      loggers.businessEvent('USER_REGISTERED', user.id, {
        userType: user.userType,
        email: user.email
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
          profile: user.profile ? {
            firstName: user.profile.firstName || undefined,
            lastName: user.profile.lastName || undefined,
            location: user.profile.location || undefined,
            language: user.profile.language
          } : undefined
        },
        tokens
      }
    } catch (error) {
      logger.error('Registrierung fehlgeschlagen:', error)
      throw error
    }
  }

  /**
   * Meldet einen Benutzer an
   */
  async login(credentials: LoginCredentials, ip?: string): Promise<AuthResult> {
    try {
      // Rate Limiting prüfen
      if (ip) {
        await this.checkRateLimit(ip)
      }

      // Benutzer finden
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
        include: {
          profile: true,
          preferences: true
        }
      })

      if (!user) {
        // Log fehlgeschlagenen Login-Versuch
        loggers.securityEvent('LOGIN_FAILED', undefined, ip, {
          reason: 'USER_NOT_FOUND',
          email: credentials.email
        })
        throw new AuthenticationError('Ungültige Anmeldedaten')
      }

      // Prüfe ob Benutzer aktiv ist
      if (!user.isActive) {
        loggers.securityEvent('LOGIN_FAILED', user.id, ip, {
          reason: 'USER_INACTIVE'
        })
        throw new AuthenticationError('Benutzerkonto ist deaktiviert')
      }

      // Passwort prüfen
      const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)
      if (!isPasswordValid) {
        loggers.securityEvent('LOGIN_FAILED', user.id, ip, {
          reason: 'INVALID_PASSWORD'
        })
        throw new AuthenticationError('Ungültige Anmeldedaten')
      }

      // Update letzter Login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // Generiere Tokens
      const tokens = await this.generateTokens(user)

      // Log erfolgreichen Login
      loggers.businessEvent('USER_LOGIN', user.id, {
        ip,
        userAgent: 'unknown' // Wird vom Controller gesetzt
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
          profile: user.profile ? {
            firstName: user.profile.firstName || undefined,
            lastName: user.profile.lastName || undefined,
            location: user.profile.location || undefined,
            language: user.profile.language
          } : undefined
        },
        tokens
      }
    } catch (error) {
      logger.error('Login fehlgeschlagen:', error)
      throw error
    }
  }

  /**
   * Erneuert Access Token mit Refresh Token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verifiziere Refresh Token
      const payload = jwt.verify(refreshToken, config.jwt.secret) as TokenPayload

      if (payload.type !== 'refresh') {
        throw new AuthenticationError('Ungültiger Token-Typ')
      }

      // Prüfe ob Session noch gültig ist
      const session = await redis.getSession(payload.sessionId)
      if (!session) {
        throw new AuthenticationError('Session abgelaufen')
      }

      // Benutzer laden
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId }
      })

      if (!user || !user.isActive) {
        throw new AuthenticationError('Benutzer nicht gefunden oder inaktiv')
      }

      // Neuen Access Token generieren
      const accessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        userType: user.userType,
        sessionId: payload.sessionId
      })

      return { accessToken }
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Ungültiger Refresh Token')
      }
      throw error
    }
  }

  /**
   * Meldet einen Benutzer ab
   */
  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        // Lösche spezifische Session
        await redis.deleteSession(sessionId)
      } else {
        // Lösche alle Sessions des Benutzers
        const sessions = await this.prisma.userSession.findMany({
          where: { userId }
        })

        for (const session of sessions) {
          await redis.deleteSession(session.sessionToken)
        }

        // Lösche Session-Einträge aus der Datenbank
        await this.prisma.userSession.deleteMany({
          where: { userId }
        })
      }

      loggers.businessEvent('USER_LOGOUT', userId)
    } catch (error) {
      logger.error('Logout fehlgeschlagen:', error)
      throw error
    }
  }

  /**
   * Verifiziert einen Access Token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload

      if (payload.type !== 'access') {
        throw new AuthenticationError('Ungültiger Token-Typ')
      }

      // Prüfe ob Session noch gültig ist
      const session = await redis.getSession(payload.sessionId)
      if (!session) {
        throw new AuthenticationError('Session abgelaufen')
      }

      return payload
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Ungültiger Access Token')
      }
      throw error
    }
  }

  /**
   * Generiert Access und Refresh Tokens
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionId = this.generateSessionId()

    // Session in Redis speichern
    await redis.setSession(sessionId, {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      createdAt: new Date().toISOString()
    }, 7 * 24 * 60 * 60) // 7 Tage

    // Session in Datenbank speichern
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: sessionId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
      }
    })

    const tokenData = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      sessionId
    }

    const accessToken = this.generateAccessToken(tokenData)
    const refreshToken = this.generateRefreshToken(tokenData)

    return { accessToken, refreshToken }
  }

  /**
   * Generiert Access Token
   */
  private generateAccessToken(data: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...data, type: 'access' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )
  }

  /**
   * Generiert Refresh Token
   */
  private generateRefreshToken(data: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...data, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    )
  }

  /**
   * Generiert eine eindeutige Session-ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validiert Registrierungsdaten
   */
  private async validateRegistrationData(data: RegisterData): Promise<void> {
    const errors: string[] = []

    // E-Mail Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Ungültige E-Mail-Adresse')
    }

    // Passwort Validierung
    if (data.password.length < config.security.passwordMinLength) {
      errors.push(`Passwort muss mindestens ${config.security.passwordMinLength} Zeichen lang sein`)
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.push('Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten')
    }

    // Nutzungsbedingungen
    if (!data.acceptedTerms) {
      errors.push('Nutzungsbedingungen müssen akzeptiert werden')
    }

    // UserType Validierung
    if (!Object.values(UserType).includes(data.userType)) {
      errors.push('Ungültiger Benutzertyp')
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '))
    }
  }

  /**
   * Prüft Rate Limiting für Login-Versuche
   */
  private async checkRateLimit(ip: string): Promise<void> {
    const key = `auth:rate_limit:${ip}`
    const attempts = await redis.incrementRateLimit(key, 15 * 60) // 15 Minuten

    if (attempts > config.rateLimit.authMax) {
      loggers.securityEvent('RATE_LIMIT_EXCEEDED', undefined, ip, {
        attempts,
        limit: config.rateLimit.authMax
      })
      throw new AuthenticationError('Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.')
    }
  }

  /**
   * Passwort zurücksetzen (E-Mail senden)
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { profile: true }
      })

      if (!user) {
        // Aus Sicherheitsgründen keine Fehlermeldung, dass Benutzer nicht existiert
        logger.info('Password reset requested for non-existent email', { email })
        return
      }

      // Generiere Reset Token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      // Speichere Reset Token in Redis (1 Stunde gültig)
      await redis.set(`password_reset:${user.id}`, resetToken, 3600)

      // Sende Passwort-Reset-E-Mail
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        {
          firstName: user.profile?.firstName,
          expiresIn: '1 Stunde'
        }
      )

      loggers.businessEvent('PASSWORD_RESET_REQUESTED', user.id)
    } catch (error) {
      logger.error('Password reset request failed:', error)
      throw error
    }
  }

  /**
   * Passwort zurücksetzen (mit Token)
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verifiziere Reset Token
      const payload = jwt.verify(token, config.jwt.secret) as any

      if (payload.type !== 'password_reset') {
        throw new AuthenticationError('Ungültiger Reset Token')
      }

      // Prüfe ob Token noch in Redis existiert
      const storedToken = await redis.get(`password_reset:${payload.userId}`)
      if (!storedToken || storedToken !== token) {
        throw new AuthenticationError('Reset Token ist abgelaufen oder ungültig')
      }

      // Validiere neues Passwort
      if (newPassword.length < config.security.passwordMinLength) {
        throw new ValidationError(`Passwort muss mindestens ${config.security.passwordMinLength} Zeichen lang sein`)
      }

      // Hash neues Passwort
      const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds)

      // Update Passwort
      await this.prisma.user.update({
        where: { id: payload.userId },
        data: { passwordHash }
      })

      // Lösche Reset Token
      await redis.del(`password_reset:${payload.userId}`)

      // Lösche alle Sessions des Benutzers (Sicherheit)
      await this.logout(payload.userId)

      loggers.businessEvent('PASSWORD_RESET_COMPLETED', payload.userId)
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Ungültiger Reset Token')
      }
      throw error
    }
  }

  /**
   * Sendet Verifizierungs-E-Mail
   */
  async sendVerificationEmail(user: any): Promise<void> {
    try {
      // Generiere Verifizierungs-Token
      const verificationToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      )

      // Speichere Token in Redis (24 Stunden gültig)
      await redis.set(`email_verification:${user.id}`, verificationToken, 24 * 60 * 60)

      // Sende E-Mail
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        {
          firstName: user.profile?.firstName,
          expiresIn: '24 Stunden'
        }
      )

      loggers.businessEvent('EMAIL_VERIFICATION_SENT', user.id)
    } catch (error) {
      logger.error('Fehler beim Senden der Verifizierungs-E-Mail:', error)
      // Fehler nicht weiterwerfen, da Registrierung trotzdem erfolgreich sein soll
    }
  }

  /**
   * Verifiziert E-Mail-Adresse mit Token
   */
  async verifyEmailWithToken(token: string): Promise<void> {
    try {
      // Verifiziere Token
      const payload = jwt.verify(token, config.jwt.secret) as any

      if (payload.type !== 'email_verification') {
        throw new AuthenticationError('Ungültiger Verifizierungs-Token')
      }

      // Prüfe ob Token noch in Redis existiert
      const storedToken = await redis.get(`email_verification:${payload.userId}`)
      if (!storedToken || storedToken !== token) {
        throw new AuthenticationError('Verifizierungs-Token ist abgelaufen oder ungültig')
      }

      // Lade Benutzer
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        include: { profile: true }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      if (user.isVerified) {
        throw new ValidationError('E-Mail-Adresse ist bereits verifiziert')
      }

      // Verifiziere Benutzer
      await this.prisma.user.update({
        where: { id: payload.userId },
        data: { isVerified: true }
      })

      // Lösche Verifizierungs-Token
      await redis.del(`email_verification:${payload.userId}`)

      // Sende Willkommens-E-Mail
      await this.emailService.sendWelcomeEmail(
        user.email,
        {
          firstName: user.profile?.firstName,
          userType: this.getUserTypeDisplayName(user.userType),
          loginUrl: this.getLoginUrl()
        }
      )

      loggers.businessEvent('EMAIL_VERIFIED', payload.userId)
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Ungültiger Verifizierungs-Token')
      }
      throw error
    }
  }

  /**
   * Sendet Verifizierungs-E-Mail erneut
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      if (user.isVerified) {
        throw new ValidationError('E-Mail-Adresse ist bereits verifiziert')
      }

      // Prüfe Rate Limiting
      const rateLimitKey = `resend_verification:${userId}`
      const attempts = await redis.get(rateLimitKey)
      
      if (attempts && parseInt(attempts) >= 3) {
        throw new ValidationError('Zu viele Verifizierungs-E-Mails gesendet. Bitte warten Sie 1 Stunde.')
      }

      // Erhöhe Zähler
      await redis.set(rateLimitKey, (parseInt(attempts || '0') + 1).toString(), 3600)

      // Sende neue Verifizierungs-E-Mail
      await this.sendVerificationEmail(user)

    } catch (error) {
      logger.error('Fehler beim erneuten Senden der Verifizierungs-E-Mail:', error)
      throw error
    }
  }

  /**
   * Ändert E-Mail-Adresse (mit Verifizierung)
   */
  async changeEmail(userId: string, newEmail: string, password: string): Promise<void> {
    try {
      // Validiere neue E-Mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        throw new ValidationError('Ungültige E-Mail-Adresse')
      }

      // Lade aktuellen Benutzer
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      })

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden')
      }

      // Verifiziere Passwort
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        throw new AuthenticationError('Ungültiges Passwort')
      }

      // Prüfe ob neue E-Mail bereits existiert
      const existingUser = await this.prisma.user.findUnique({
        where: { email: newEmail.toLowerCase() }
      })

      if (existingUser) {
        throw new ConflictError('E-Mail-Adresse ist bereits registriert')
      }

      // Generiere Bestätigungs-Token für neue E-Mail
      const changeToken = jwt.sign(
        { userId, oldEmail: user.email, newEmail: newEmail.toLowerCase(), type: 'email_change' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      // Speichere Token in Redis
      await redis.set(`email_change:${userId}`, changeToken, 3600)

      // Sende Bestätigungs-E-Mail an neue Adresse
      await this.emailService.sendTemplatedEmail(
        newEmail.toLowerCase(),
        'email-change-confirmation',
        {
          firstName: user.profile?.firstName,
          oldEmail: user.email,
          newEmail: newEmail.toLowerCase(),
          confirmationUrl: `${this.getBaseUrl()}/confirm-email-change?token=${changeToken}`,
          expiresIn: '1 Stunde'
        }
      )

      loggers.businessEvent('EMAIL_CHANGE_REQUESTED', userId, {
        oldEmail: user.email,
        newEmail: newEmail.toLowerCase()
      })

    } catch (error) {
      logger.error('Fehler beim Ändern der E-Mail-Adresse:', error)
      throw error
    }
  }

  /**
   * Bestätigt E-Mail-Änderung
   */
  async confirmEmailChange(token: string): Promise<void> {
    try {
      // Verifiziere Token
      const payload = jwt.verify(token, config.jwt.secret) as any

      if (payload.type !== 'email_change') {
        throw new AuthenticationError('Ungültiger Bestätigungs-Token')
      }

      // Prüfe ob Token noch in Redis existiert
      const storedToken = await redis.get(`email_change:${payload.userId}`)
      if (!storedToken || storedToken !== token) {
        throw new AuthenticationError('Bestätigungs-Token ist abgelaufen oder ungültig')
      }

      // Prüfe ob neue E-Mail noch verfügbar ist
      const existingUser = await this.prisma.user.findUnique({
        where: { email: payload.newEmail }
      })

      if (existingUser && existingUser.id !== payload.userId) {
        throw new ConflictError('E-Mail-Adresse ist bereits registriert')
      }

      // Aktualisiere E-Mail-Adresse
      await this.prisma.user.update({
        where: { id: payload.userId },
        data: { 
          email: payload.newEmail,
          isVerified: true // E-Mail ist durch Bestätigung verifiziert
        }
      })

      // Lösche Token
      await redis.del(`email_change:${payload.userId}`)

      // Lösche alle Sessions (Sicherheit)
      await this.logout(payload.userId)

      loggers.businessEvent('EMAIL_CHANGED', payload.userId, {
        oldEmail: payload.oldEmail,
        newEmail: payload.newEmail
      })

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Ungültiger Bestätigungs-Token')
      }
      throw error
    }
  }

  /**
   * Hilfsmethoden
   */
  private getUserTypeDisplayName(userType: UserType): string {
    switch (userType) {
      case UserType.TENANT:
        return 'Mieter'
      case UserType.LANDLORD:
        return 'Vermieter'
      case UserType.BUSINESS:
        return 'Geschäftskunde'
      default:
        return 'Benutzer'
    }
  }

  private getLoginUrl(): string {
    if (config.nodeEnv === 'production') {
      return 'https://smartlaw.de/login'
    }
    return 'http://localhost:3000/login'
  }

  private getBaseUrl(): string {
    if (config.nodeEnv === 'production') {
      return 'https://smartlaw.de'
    }
    return 'http://localhost:3000'
  }
}