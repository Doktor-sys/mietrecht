import request from 'supertest'
import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import app from '../index'
import { config } from '../config/config'
import { redis } from '../config/redis'

// Mock EmailService
jest.mock('../services/EmailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendTemplatedEmail: jest.fn().mockResolvedValue(undefined),
    verifyConnection: jest.fn().mockResolvedValue(true),
  })),
}))

// Test-spezifische Prisma-Instanz
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/smartlaw_test',
    },
  },
})

describe('Email Authentication API Tests', () => {
  let testUserId: string
  let accessToken: string

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

    // Erstelle Test-Benutzer
    const passwordHash = await bcrypt.hash('password123', 12)
    const user = await testPrisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash,
        userType: UserType.TENANT,
        isVerified: false, // Nicht verifiziert für Tests
        profile: {
          create: {
            firstName: 'Max',
            lastName: 'Mustermann',
            language: 'de'
          }
        }
      }
    })

    testUserId = user.id

    // Generiere Access Token
    const sessionId = 'test_session'
    await redis.setSession(sessionId, { userId: testUserId })

    accessToken = jwt.sign(
      { userId: testUserId, email: user.email, userType: UserType.TENANT, sessionId, type: 'access' },
      config.jwt.secret,
      { expiresIn: '1h' }
    )
  })

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Erstelle Verifizierungs-Token
      const verificationToken = jwt.sign(
        { userId: testUserId, email: 'test@example.com', type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      )

      // Speichere Token in Redis
      await redis.set(`email_verification:${testUserId}`, verificationToken, 24 * 60 * 60)

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('verifiziert')

      // Prüfe ob Benutzer verifiziert wurde
      const user = await testPrisma.user.findUnique({
        where: { id: testUserId }
      })
      expect(user?.isVerified).toBe(true)
    })

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should reject expired verification token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUserId, type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '-1h' }
      )

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: expiredToken })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should reject token not in Redis', async () => {
      const validToken = jwt.sign(
        { userId: testUserId, type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      )

      // Token nicht in Redis speichern

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: validToken })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should reject verification for already verified user', async () => {
      // Verifiziere Benutzer zuerst
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isVerified: true }
      })

      const verificationToken = jwt.sign(
        { userId: testUserId, type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      )

      await redis.set(`email_verification:${testUserId}`, verificationToken, 24 * 60 * 60)

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('gesendet')
    })

    it('should reject resend for verified user', async () => {
      // Verifiziere Benutzer
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isVerified: true }
      })

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should enforce rate limiting', async () => {
      // Simuliere 3 vorherige Versuche
      await redis.set(`resend_verification:${testUserId}`, '3', 3600)

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Zu viele')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/change-email', () => {
    beforeEach(async () => {
      // Verifiziere Benutzer für E-Mail-Änderung
      await testPrisma.user.update({
        where: { id: testUserId },
        data: { isVerified: true }
      })
    })

    it('should initiate email change', async () => {
      const response = await request(app)
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newEmail: 'newemail@example.com',
          password: 'password123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Bestätigungs-E-Mail')
    })

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newEmail: 'newemail@example.com',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newEmail: 'invalid-email',
          password: 'password123'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject existing email', async () => {
      // Erstelle anderen Benutzer mit der gewünschten E-Mail
      const passwordHash = await bcrypt.hash('password123', 12)
      await testPrisma.user.create({
        data: {
          email: 'existing@example.com',
          passwordHash,
          userType: UserType.TENANT,
          isVerified: true
        }
      })

      const response = await request(app)
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newEmail: 'existing@example.com',
          password: 'password123'
        })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('CONFLICT_ERROR')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-email')
        .send({
          newEmail: 'newemail@example.com',
          password: 'password123'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/confirm-email-change', () => {
    it('should confirm email change with valid token', async () => {
      const newEmail = 'newemail@example.com'
      const changeToken = jwt.sign(
        { 
          userId: testUserId, 
          oldEmail: 'test@example.com', 
          newEmail, 
          type: 'email_change' 
        },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      // Speichere Token in Redis
      await redis.set(`email_change:${testUserId}`, changeToken, 3600)

      const response = await request(app)
        .post('/api/auth/confirm-email-change')
        .send({ token: changeToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('geändert')

      // Prüfe ob E-Mail geändert wurde
      const user = await testPrisma.user.findUnique({
        where: { id: testUserId }
      })
      expect(user?.email).toBe(newEmail)
      expect(user?.isVerified).toBe(true)
    })

    it('should reject invalid change token', async () => {
      const response = await request(app)
        .post('/api/auth/confirm-email-change')
        .send({ token: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should reject expired change token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUserId, type: 'email_change' },
        config.jwt.secret,
        { expiresIn: '-1h' }
      )

      const response = await request(app)
        .post('/api/auth/confirm-email-change')
        .send({ token: expiredToken })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should reject token not in Redis', async () => {
      const validToken = jwt.sign(
        { userId: testUserId, type: 'email_change', newEmail: 'new@example.com' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      // Token nicht in Redis speichern

      const response = await request(app)
        .post('/api/auth/confirm-email-change')
        .send({ token: validToken })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should handle email conflict during confirmation', async () => {
      const newEmail = 'conflict@example.com'
      
      // Erstelle anderen Benutzer mit der gewünschten E-Mail
      const passwordHash = await bcrypt.hash('password123', 12)
      await testPrisma.user.create({
        data: {
          email: newEmail,
          passwordHash,
          userType: UserType.TENANT,
          isVerified: true
        }
      })

      const changeToken = jwt.sign(
        { 
          userId: testUserId, 
          oldEmail: 'test@example.com', 
          newEmail, 
          type: 'email_change' 
        },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      await redis.set(`email_change:${testUserId}`, changeToken, 3600)

      const response = await request(app)
        .post('/api/auth/confirm-email-change')
        .send({ token: changeToken })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('CONFLICT_ERROR')
    })
  })

  describe('Registration with email verification', () => {
    it('should send verification email on registration', async () => {
      const registrationData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        userType: 'TENANT',
        acceptedTerms: true,
        firstName: 'New',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.isVerified).toBe(false)

      // Prüfe ob Benutzer erstellt wurde
      const user = await testPrisma.user.findUnique({
        where: { email: registrationData.email }
      })
      expect(user).toBeTruthy()
      expect(user?.isVerified).toBe(false)
    })
  })

  describe('Password reset with email', () => {
    it('should send password reset email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Reset-E-Mail gesendet')
    })

    it('should not reveal non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Reset-E-Mail gesendet')
    })
  })
})