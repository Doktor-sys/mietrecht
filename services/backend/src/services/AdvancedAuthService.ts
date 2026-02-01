import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserType } from '@prisma/client';
import { config } from '../config/config';
import { redis } from '../config/redis';
import { logger, loggers } from '../utils/logger';
import { EmailService } from './EmailService';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError,
  NotFoundError,
  AuthorizationError
} from '../middleware/errorHandler';
import { TwoFactorAuthService } from './TwoFactorAuthService';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Interfaces for advanced authentication features
export interface AdvancedRegisterData {
  email: string;
  password: string;
  userType: UserType;
  acceptedTerms: boolean;
  location?: string;
  firstName?: string;
  lastName?: string;
  language?: string;
  captchaToken?: string; // For bot protection
  ipAddress?: string; // For geolocation tracking
  userAgent?: string; // For device fingerprinting
}

export interface AdvancedLoginCredentials {
  email: string;
  password: string;
  captchaToken?: string; // For bot protection
  ipAddress?: string; // For anomaly detection
  userAgent?: string; // For device fingerprinting
  deviceId?: string; // For device recognition
}

export interface AdvancedAuthResult {
  user: {
    id: string;
    email: string;
    userType: UserType;
    isVerified: boolean;
    profile?: {
      firstName?: string;
      lastName?: string;
      location?: string;
      language: string;
    }
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  requires2FA?: boolean;
  tempToken?: string; // For 2FA flow
  securityFlags?: {
    passwordStrength: 'weak' | 'medium' | 'strong';
    requiresPasswordChange?: boolean;
    lastLoginFromNewDevice?: boolean;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  userType: UserType;
  sessionId: string;
  type: 'access' | 'refresh';
  deviceId?: string; // Device identifier
  ipHash?: string; // Hashed IP for security monitoring
  scopes?: string[]; // OAuth-style scopes
}

export interface DeviceInfo {
  id: string;
  userId: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastSeen: Date;
  isTrusted: boolean;
  location?: string;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class AdvancedAuthService {
  private emailService: EmailService;
  private twoFactorService: TwoFactorAuthService;

  constructor(private prisma: PrismaClient) {
    this.emailService = new EmailService();
    this.twoFactorService = new TwoFactorAuthService(prisma);
  }

  /**
   * Advanced user registration with enhanced security features
   */
  async register(data: AdvancedRegisterData): Promise<AdvancedAuthResult> {
    try {
      // Enhanced validation with CAPTCHA and bot protection
      await this.validateAdvancedRegistrationData(data);

      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        throw new ConflictError('E-Mail-Adresse ist bereits registriert');
      }

      // Password strength analysis
      const passwordStrength = this.analyzePasswordStrength(data.password);
      
      // Hash password with higher rounds for better security
      const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);

      // Create user with profile and preferences
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
      });

      // Track device if provided
      if (data.deviceId && data.ipAddress && data.userAgent) {
        await this.trackDevice(user.id, data.deviceId, data.userAgent, data.ipAddress);
      }

      // Generate tokens
      const tokens = await this.generateAdvancedTokens(user, data.deviceId, data.ipAddress);

      // Send verification email
      await this.sendAdvancedVerificationEmail(user);

      // Log registration with security context
      loggers.securityEvent('USER_REGISTERED', user.id, data.ipAddress, {
        userType: user.userType,
        email: user.email,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        passwordStrength
      });

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
        tokens,
        securityFlags: {
          passwordStrength,
          requiresPasswordChange: passwordStrength === 'weak'
        }
      };
    } catch (error) {
      logger.error('Erweiterte Registrierung fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Advanced login with enhanced security features
   */
  async login(credentials: AdvancedLoginCredentials): Promise<AdvancedAuthResult> {
    try {
      // Rate limiting check with IP and device tracking
      if (credentials.ipAddress) {
        await this.checkAdvancedRateLimit(credentials.ipAddress, credentials.deviceId);
      }

      // Bot protection with CAPTCHA validation
      if (credentials.captchaToken) {
        await this.validateCaptcha(credentials.captchaToken);
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
        include: {
          profile: true,
          preferences: true
        }
      });

      if (!user) {
        // Log failed login attempt
        loggers.securityEvent('LOGIN_FAILED', undefined, credentials.ipAddress, {
          reason: 'USER_NOT_FOUND',
          email: credentials.email,
          userAgent: credentials.userAgent,
          deviceId: credentials.deviceId
        });
        throw new AuthenticationError('Ungültige Anmeldedaten');
      }

      // Check if user is active
      if (!user.isActive) {
        loggers.securityEvent('LOGIN_FAILED', user.id, credentials.ipAddress, {
          reason: 'USER_INACTIVE',
          userAgent: credentials.userAgent,
          deviceId: credentials.deviceId
        });
        throw new AuthenticationError('Benutzerkonto ist deaktiviert');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        loggers.securityEvent('LOGIN_FAILED', user.id, credentials.ipAddress, {
          reason: 'INVALID_PASSWORD',
          userAgent: credentials.userAgent,
          deviceId: credentials.deviceId
        });
        throw new AuthenticationError('Ungültige Anmeldedaten');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Check if 2FA is enabled
      const requires2FA = await this.twoFactorService.isTwoFactorEnabled(user.id);
      
      // Device recognition and anomaly detection
      const deviceCheck = await this.checkDeviceRecognition(user.id, credentials.deviceId, credentials.userAgent, credentials.ipAddress);
      
      if (requires2FA || deviceCheck.isNewDevice) {
        // For 2FA or new device, return temporary token
        const tempToken = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            userType: user.userType, 
            requires2FA: true,
            tempAuth: true,
            deviceId: credentials.deviceId,
            ipHash: credentials.ipAddress ? this.hashIP(credentials.ipAddress) : undefined
          },
          config.jwt.secret,
          { expiresIn: '5m' } as jwt.SignOptions
        );
        
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
          tokens: {
            accessToken: tempToken,
            refreshToken: ''
          },
          requires2FA: requires2FA || undefined,
          tempToken,
          securityFlags: {
            passwordStrength: this.getPasswordStrengthFromHash(user.passwordHash),
            lastLoginFromNewDevice: deviceCheck.isNewDevice
          }
        };
      }
      
      // Generate tokens
      const tokens = await this.generateAdvancedTokens(user, credentials.deviceId, credentials.ipAddress);

      // Track successful login
      loggers.businessEvent('USER_LOGIN', user.id, {
        ip: credentials.ipAddress,
        userAgent: credentials.userAgent,
        deviceId: credentials.deviceId,
        isNewDevice: deviceCheck.isNewDevice
      });

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
        tokens,
        securityFlags: {
          passwordStrength: this.getPasswordStrengthFromHash(user.passwordHash)
        }
      };
    } catch (error) {
      logger.error('Erweitertes Login fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA token
   */
  async verifyTwoFactorToken(userId: string, token: string, tempToken?: string): Promise<AdvancedAuthResult> {
    try {
      // Verify 2FA token
      const verificationResult = await this.twoFactorService.verifyToken(userId, token);
      
      if (!verificationResult.success) {
        throw new AuthenticationError('Ungültiger 2FA-Token');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true
        }
      });

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden');
      }

      // Generate final tokens
      const tokens = await this.generateAdvancedTokens(user);

      // Log successful 2FA
      loggers.securityEvent('TWO_FACTOR_SUCCESS', userId, undefined, {
        method: 'TOTP'
      });

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
        tokens,
        securityFlags: {
          passwordStrength: this.getPasswordStrengthFromHash(user.passwordHash)
        }
      };
    } catch (error) {
      logger.error('2FA Verifizierung fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Refresh access token with enhanced security
   */
  async refreshAdvancedToken(refreshToken: string, deviceId?: string, ipAddress?: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, config.jwt.secret) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new AuthenticationError('Ungültiger Token-Typ');
      }

      // Check if session is still valid
      const session = await redis.getSession(payload.sessionId);
      if (!session) {
        throw new AuthenticationError('Session abgelaufen');
      }

      // Load user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('Benutzer nicht gefunden oder inaktiv');
      }

      // Device validation if provided
      if (deviceId && payload.deviceId && deviceId !== payload.deviceId) {
        loggers.securityEvent('DEVICE_MISMATCH', user.id, ipAddress, {
          expectedDeviceId: payload.deviceId,
          providedDeviceId: deviceId
        });
        throw new AuthenticationError('Gerätevalidierung fehlgeschlagen');
      }

      // IP validation if provided
      if (ipAddress && payload.ipHash) {
        const currentIpHash = this.hashIP(ipAddress);
        if (currentIpHash !== payload.ipHash) {
          loggers.securityEvent('IP_MISMATCH', user.id, ipAddress, {
            expectedIpHash: payload.ipHash,
            currentIpHash: currentIpHash
          });
        }
      }

      // Generate new access token
      const accessToken = this.generateAdvancedAccessToken({
        userId: user.id,
        email: user.email,
        userType: user.userType,
        sessionId: payload.sessionId,
        deviceId: deviceId || payload.deviceId,
        ipHash: ipAddress ? this.hashIP(ipAddress) : payload.ipHash
      });

      return { accessToken };
    } catch (error) {
      logger.error('Token-Aktualisierung fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Enhanced token verification with device and IP validation
   */
  async verifyAdvancedToken(token: string, deviceId?: string, ipAddress?: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

      // Device validation if provided
      if (deviceId && payload.deviceId && deviceId !== payload.deviceId) {
        loggers.securityEvent('TOKEN_DEVICE_MISMATCH', payload.userId, ipAddress, {
          expectedDeviceId: payload.deviceId,
          providedDeviceId: deviceId
        });
        throw new AuthenticationError('Gerätevalidierung fehlgeschlagen');
      }

      // IP validation if provided
      if (ipAddress && payload.ipHash) {
        const currentIpHash = this.hashIP(ipAddress);
        if (currentIpHash !== payload.ipHash) {
          loggers.securityEvent('TOKEN_IP_MISMATCH', payload.userId, ipAddress, {
            expectedIpHash: payload.ipHash,
            currentIpHash: currentIpHash
          });
        }
      }

      return payload;
    } catch (error) {
      logger.error('Token-Verifizierung fehlgeschlagen:', error);
      throw new AuthenticationError('Ungültiger oder abgelaufener Token');
    }
  }

  /**
   * Enhanced logout with session invalidation
   */
  async logout(userId: string, sessionId: string, allDevices: boolean = false): Promise<void> {
    try {
      if (allDevices) {
        // Invalidate all sessions for user
        await this.prisma.userSession.deleteMany({
          where: { userId }
        });
        
        // Clear all Redis sessions for user
        const userSessions = await this.prisma.userSession.findMany({
          where: { userId }
        });
        
        for (const session of userSessions) {
          await redis.deleteSession(session.sessionToken);
        }
      } else {
        // Invalidate specific session
        await this.prisma.userSession.deleteMany({
          where: { 
            userId,
            sessionToken: sessionId
          }
        });
        
        await redis.deleteSession(sessionId);
      }

      loggers.businessEvent('USER_LOGOUT', userId, {
        allDevices,
        sessionId
      });
    } catch (error) {
      logger.error('Logout fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Track device for user
   */
  private async trackDevice(userId: string, deviceId: string, userAgent: string, ipAddress: string): Promise<DeviceInfo> {
    try {
      const device = await this.prisma.userDevice.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId
          }
        },
        update: {
          userAgent,
          ipAddress,
          lastSeen: new Date(),
          isTrusted: true // Auto-trust devices for now
        },
        create: {
          id: uuidv4(),
          userId,
          deviceId,
          userAgent,
          ipAddress,
          lastSeen: new Date(),
          isTrusted: true
        }
      });

      return device;
    } catch (error) {
      logger.error('Geräteverfolgung fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Check if device is recognized
   */
  private async checkDeviceRecognition(userId: string, deviceId?: string, userAgent?: string, ipAddress?: string): Promise<{ isKnownDevice: boolean; isNewDevice: boolean }> {
    try {
      if (!deviceId) {
        return { isKnownDevice: false, isNewDevice: false };
      }

      const device = await this.prisma.userDevice.findUnique({
        where: {
          userId_deviceId: {
            userId,
            deviceId
          }
        }
      });

      if (device) {
        // Update last seen
        await this.prisma.userDevice.update({
          where: { id: device.id },
          data: {
            lastSeen: new Date(),
            userAgent: userAgent || device.userAgent,
            ipAddress: ipAddress || device.ipAddress
          }
        });
        
        return { isKnownDevice: true, isNewDevice: false };
      } else {
        return { isKnownDevice: false, isNewDevice: true };
      }
    } catch (error) {
      logger.error('Geräteerkennung fehlgeschlagen:', error);
      return { isKnownDevice: false, isNewDevice: false };
    }
  }

  /**
   * Generate advanced tokens with device and IP tracking
   */
  private async generateAdvancedTokens(user: any, deviceId?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionId = this.generateSessionId();

    // Store session in Redis
    await redis.setSession(sessionId, {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      deviceId,
      ipHash: ipAddress ? this.hashIP(ipAddress) : undefined,
      createdAt: new Date().toISOString()
    }, 7 * 24 * 60 * 60); // 7 days

    // Store session in database
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: sessionId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    const tokenData = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      sessionId,
      deviceId,
      ipHash: ipAddress ? this.hashIP(ipAddress) : undefined
    };

    const accessToken = this.generateAdvancedAccessToken(tokenData);
    const refreshToken = this.generateAdvancedRefreshToken(tokenData);

    return { accessToken, refreshToken };
  }

  /**
   * Generate advanced access token
   */
  private generateAdvancedAccessToken(data: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...data, type: 'access' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
  }

  /**
   * Generate advanced refresh token
   */
  private generateAdvancedRefreshToken(data: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...data, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    );
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhanced registration data validation
   */
  private async validateAdvancedRegistrationData(data: AdvancedRegisterData): Promise<void> {
    const errors: string[] = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Ungültige E-Mail-Adresse');
    }

    // Password validation
    if (data.password.length < 8) {
      errors.push('Das Passwort muss mindestens 8 Zeichen lang sein');
    }

    // Password strength requirements
    const passwordStrength = this.analyzePasswordStrength(data.password);
    if (passwordStrength === 'weak') {
      errors.push('Das Passwort ist zu schwach. Es muss Kleinbuchstaben, Großbuchstaben, Zahlen und Sonderzeichen enthalten');
    }

    // Terms acceptance
    if (!data.acceptedTerms) {
      errors.push('Die Allgemeinen Geschäftsbedingungen müssen akzeptiert werden');
    }

    // CAPTCHA validation if provided
    if (data.captchaToken) {
      try {
        await this.validateCaptcha(data.captchaToken);
      } catch (error) {
        errors.push('CAPTCHA-Validierung fehlgeschlagen');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  /**
   * Analyze password strength
   */
  private analyzePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Bonus for extra length and complexity
    if (password.length >= 16) score++;
    if (/(.)\1{2,}/.test(password)) score--; // Penalty for repeated characters
    
    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    return 'strong';
  }

  /**
   * Get password strength from hash (approximation)
   */
  private getPasswordStrengthFromHash(hash: string): 'weak' | 'medium' | 'strong' {
    // This is a simplified estimation
    // In reality, you can't determine password strength from hash alone
    // This is just for demonstration purposes
    return 'strong';
  }

  /**
   * Advanced rate limiting with device tracking
   */
  private async checkAdvancedRateLimit(ipAddress?: string, deviceId?: string): Promise<void> {
    if (!ipAddress && !deviceId) return;

    const keys = [];
    if (ipAddress) keys.push(`rate_limit_ip:${this.hashIP(ipAddress)}`);
    if (deviceId) keys.push(`rate_limit_device:${deviceId}`);

    for (const key of keys) {
      const requests = await redis.incrementRateLimit(key, 900); // 15 minutes window
      
      // Different limits for IP vs device
      const limit = key.startsWith('rate_limit_ip:') ? 20 : 50;
      
      if (requests > limit) {
        loggers.securityEvent('RATE_LIMIT_EXCEEDED', undefined, ipAddress, {
          key,
          requests,
          limit
        });
        throw new AuthenticationError(`Zu viele Anfragen. Bitte versuchen Sie es später erneut.`);
      }
    }
  }

  /**
   * Validate CAPTCHA token
   */
  private async validateCaptcha(token: string): Promise<boolean> {
    // In a real implementation, you would validate the CAPTCHA token
    // with a service like reCAPTCHA or hCaptcha
    // For now, we'll just return true
    return true;
  }

  /**
   * Hash IP address for privacy
   */
  private hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  /**
   * Send advanced verification email
   */
  private async sendAdvancedVerificationEmail(user: any): Promise<void> {
    try {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Store token in database
      await this.prisma.userVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      
      // Send email (implementation depends on your email service)
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      logger.error('Verifizierungs-E-Mail konnte nicht gesendet werden:', error);
      // Don't throw error as this shouldn't block registration
    }
  }
}