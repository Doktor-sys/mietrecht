"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedAuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const EmailService_1 = require("./EmailService");
const errorHandler_1 = require("../middleware/errorHandler");
const TwoFactorAuthService_1 = require("./TwoFactorAuthService");
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
class AdvancedAuthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.emailService = new EmailService_1.EmailService();
        this.twoFactorService = new TwoFactorAuthService_1.TwoFactorAuthService(prisma);
    }
    /**
     * Advanced user registration with enhanced security features
     */
    async register(data) {
        try {
            // Enhanced validation with CAPTCHA and bot protection
            await this.validateAdvancedRegistrationData(data);
            // Check if email already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existingUser) {
                throw new errorHandler_1.ConflictError('E-Mail-Adresse ist bereits registriert');
            }
            // Password strength analysis
            const passwordStrength = this.analyzePasswordStrength(data.password);
            // Hash password with higher rounds for better security
            const passwordHash = await bcrypt_1.default.hash(data.password, config_1.config.security.bcryptRounds);
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
            logger_1.loggers.securityEvent('USER_REGISTERED', user.id, data.ipAddress, {
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
        }
        catch (error) {
            logger_1.logger.error('Erweiterte Registrierung fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Advanced login with enhanced security features
     */
    async login(credentials) {
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
                logger_1.loggers.securityEvent('LOGIN_FAILED', undefined, credentials.ipAddress, {
                    reason: 'USER_NOT_FOUND',
                    email: credentials.email,
                    userAgent: credentials.userAgent,
                    deviceId: credentials.deviceId
                });
                throw new errorHandler_1.AuthenticationError('Ungültige Anmeldedaten');
            }
            // Check if user is active
            if (!user.isActive) {
                logger_1.loggers.securityEvent('LOGIN_FAILED', user.id, credentials.ipAddress, {
                    reason: 'USER_INACTIVE',
                    userAgent: credentials.userAgent,
                    deviceId: credentials.deviceId
                });
                throw new errorHandler_1.AuthenticationError('Benutzerkonto ist deaktiviert');
            }
            // Check password
            const isPasswordValid = await bcrypt_1.default.compare(credentials.password, user.passwordHash);
            if (!isPasswordValid) {
                logger_1.loggers.securityEvent('LOGIN_FAILED', user.id, credentials.ipAddress, {
                    reason: 'INVALID_PASSWORD',
                    userAgent: credentials.userAgent,
                    deviceId: credentials.deviceId
                });
                throw new errorHandler_1.AuthenticationError('Ungültige Anmeldedaten');
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
                const tempToken = jsonwebtoken_1.default.sign({
                    userId: user.id,
                    email: user.email,
                    userType: user.userType,
                    requires2FA: true,
                    tempAuth: true,
                    deviceId: credentials.deviceId,
                    ipHash: credentials.ipAddress ? this.hashIP(credentials.ipAddress) : undefined
                }, config_1.config.jwt.secret, { expiresIn: '5m' });
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
            logger_1.loggers.businessEvent('USER_LOGIN', user.id, {
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
        }
        catch (error) {
            logger_1.logger.error('Erweitertes Login fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Verify 2FA token
     */
    async verifyTwoFactorToken(userId, token, tempToken) {
        try {
            // Verify 2FA token
            const verificationResult = await this.twoFactorService.verifyToken(userId, token);
            if (!verificationResult.success) {
                throw new errorHandler_1.AuthenticationError('Ungültiger 2FA-Token');
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
                throw new errorHandler_1.NotFoundError('Benutzer nicht gefunden');
            }
            // Generate final tokens
            const tokens = await this.generateAdvancedTokens(user);
            // Log successful 2FA
            logger_1.loggers.securityEvent('TWO_FACTOR_SUCCESS', userId, undefined, {
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
        }
        catch (error) {
            logger_1.logger.error('2FA Verifizierung fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Refresh access token with enhanced security
     */
    async refreshAdvancedToken(refreshToken, deviceId, ipAddress) {
        try {
            // Verify refresh token
            const payload = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwt.secret);
            if (payload.type !== 'refresh') {
                throw new errorHandler_1.AuthenticationError('Ungültiger Token-Typ');
            }
            // Check if session is still valid
            const session = await redis_1.redis.getSession(payload.sessionId);
            if (!session) {
                throw new errorHandler_1.AuthenticationError('Session abgelaufen');
            }
            // Load user
            const user = await this.prisma.user.findUnique({
                where: { id: payload.userId }
            });
            if (!user || !user.isActive) {
                throw new errorHandler_1.AuthenticationError('Benutzer nicht gefunden oder inaktiv');
            }
            // Device validation if provided
            if (deviceId && payload.deviceId && deviceId !== payload.deviceId) {
                logger_1.loggers.securityEvent('DEVICE_MISMATCH', user.id, ipAddress, {
                    expectedDeviceId: payload.deviceId,
                    providedDeviceId: deviceId
                });
                throw new errorHandler_1.AuthenticationError('Gerätevalidierung fehlgeschlagen');
            }
            // IP validation if provided
            if (ipAddress && payload.ipHash) {
                const currentIpHash = this.hashIP(ipAddress);
                if (currentIpHash !== payload.ipHash) {
                    logger_1.loggers.securityEvent('IP_MISMATCH', user.id, ipAddress, {
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
        }
        catch (error) {
            logger_1.logger.error('Token-Aktualisierung fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Enhanced token verification with device and IP validation
     */
    async verifyAdvancedToken(token, deviceId, ipAddress) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            // Device validation if provided
            if (deviceId && payload.deviceId && deviceId !== payload.deviceId) {
                logger_1.loggers.securityEvent('TOKEN_DEVICE_MISMATCH', payload.userId, ipAddress, {
                    expectedDeviceId: payload.deviceId,
                    providedDeviceId: deviceId
                });
                throw new errorHandler_1.AuthenticationError('Gerätevalidierung fehlgeschlagen');
            }
            // IP validation if provided
            if (ipAddress && payload.ipHash) {
                const currentIpHash = this.hashIP(ipAddress);
                if (currentIpHash !== payload.ipHash) {
                    logger_1.loggers.securityEvent('TOKEN_IP_MISMATCH', payload.userId, ipAddress, {
                        expectedIpHash: payload.ipHash,
                        currentIpHash: currentIpHash
                    });
                }
            }
            return payload;
        }
        catch (error) {
            logger_1.logger.error('Token-Verifizierung fehlgeschlagen:', error);
            throw new errorHandler_1.AuthenticationError('Ungültiger oder abgelaufener Token');
        }
    }
    /**
     * Enhanced logout with session invalidation
     */
    async logout(userId, sessionId, allDevices = false) {
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
                    await redis_1.redis.deleteSession(session.sessionToken);
                }
            }
            else {
                // Invalidate specific session
                await this.prisma.userSession.deleteMany({
                    where: {
                        userId,
                        sessionToken: sessionId
                    }
                });
                await redis_1.redis.deleteSession(sessionId);
            }
            logger_1.loggers.businessEvent('USER_LOGOUT', userId, {
                allDevices,
                sessionId
            });
        }
        catch (error) {
            logger_1.logger.error('Logout fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Track device for user
     */
    async trackDevice(userId, deviceId, userAgent, ipAddress) {
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
                    id: (0, uuid_1.v4)(),
                    userId,
                    deviceId,
                    userAgent,
                    ipAddress,
                    lastSeen: new Date(),
                    isTrusted: true
                }
            });
            return device;
        }
        catch (error) {
            logger_1.logger.error('Geräteverfolgung fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Check if device is recognized
     */
    async checkDeviceRecognition(userId, deviceId, userAgent, ipAddress) {
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
            }
            else {
                return { isKnownDevice: false, isNewDevice: true };
            }
        }
        catch (error) {
            logger_1.logger.error('Geräteerkennung fehlgeschlagen:', error);
            return { isKnownDevice: false, isNewDevice: false };
        }
    }
    /**
     * Generate advanced tokens with device and IP tracking
     */
    async generateAdvancedTokens(user, deviceId, ipAddress) {
        const sessionId = this.generateSessionId();
        // Store session in Redis
        await redis_1.redis.setSession(sessionId, {
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
    generateAdvancedAccessToken(data) {
        return jsonwebtoken_1.default.sign({ ...data, type: 'access' }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
    }
    /**
     * Generate advanced refresh token
     */
    generateAdvancedRefreshToken(data) {
        return jsonwebtoken_1.default.sign({ ...data, type: 'refresh' }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.refreshExpiresIn });
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Enhanced registration data validation
     */
    async validateAdvancedRegistrationData(data) {
        const errors = [];
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
            }
            catch (error) {
                errors.push('CAPTCHA-Validierung fehlgeschlagen');
            }
        }
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(errors.join(', '));
        }
    }
    /**
     * Analyze password strength
     */
    analyzePasswordStrength(password) {
        let score = 0;
        // Length check
        if (password.length >= 8)
            score++;
        if (password.length >= 12)
            score++;
        // Character variety
        if (/[a-z]/.test(password))
            score++;
        if (/[A-Z]/.test(password))
            score++;
        if (/[0-9]/.test(password))
            score++;
        if (/[^A-Za-z0-9]/.test(password))
            score++;
        // Bonus for extra length and complexity
        if (password.length >= 16)
            score++;
        if (/(.)\1{2,}/.test(password))
            score--; // Penalty for repeated characters
        if (score <= 3)
            return 'weak';
        if (score <= 5)
            return 'medium';
        return 'strong';
    }
    /**
     * Get password strength from hash (approximation)
     */
    getPasswordStrengthFromHash(hash) {
        // This is a simplified estimation
        // In reality, you can't determine password strength from hash alone
        // This is just for demonstration purposes
        return 'strong';
    }
    /**
     * Advanced rate limiting with device tracking
     */
    async checkAdvancedRateLimit(ipAddress, deviceId) {
        if (!ipAddress && !deviceId)
            return;
        const keys = [];
        if (ipAddress)
            keys.push(`rate_limit_ip:${this.hashIP(ipAddress)}`);
        if (deviceId)
            keys.push(`rate_limit_device:${deviceId}`);
        for (const key of keys) {
            const requests = await redis_1.redis.incrementRateLimit(key, 900); // 15 minutes window
            // Different limits for IP vs device
            const limit = key.startsWith('rate_limit_ip:') ? 20 : 50;
            if (requests > limit) {
                logger_1.loggers.securityEvent('RATE_LIMIT_EXCEEDED', undefined, ipAddress, {
                    key,
                    requests,
                    limit
                });
                throw new errorHandler_1.AuthenticationError(`Zu viele Anfragen. Bitte versuchen Sie es später erneut.`);
            }
        }
    }
    /**
     * Validate CAPTCHA token
     */
    async validateCaptcha(token) {
        // In a real implementation, you would validate the CAPTCHA token
        // with a service like reCAPTCHA or hCaptcha
        // For now, we'll just return true
        return true;
    }
    /**
     * Hash IP address for privacy
     */
    hashIP(ip) {
        return crypto_1.default.createHash('sha256').update(ip).digest('hex');
    }
    /**
     * Send advanced verification email
     */
    async sendAdvancedVerificationEmail(user) {
        try {
            // Generate verification token
            const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
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
        }
        catch (error) {
            logger_1.logger.error('Verifizierungs-E-Mail konnte nicht gesendet werden:', error);
            // Don't throw error as this shouldn't block registration
        }
    }
}
exports.AdvancedAuthService = AdvancedAuthService;
