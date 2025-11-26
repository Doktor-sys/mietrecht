import { EmailService } from '../services/EmailService'
import { config } from '../config/config'

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  })),
}))

describe('EmailService Unit Tests', () => {
  let emailService: EmailService

  beforeEach(() => {
    emailService = new EmailService()
  })

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com'
      const token = 'verification-token'
      const userData = {
        firstName: 'Max',
        verificationUrl: 'http://localhost:3000/verify?token=verification-token',
        expiresIn: '24 Stunden'
      }

      await expect(
        emailService.sendVerificationEmail(email, token, userData)
      ).resolves.not.toThrow()
    })

    it('should handle missing firstName gracefully', async () => {
      const email = 'test@example.com'
      const token = 'verification-token'
      const userData = {
        verificationUrl: 'http://localhost:3000/verify?token=verification-token',
        expiresIn: '24 Stunden'
      }

      await expect(
        emailService.sendVerificationEmail(email, token, userData)
      ).resolves.not.toThrow()
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com'
      const token = 'reset-token'
      const userData = {
        firstName: 'Max',
        resetUrl: 'http://localhost:3000/reset?token=reset-token',
        expiresIn: '1 Stunde'
      }

      await expect(
        emailService.sendPasswordResetEmail(email, token, userData)
      ).resolves.not.toThrow()
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'test@example.com'
      const userData = {
        firstName: 'Max',
        userType: 'Mieter',
        loginUrl: 'http://localhost:3000/login'
      }

      await expect(
        emailService.sendWelcomeEmail(email, userData)
      ).resolves.not.toThrow()
    })
  })

  describe('sendTemplatedEmail', () => {
    it('should send templated email successfully', async () => {
      const email = 'test@example.com'
      const templateName = 'verification'
      const templateData = {
        firstName: 'Max',
        verificationUrl: 'http://localhost:3000/verify',
        expiresIn: '24 Stunden',
        baseUrl: 'http://localhost:3000',
        supportEmail: 'support@smartlaw.de'
      }

      await expect(
        emailService.sendTemplatedEmail(email, templateName, templateData)
      ).resolves.not.toThrow()
    })

    it('should throw error for non-existent template', async () => {
      const email = 'test@example.com'
      const templateName = 'non-existent'
      const templateData = {}

      await expect(
        emailService.sendTemplatedEmail(email, templateName, templateData)
      ).rejects.toThrow("Template 'non-existent' nicht gefunden")
    })
  })

  describe('sendEmail', () => {
    it('should send simple email successfully', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text'
      }

      await expect(
        emailService.sendEmail(options)
      ).resolves.not.toThrow()
    })
  })

  describe('verifyConnection', () => {
    it('should verify email connection successfully', async () => {
      const result = await emailService.verifyConnection()
      expect(result).toBe(true)
    })

    it('should handle connection failure', async () => {
      // Mock a failed connection
      const mockTransporter = {
        verify: jest.fn().mockRejectedValue(new Error('Connection failed')),
        sendMail: jest.fn()
      }

      // Replace the transporter
      ;(emailService as any).transporter = mockTransporter

      const result = await emailService.verifyConnection()
      expect(result).toBe(false)
    })
  })

  describe('template rendering', () => {
    it('should render template with data correctly', () => {
      const template = 'Hello {{firstName}}, your email is {{email}}'
      const data = {
        firstName: 'Max',
        email: 'max@example.com'
      }

      const rendered = (emailService as any).renderTemplate(template, data)
      expect(rendered).toBe('Hello Max, your email is max@example.com')
    })

    it('should handle conditional templates', () => {
      const template = 'Hello{{#firstName}}, {{firstName}}{{/firstName}}!'
      
      const dataWithName = { firstName: 'Max' }
      const renderedWithName = (emailService as any).renderTemplate(template, dataWithName)
      expect(renderedWithName).toBe('Hello, Max!')

      const dataWithoutName = {}
      const renderedWithoutName = (emailService as any).renderTemplate(template, dataWithoutName)
      expect(renderedWithoutName).toBe('Hello!')
    })

    it('should remove unused placeholders', () => {
      const template = 'Hello {{firstName}}, your {{unusedField}} is ready'
      const data = { firstName: 'Max' }

      const rendered = (emailService as any).renderTemplate(template, data)
      expect(rendered).toBe('Hello Max, your  is ready')
    })
  })

  describe('email masking', () => {
    it('should mask email addresses correctly', () => {
      const maskEmail = (emailService as any).maskEmail.bind(emailService)

      expect(maskEmail('test@example.com')).toBe('te***@example.com')
      expect(maskEmail('a@example.com')).toBe('a***@example.com')
      expect(maskEmail('ab@example.com')).toBe('ab***@example.com')
      expect(maskEmail('verylongemail@example.com')).toBe('ve***@example.com')
    })
  })

  describe('rate limiting', () => {
    it('should enforce email rate limiting', async () => {
      const email = 'ratelimit@example.com'
      
      // Mock Redis to simulate rate limit exceeded
      const mockRedis = {
        incrementRateLimit: jest.fn().mockResolvedValue(6) // Over limit of 5
      }

      // Replace redis instance
      const originalRedis = require('../config/redis').redis
      require('../config/redis').redis = mockRedis

      await expect(
        (emailService as any).checkEmailRateLimit(email)
      ).rejects.toThrow('E-Mail-Rate-Limit überschritten')

      // Restore original redis
      require('../config/redis').redis = originalRedis
    })

    it('should allow emails within rate limit', async () => {
      const email = 'allowed@example.com'
      
      // Mock Redis to simulate within limit
      const mockRedis = {
        incrementRateLimit: jest.fn().mockResolvedValue(3) // Within limit of 5
      }

      // Replace redis instance
      const originalRedis = require('../config/redis').redis
      require('../config/redis').redis = mockRedis

      await expect(
        (emailService as any).checkEmailRateLimit(email)
      ).resolves.not.toThrow()

      // Restore original redis
      require('../config/redis').redis = originalRedis
    })
  })

  describe('URL generation', () => {
    it('should generate correct URLs for development', () => {
      const originalEnv = config.nodeEnv
      ;(config as any).nodeEnv = 'development'

      const baseUrl = (emailService as any).getBaseUrl()
      expect(baseUrl).toBe('http://localhost:3000')

      ;(config as any).nodeEnv = originalEnv
    })

    it('should generate correct URLs for production', () => {
      const originalEnv = config.nodeEnv
      ;(config as any).nodeEnv = 'production'

      const baseUrl = (emailService as any).getBaseUrl()
      expect(baseUrl).toBe('https://smartlaw.de')

      ;(config as any).nodeEnv = originalEnv
    })
  })
})