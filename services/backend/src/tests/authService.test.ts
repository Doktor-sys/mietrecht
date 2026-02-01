import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthService, RegisterData, LoginCredentials } from '../services/AuthService'
import { redis } from '../config/redis'
import { config } from '../config/config'
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError 
} from '../middleware/errorHandler'

// Test-spezifische Prisma-Instanz
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/smartlaw_test',
    },
  },
})

describe('AuthService Unit Tests', () => {
  let authService: AuthService

  beforeAll(async () => {
    await testPrisma.$connect()
    await redis.connect()
    authService = new AuthService(testPrisma)
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
  })

  describe('register', () => {
    const validRegisterData: RegisterData = {
      email: 'test@example.com',
      password: 'SecurePass123',
      userType: UserType.TENANT,
      acceptedTerms: true,
      firstName: 'Max',
      lastName: 'Mustermann',
      location: 'Berlin',
      language: 'de'
    }

    it('should register user successfully', async () => {
      const result = await authService.register(validRegisterData)

      expect(result.user.email).toBe(validRegisterData.email)
      expect(result.user.userType).toBe(validRegisterData.userType)
      expect(result.user.isVerified).toBe(false)
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()

      // Prüfe Datenbank
      const user = await testPrisma.user.findUnique({
        where: { email: validRegisterData.email },
        include: { profile: true, preferences: true }
      })

      expect(user).toBeTruthy()
      expect(user?.profile?.firstName).toBe(validRegisterData.firstName)
      expect(user?.preferences?.language).toBe(validRegisterData.language)
    })

    it('should hash password correctly', async () => {
      await authService.register(validRegisterData)

      const user = await testPrisma.user.findUnique({
        where: { email: validRegisterData.email }
      })

      expect(user?.passwordHash).not.toBe(validRegisterData.password)
      
      const isPasswordValid = await bcrypt.compare(validRegisterData.password, user!.passwordHash)
      expect(isPasswordValid).toBe(true)
    })

    it('should create session in Redis', async () => {
      const result = await authService.register(validRegisterData)

      // Dekodiere Token um Session ID zu erhalten
      const payload = jwt.decode(result.tokens.accessToken) as any
      const sessionId = payload.sessionId

      const session = await redis.getSession(sessionId)
      expect(session).toBeTruthy()
      expect(session.userId).toBe(result.user.id)
    })

    it('should reject invalid email', async () => {
      const invalidData = { ...validRegisterData, email: 'invalid-email' }

      await expect(authService.register(invalidData)).rejects.toThrow(ValidationError)
    })

    it('should reject weak password', async () => {
      const invalidData = { ...validRegisterData, password: '123' }

      await expect(authService.register(invalidData)).rejects.toThrow(ValidationError)
    })

    it('should reject duplicate email', async () => {
      await authService.register(validRegisterData)

      await expect(authService.register(validRegisterData)).rejects.toThrow(ConflictError)
    })

    it('should reject without accepted terms', async () => {
      const invalidData = { ...validRegisterData, acceptedTerms: false }

      await expect(authService.register(invalidData)).rejects.toThrow(ValidationError)
    })
  })

  describe('login', () => {
    const userData = {
      email: 'login@example.com',
      password: 'SecurePass123',
      userType: UserType.TENANT
    }

    beforeEach(async () => {
      // Erstelle Test-Benutzer
      const passwordHash = await bcrypt.hash(userData.password, 12)
      await testPrisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          userType: userData.userType,
          isVerified: true,
          profile: {
            create: {
              firstName: 'Test',
              lastName: 'User',
              language: 'de'
            }
          },
          preferences: {
            create: {
              language: 'de'
            }
          }
        }
      })
    })

    it('should login successfully', async () => {
      const credentials: LoginCredentials = {
        email: userData.email,
        password: userData.password
      }

      const result = await authService.login(credentials)

      expect(result.user.email).toBe(userData.email)
      expect(result.user.userType).toBe(userData.userType)
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })

    it('should update lastLoginAt', async () => {
      const credentials: LoginCredentials = {
        email: userData.email,
        password: userData.password
      }

      await authService.login(credentials)

      const user = await testPrisma.user.findUnique({
        where: { email: userData.email }
      })

      expect(user?.lastLoginAt).toBeTruthy()
    })

    it('should reject invalid email', async () => {
      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: userData.password
      }

      await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError)
    })

    it('should reject invalid password', async () => {
      const credentials: LoginCredentials = {
        email: userData.email,
        password: 'wrongpassword'
      }

      await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError)
    })

    it('should reject inactive user', async () => {
      await testPrisma.user.update({
        where: { email: userData.email },
        data: { isActive: false }
      })

      const credentials: LoginCredentials = {
        email: userData.email,
        password: userData.password
      }

      await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError)
    })
  })

  describe('refreshToken', () => {
    let refreshToken: string
    let userId: string
    let sessionId: string

    beforeEach(async () => {
      // Erstelle Benutzer und Session
      const passwordHash = await bcrypt.hash('password123', 12)
      const user = await testPrisma.user.create({
        data: {
          email: 'refresh@example.com',
          passwordHash,
          userType: UserType.TENANT,
          isVerified: true
        }
      })

      userId = user.id
      sessionId = `session_${Date.now()}_test`

      // Erstelle Session in Redis
      await redis.setSession(sessionId, {
        userId,
        email: user.email,
        userType: user.userType,
        createdAt: new Date().toISOString()
      })

      // Erstelle Refresh Token
      refreshToken = jwt.sign(
        { userId, email: user.email, userType: user.userType, sessionId, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: '7d' }
      )
    })

    it('should refresh token successfully', async () => {
      const result = await authService.refreshToken(refreshToken)

      expect(result.accessToken).toBeDefined()

      // Prüfe neuen Token
      const payload = jwt.verify(result.accessToken, config.jwt.secret) as any
      expect(payload.userId).toBe(userId)
      expect(payload.type).toBe('access')
    })

    it('should reject invalid token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(AuthenticationError)
    })

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId, sessionId, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: '-1h' }
      )

      await expect(authService.refreshToken(expiredToken)).rejects.toThrow(AuthenticationError)
    })

    it('should reject token with invalid type', async () => {
      const accessToken = jwt.sign(
        { userId, sessionId, type: 'access' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      await expect(authService.refreshToken(accessToken)).rejects.toThrow(AuthenticationError)
    })

    it('should reject token with expired session', async () => {
      // Lösche Session aus Redis
      await redis.deleteSession(sessionId)

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(AuthenticationError)
    })
  })

  describe('logout', () => {
    let userId: string
    let sessionId: string

    beforeEach(async () => {
      // Erstelle Benutzer und Session
      const user = await testPrisma.user.create({
        data: {
          email: 'logout@example.com',
          passwordHash: 'hash',
          userType: UserType.TENANT
        }
      })

      userId = user.id
      sessionId = `session_${Date.now()}_test`

      // Erstelle Session
      await redis.setSession(sessionId, { userId })
      await testPrisma.userSession.create({
        data: {
          userId,
          sessionToken: sessionId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })
    })

    it('should logout specific session', async () => {
      await authService.logout(userId, sessionId)

      const session = await redis.getSession(sessionId)
      expect(session).toBeNull()
    })

    it('should logout all sessions', async () => {
      // Erstelle zweite Session
      const sessionId2 = `session_${Date.now()}_test2`
      await redis.setSession(sessionId2, { userId })
      await testPrisma.userSession.create({
        data: {
          userId,
          sessionToken: sessionId2,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })

      await authService.logout(userId)

      // Prüfe ob alle Sessions gelöscht wurden
      const session1 = await redis.getSession(sessionId)
      const session2 = await redis.getSession(sessionId2)
      expect(session1).toBeNull()
      expect(session2).toBeNull()

      const dbSessions = await testPrisma.userSession.findMany({
        where: { userId }
      })
      expect(dbSessions).toHaveLength(0)
    })
  })

  describe('verifyToken', () => {
    let accessToken: string
    let userId: string
    let sessionId: string

    beforeEach(async () => {
      // Erstelle Benutzer und Session
      const user = await testPrisma.user.create({
        data: {
          email: 'verify@example.com',
          passwordHash: 'hash',
          userType: UserType.TENANT
        }
      })

      userId = user.id
      sessionId = `session_${Date.now()}_test`

      // Erstelle Session in Redis
      await redis.setSession(sessionId, { userId })

      // Erstelle Access Token
      accessToken = jwt.sign(
        { userId, email: user.email, userType: user.userType, sessionId, type: 'access' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )
    })

    it('should verify valid token', async () => {
      const payload = await authService.verifyToken(accessToken)

      expect(payload.userId).toBe(userId)
      expect(payload.type).toBe('access')
      expect(payload.sessionId).toBe(sessionId)
    })

    it('should reject invalid token', async () => {
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow(AuthenticationError)
    })

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId, sessionId, type: 'access' },
        config.jwt.secret,
        { expiresIn: '-1h' }
      )

      await expect(authService.verifyToken(expiredToken)).rejects.toThrow(AuthenticationError)
    })

    it('should reject token with expired session', async () => {
      // Lösche Session aus Redis
      await redis.deleteSession(sessionId)

      await expect(authService.verifyToken(accessToken)).rejects.toThrow(AuthenticationError)
    })
  })

  describe('password reset', () => {
    let userId: string

    beforeEach(async () => {
      const user = await testPrisma.user.create({
        data: {
          email: 'reset@example.com',
          passwordHash: await bcrypt.hash('oldpassword123', 12),
          userType: UserType.TENANT,
          isVerified: true
        }
      })
      userId = user.id
    })

    it('should request password reset', async () => {
      await authService.requestPasswordReset('reset@example.com')

      // Prüfe ob Reset Token in Redis gespeichert wurde
      const resetToken = await redis.get(`password_reset:${userId}`)
      expect(resetToken).toBeTruthy()
    })

    it('should handle non-existent email gracefully', async () => {
      // Sollte keinen Fehler werfen
      await expect(authService.requestPasswordReset('nonexistent@example.com')).resolves.toBeUndefined()
    })

    it('should reset password with valid token', async () => {
      // Erstelle Reset Token
      const resetToken = jwt.sign(
        { userId, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      await redis.set(`password_reset:${userId}`, resetToken, 3600)

      await authService.resetPassword(resetToken, 'NewSecurePass123')

      // Prüfe ob Passwort geändert wurde
      const user = await testPrisma.user.findUnique({
        where: { id: userId }
      })

      const isNewPasswordValid = await bcrypt.compare('NewSecurePass123', user!.passwordHash)
      expect(isNewPasswordValid).toBe(true)

      // Prüfe ob Reset Token gelöscht wurde
      const storedToken = await redis.get(`password_reset:${userId}`)
      expect(storedToken).toBeNull()
    })

    it('should reject invalid reset token', async () => {
      await expect(authService.resetPassword('invalid-token', 'newpassword')).rejects.toThrow(AuthenticationError)
    })

    it('should reject weak new password', async () => {
      const resetToken = jwt.sign(
        { userId, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      await redis.set(`password_reset:${userId}`, resetToken, 3600)

      await expect(authService.resetPassword(resetToken, '123')).rejects.toThrow(ValidationError)
    })
  })
})
