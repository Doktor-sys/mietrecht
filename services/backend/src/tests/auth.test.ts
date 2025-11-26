import request from 'supertest'
import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import app from '../index'
import { config } from '../config/config'
import { redis } from '../config/redis'

// Test-spezifische Prisma-Instanz
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/smartlaw_test',
    },
  },
})

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await testPrisma.$connect()
    await redis.connect()
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

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePass123',
      userType: 'TENANT',
      acceptedTerms: true,
      firstName: 'Max',
      lastName: 'Mustermann',
      location: 'Berlin'
    }

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(validRegistrationData.email)
      expect(response.body.data.user.userType).toBe(validRegistrationData.userType)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()

      // Prüfe ob Benutzer in Datenbank erstellt wurde
      const user = await testPrisma.user.findUnique({
        where: { email: validRegistrationData.email },
        include: { profile: true, preferences: true }
      })

      expect(user).toBeTruthy()
      expect(user?.profile?.firstName).toBe(validRegistrationData.firstName)
      expect(user?.preferences?.language).toBe('de')
    })

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          password: '123'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject registration without accepted terms', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          acceptedTerms: false
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject duplicate email registration', async () => {
      // Erste Registrierung
      await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201)

      // Zweite Registrierung mit derselben E-Mail
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('CONFLICT_ERROR')
    })
  })

  describe('POST /api/auth/login', () => {
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

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()

      // Prüfe ob lastLoginAt aktualisiert wurde
      const user = await testPrisma.user.findUnique({
        where: { email: userData.email }
      })
      expect(user?.lastLoginAt).toBeTruthy()
    })

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should reject login for inactive user', async () => {
      // Deaktiviere Benutzer
      await testPrisma.user.update({
        where: { email: userData.email },
        data: { isActive: false }
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string
    let userId: string

    beforeEach(async () => {
      // Erstelle Benutzer und generiere Tokens
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

      // Simuliere Login um Refresh Token zu erhalten
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'password123'
        })

      refreshToken = loginResponse.body.data.tokens.refreshToken
    })

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()

      // Prüfe ob neuer Token gültig ist
      const payload = jwt.verify(response.body.data.accessToken, config.jwt.secret) as any
      expect(payload.userId).toBe(userId)
      expect(payload.type).toBe('access')
    })

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should reject expired refresh token', async () => {
      // Erstelle abgelaufenen Token
      const expiredToken = jwt.sign(
        { userId, type: 'refresh', sessionId: 'test' },
        config.jwt.secret,
        { expiresIn: '-1h' }
      )

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('POST /api/auth/logout', () => {
    let accessToken: string
    let userId: string

    beforeEach(async () => {
      // Login um Token zu erhalten
      const passwordHash = await bcrypt.hash('password123', 12)
      const user = await testPrisma.user.create({
        data: {
          email: 'logout@example.com',
          passwordHash,
          userType: UserType.TENANT,
          isVerified: true
        }
      })

      userId = user.id

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'password123'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Erfolgreich abgemeldet')

      // Prüfe ob Sessions gelöscht wurden
      const sessions = await testPrisma.userSession.findMany({
        where: { userId }
      })
      expect(sessions).toHaveLength(0)
    })

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('GET /api/auth/me', () => {
    let accessToken: string
    let user: any

    beforeEach(async () => {
      // Erstelle und logge Benutzer ein
      const passwordHash = await bcrypt.hash('password123', 12)
      user = await testPrisma.user.create({
        data: {
          email: 'me@example.com',
          passwordHash,
          userType: UserType.TENANT,
          isVerified: true,
          profile: {
            create: {
              firstName: 'Test',
              lastName: 'User',
              location: 'Berlin',
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

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should return current user information', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(user.id)
      expect(response.body.data.email).toBe(user.email)
      expect(response.body.data.profile.firstName).toBe('Test')
      expect(response.body.data.preferences.language).toBe('de')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('Password Reset', () => {
    beforeEach(async () => {
      // Erstelle Test-Benutzer
      const passwordHash = await bcrypt.hash('oldpassword123', 12)
      await testPrisma.user.create({
        data: {
          email: 'reset@example.com',
          passwordHash,
          userType: UserType.TENANT,
          isVerified: true
        }
      })
    })

    it('should request password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Reset-E-Mail gesendet')
    })

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Reset-E-Mail gesendet')
    })

    it('should reset password with valid token', async () => {
      // Fordere Reset an
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@example.com' })

      // Simuliere gültigen Reset Token
      const user = await testPrisma.user.findUnique({
        where: { email: 'reset@example.com' }
      })

      const resetToken = jwt.sign(
        { userId: user?.id, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      // Speichere Token in Redis
      await redis.set(`password_reset:${user?.id}`, resetToken, 3600)

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewSecurePass123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Passwort erfolgreich zurückgesetzt')

      // Prüfe ob Passwort geändert wurde
      const updatedUser = await testPrisma.user.findUnique({
        where: { email: 'reset@example.com' }
      })

      const isNewPasswordValid = await bcrypt.compare('NewSecurePass123', updatedUser!.passwordHash)
      expect(isNewPasswordValid).toBe(true)
    })
  })

  describe('Token Verification', () => {
    let accessToken: string

    beforeEach(async () => {
      // Login um Token zu erhalten
      const passwordHash = await bcrypt.hash('password123', 12)
      await testPrisma.user.create({
        data: {
          email: 'verify@example.com',
          passwordHash,
          userType: UserType.TENANT,
          isVerified: true
        }
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'verify@example.com',
          password: 'password123'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should verify valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.valid).toBe(true)
      expect(response.body.data.userId).toBeDefined()
      expect(response.body.data.userType).toBe('TENANT')
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })
  })
})