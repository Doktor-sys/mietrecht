"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = require("../config/config");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const EmailService_1 = require("./EmailService");
const errorHandler_1 = require("../middleware/errorHandler");
const TwoFactorAuthService_1 = require("./TwoFactorAuthService");
class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.emailService = new EmailService_1.EmailService();
        this.twoFactorService = new TwoFactorAuthService_1.TwoFactorAuthService(prisma);
    }
    /**
     * Registriert einen neuen Benutzer
     */
    async register(data) {
        try {
            // Validierung
            await this.validateRegistrationData(data);
            // Prüfe ob E-Mail bereits existiert
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existingUser) {
                throw new errorHandler_1.ConflictError('E-Mail-Adresse ist bereits registriert');
            }
            // Hash Passwort
            const passwordHash = await bcrypt_1.default.hash(data.password, config_1.config.security.bcryptRounds);
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
                            city: data.city,
                            language: data.language || 'de',
                        }
                    },
                    preferences: {
                        create: {
                            language: data.language || 'de',
                            notificationsEnabled: true,
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
                },
                include: {
                    profile: true,
                    preferences: true
                }
            });
            // Generiere Tokens
            const tokens = await this.generateTokens(user);
            // Sende Verifizierungs-E-Mail
            await this.sendVerificationEmail(user);
            // Log Registrierung
            logger_1.loggers.businessEvent('USER_REGISTERED', user.id, {
                userType: user.userType,
                email: user.email
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
                        city: user.profile.city || undefined,
                        language: user.profile.language ?? 'de'
                    } : undefined
                },
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Registrierung fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Meldet einen Benutzer an
     */
    async login(credentials, ip) {
        try {
            // Rate Limiting prüfen
            if (ip) {
                await this.checkRateLimit(ip);
            }
            // Benutzer finden
            const user = await this.prisma.user.findUnique({
                where: { email: credentials.email.toLowerCase() },
                include: {
                    profile: true,
                    preferences: true
                }
            });
            if (!user) {
                // Log fehlgeschlagenen Login-Versuch
                logger_1.loggers.securityEvent('LOGIN_FAILED', undefined, ip, {
                    reason: 'USER_NOT_FOUND',
                    email: credentials.email
                });
                throw new errorHandler_1.AuthenticationError('Ungültige Anmeldedaten');
            }
            // Prüfe ob Benutzer aktiv ist
            if (!user.isActive) {
                logger_1.loggers.securityEvent('LOGIN_FAILED', user.id, ip, {
                    reason: 'USER_INACTIVE'
                });
                throw new errorHandler_1.AuthenticationError('Benutzerkonto ist deaktiviert');
            }
            // Passwort prüfen
            const isPasswordValid = await bcrypt_1.default.compare(credentials.password, user.passwordHash);
            if (!isPasswordValid) {
                logger_1.loggers.securityEvent('LOGIN_FAILED', user.id, ip, {
                    reason: 'INVALID_PASSWORD'
                });
                throw new errorHandler_1.AuthenticationError('Ungültige Anmeldedaten');
            }
            // Update letzter Login
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });
            // Prüfe ob 2FA erforderlich ist
            const requires2FA = await this.twoFactorService.isTwoFactorEnabled(user.id);
            if (requires2FA) {
                // Bei aktivierter 2FA nur temporären Token zurückgeben
                // Der Client muss dann den 2FA Code eingeben
                const tempToken = jsonwebtoken_1.default.sign({
                    userId: user.id,
                    email: user.email,
                    userType: user.userType,
                    requires2FA: true,
                    tempAuth: true
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
                            city: user.profile.city || undefined,
                            language: user.profile.language ?? 'de'
                        } : undefined
                    },
                    tokens: {
                        accessToken: tempToken,
                        refreshToken: ''
                    },
                    requires2FA: true
                };
            }
            // Generiere Tokens
            const tokens = await this.generateTokens(user);
            // Log erfolgreichen Login
            logger_1.loggers.businessEvent('USER_LOGIN', user.id, {
                ip,
                userAgent: 'unknown' // Wird vom Controller gesetzt
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
                        city: user.profile.city || undefined,
                        language: user.profile.language ?? 'de'
                    } : undefined
                },
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Login fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Erneuert Access Token mit Refresh Token
     */
    async refreshToken(refreshToken) {
        try {
            // Verifiziere Refresh Token
            const payload = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwt.secret);
            if (payload.type !== 'refresh') {
                throw new errorHandler_1.AuthenticationError('Ungültiger Token-Typ');
            }
            // Prüfe ob Session noch gültig ist
            const session = await redis_1.redis.getSession(payload.sessionId);
            if (!session) {
                throw new errorHandler_1.AuthenticationError('Session abgelaufen');
            }
            // Benutzer laden
            const user = await this.prisma.user.findUnique({
                where: { id: payload.userId }
            });
            if (!user || !user.isActive) {
                throw new errorHandler_1.AuthenticationError('Benutzer nicht gefunden oder inaktiv');
            }
            // Neuen Access Token generieren
            const accessToken = this.generateAccessToken({
                userId: user.id,
                email: user.email,
                userType: user.userType,
                sessionId: payload.sessionId
            });
            return { accessToken };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errorHandler_1.AuthenticationError('Ungültiger Refresh Token');
            }
            throw error;
        }
    }
    /**
     * Meldet einen Benutzer ab
     */
    async logout(userId, sessionId) {
        try {
            if (sessionId) {
                // Lösche spezifische Session
                await redis_1.redis.deleteSession(sessionId);
            }
            else {
                // Lösche alle Sessions des Benutzers
                const sessions = await this.prisma.userSession.findMany({
                    where: { userId }
                });
                for (const session of sessions) {
                    await redis_1.redis.deleteSession(session.token);
                }
                // Lösche Session-Einträge aus der Datenbank
                await this.prisma.userSession.deleteMany({
                    where: { userId }
                });
            }
            logger_1.loggers.businessEvent('USER_LOGOUT', userId);
        }
        catch (error) {
            logger_1.logger.error('Logout fehlgeschlagen:', error);
            throw error;
        }
    }
    /**
     * Verifiziert einen Access Token
     */
    async verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            if (payload.type !== 'access') {
                throw new errorHandler_1.AuthenticationError('Ungültiger Token-Typ');
            }
            // Prüfe ob Session noch gültig ist
            const session = await redis_1.redis.getSession(payload.sessionId);
            if (!session) {
                throw new errorHandler_1.AuthenticationError('Session abgelaufen');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errorHandler_1.AuthenticationError('Ungültiger Access Token');
            }
            throw error;
        }
    }
    /**
     * Generiert Access und Refresh Tokens
     */
    async generateTokens(user) {
        const sessionId = this.generateSessionId();
        // Session in Redis speichern
        await redis_1.redis.setSession(sessionId, {
            userId: user.id,
            email: user.email,
            userType: user.userType,
            createdAt: new Date().toISOString()
        }, 7 * 24 * 60 * 60); // 7 Tage
        // Session in Datenbank speichern
        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                token: sessionId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
            }
        });
        const tokenData = {
            userId: user.id,
            email: user.email,
            userType: user.userType,
            sessionId
        };
        const accessToken = this.generateAccessToken(tokenData);
        const refreshToken = this.generateRefreshToken(tokenData);
        return { accessToken, refreshToken };
    }
    /**
     * Generiert Access Token
     */
    generateAccessToken(data) {
        return jsonwebtoken_1.default.sign({ ...data, type: 'access' }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
    }
    /**
     * Generiert Refresh Token
     */
    generateRefreshToken(data) {
        return jsonwebtoken_1.default.sign({ ...data, type: 'refresh' }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.refreshExpiresIn });
    }
    /**
     * Generiert eine eindeutige Session-ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Validiert Registrierungsdaten
     */
    async validateRegistrationData(data) {
        const errors = [];
        // E-Mail Validierung
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Ungültige E-Mail-Adresse');
        }
        // Passwort Validierung
        if (data.password.length < config_1.config.security.passwordMinLength) {
            errors.push(`Passwort muss mindestens ${config_1.config.security.passwordMinLength} Zeichen lang sein`);
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
            errors.push('Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten');
        }
        // Nutzungsbedingungen
        if (!data.acceptedTerms) {
            errors.push('Nutzungsbedingungen müssen akzeptiert werden');
        }
        // UserType Validierung
        if (!Object.values(client_1.UserType).includes(data.userType)) {
            errors.push('Ungültiger Benutzertyp');
        }
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(errors.join(', '));
        }
    }
    /**
     * Prüft Rate Limiting für Login-Versuche
     */
    async checkRateLimit(ip) {
        const key = `auth:rate_limit:${ip}`;
        const attempts = await redis_1.redis.incrementRateLimit(key, 15 * 60); // 15 Minuten
        if (attempts > config_1.config.rateLimit.authMax) {
            logger_1.loggers.securityEvent('RATE_LIMIT_EXCEEDED', undefined, ip, {
                attempts,
                limit: config_1.config.rateLimit.authMax
            });
            throw new errorHandler_1.AuthenticationError('Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.');
        }
    }
    /**
     * Passwort zurücksetzen (E-Mail senden)
     */
    async requestPasswordReset(email) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
                include: { profile: true }
            });
            if (!user) {
                // Aus Sicherheitsgründen keine Fehlermeldung, dass Benutzer nicht existiert
                logger_1.logger.info('Password reset requested for non-existent email', { email });
                return;
            }
            // Generiere Reset Token
            const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'password_reset' }, config_1.config.jwt.secret, { expiresIn: '1h' });
            // Speichere Reset Token in Redis (1 Stunde gültig)
            await redis_1.redis.set(`password_reset:${user.id}`, resetToken, 3600);
            // Sende Passwort-Reset-E-Mail
            await this.emailService.sendPasswordResetEmail(user.email, resetToken, {
                firstName: user.profile?.firstName || undefined,
                expiresIn: '1 Stunde',
                resetUrl: '' // Wird vom EmailService gesetzt
            });
            logger_1.loggers.businessEvent('PASSWORD_RESET_REQUESTED', user.id);
        }
        catch (error) {
            logger_1.logger.error('Password reset request failed:', error);
            throw error;
        }
    }
    /**
     * Passwort zurücksetzen (mit Token)
     */
    async resetPassword(token, newPassword) {
        try {
            // Verifiziere Reset Token
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            if (payload.type !== 'password_reset') {
                throw new errorHandler_1.AuthenticationError('Ungültiger Reset Token');
            }
            // Prüfe ob Token noch in Redis existiert
            const storedToken = await redis_1.redis.get(`password_reset:${payload.userId}`);
            if (!storedToken || storedToken !== token) {
                throw new errorHandler_1.AuthenticationError('Reset Token ist abgelaufen oder ungültig');
            }
            // Validiere neues Passwort
            if (newPassword.length < config_1.config.security.passwordMinLength) {
                throw new errorHandler_1.ValidationError(`Passwort muss mindestens ${config_1.config.security.passwordMinLength} Zeichen lang sein`);
            }
            // Hash neues Passwort
            const passwordHash = await bcrypt_1.default.hash(newPassword, config_1.config.security.bcryptRounds);
            // Update Passwort
            await this.prisma.user.update({
                where: { id: payload.userId },
                data: { passwordHash }
            });
            // Lösche Reset Token
            await redis_1.redis.del(`password_reset:${payload.userId}`);
            // Lösche alle Sessions des Benutzers (Sicherheit)
            await this.logout(payload.userId);
            logger_1.loggers.businessEvent('PASSWORD_RESET_COMPLETED', payload.userId);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errorHandler_1.AuthenticationError('Ungültiger Reset Token');
            }
            throw error;
        }
    }
    /**
     * Sendet Verifizierungs-E-Mail
     */
    async sendVerificationEmail(user) {
        try {
            // Generiere Verifizierungs-Token
            const verificationToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, type: 'email_verification' }, config_1.config.jwt.secret, { expiresIn: '24h' });
            // Speichere Token in Redis (24 Stunden gültig)
            await redis_1.redis.set(`email_verification:${user.id}`, verificationToken, 24 * 60 * 60);
            // Sende E-Mail
            await this.emailService.sendVerificationEmail(user.email, verificationToken, {
                firstName: user.profile?.firstName || undefined,
                expiresIn: '24 Stunden',
                verificationUrl: '' // Wird vom EmailService gesetzt
            });
            logger_1.loggers.businessEvent('EMAIL_VERIFICATION_SENT', user.id);
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Senden der Verifizierungs-E-Mail:', error);
            // Fehler nicht weiterwerfen, da Registrierung trotzdem erfolgreich sein soll
        }
    }
    /**
     * Verifiziert E-Mail-Adresse mit Token
     */
    async verifyEmailWithToken(token) {
        try {
            // Verifiziere Token
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            if (payload.type !== 'email_verification') {
                throw new errorHandler_1.AuthenticationError('Ungültiger Verifizierungs-Token');
            }
            // Prüfe ob Token noch in Redis existiert
            const storedToken = await redis_1.redis.get(`email_verification:${payload.userId}`);
            if (!storedToken || storedToken !== token) {
                throw new errorHandler_1.AuthenticationError('Verifizierungs-Token ist abgelaufen oder ungültig');
            }
            // Lade Benutzer
            const user = await this.prisma.user.findUnique({
                where: { id: payload.userId },
                include: { profile: true }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('Benutzer nicht gefunden');
            }
            if (user.isVerified) {
                throw new errorHandler_1.ValidationError('E-Mail-Adresse ist bereits verifiziert');
            }
            // Verifiziere Benutzer
            await this.prisma.user.update({
                where: { id: payload.userId },
                data: { isVerified: true }
            });
            // Lösche Verifizierungs-Token
            await redis_1.redis.del(`email_verification:${payload.userId}`);
            // Sende Willkommens-E-Mail
            await this.emailService.sendWelcomeEmail(user.email, {
                firstName: user.profile?.firstName || undefined,
                userType: user.userType,
                loginUrl: `${this.getBaseUrl()}/login`
            });
            logger_1.loggers.businessEvent('EMAIL_VERIFIED', payload.userId);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errorHandler_1.AuthenticationError('Ungültiger Verifizierungs-Token');
            }
            throw error;
        }
    }
    /**
     * Sendet Verifizierungs-E-Mail erneut
     */
    async resendVerificationEmail(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('Benutzer nicht gefunden');
            }
            if (user.isVerified) {
                throw new errorHandler_1.ValidationError('E-Mail-Adresse ist bereits verifiziert');
            }
            // Prüfe Rate Limiting
            const rateLimitKey = `resend_verification:${userId}`;
            const attempts = await redis_1.redis.get(rateLimitKey);
            if (attempts && parseInt(attempts) >= 3) {
                throw new errorHandler_1.ValidationError('Zu viele Verifizierungs-E-Mails gesendet. Bitte warten Sie 1 Stunde.');
            }
            // Erhöhe Zähler
            await redis_1.redis.set(rateLimitKey, (parseInt(attempts || '0') + 1).toString(), 3600);
            // Sende neue Verifizierungs-E-Mail
            await this.sendVerificationEmail(user);
        }
        catch (error) {
            logger_1.logger.error('Fehler beim erneuten Senden der Verifizierungs-E-Mail:', error);
            throw error;
        }
    }
    /**
     * Ändert E-Mail-Adresse (mit Verifizierung)
     */
    async changeEmail(userId, newEmail, password) {
        try {
            // Validiere neue E-Mail
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                throw new errorHandler_1.ValidationError('Ungültige E-Mail-Adresse');
            }
            // Lade aktuellen Benutzer
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('Benutzer nicht gefunden');
            }
            // Verifiziere Passwort
            const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new errorHandler_1.AuthenticationError('Ungültiges Passwort');
            }
            // Prüfe ob neue E-Mail bereits existiert
            const existingUser = await this.prisma.user.findUnique({
                where: { email: newEmail.toLowerCase() }
            });
            if (existingUser) {
                throw new errorHandler_1.ConflictError('E-Mail-Adresse ist bereits registriert');
            }
            // Generiere Bestätigungs-Token für neue E-Mail
            const changeToken = jsonwebtoken_1.default.sign({ userId, oldEmail: user.email, newEmail: newEmail.toLowerCase(), type: 'email_change' }, config_1.config.jwt.secret, { expiresIn: '1h' });
            // Speichere Token in Redis
            await redis_1.redis.set(`email_change:${userId}`, changeToken, 3600);
            // Sende Bestätigungs-E-Mail an neue Adresse
            await this.emailService.sendTemplatedEmail(newEmail.toLowerCase(), 'email-change-confirmation', {
                firstName: user.profile?.firstName,
                oldEmail: user.email,
                newEmail: newEmail.toLowerCase(),
                confirmationUrl: `${this.getBaseUrl()}/confirm-email-change?token=${changeToken}`,
                expiresIn: '1 Stunde'
            });
            logger_1.loggers.businessEvent('EMAIL_CHANGE_REQUESTED', userId, {
                oldEmail: user.email,
                newEmail: newEmail.toLowerCase()
            });
        }
        catch (error) {
            logger_1.logger.error('Fehler beim Ändern der E-Mail-Adresse:', error);
            throw error;
        }
    }
    /**
     * Bestätigt E-Mail-Änderung
     */
    async confirmEmailChange(token) {
        try {
            // Verifiziere Token
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            if (payload.type !== 'email_change') {
                throw new errorHandler_1.AuthenticationError('Ungültiger Bestätigungs-Token');
            }
            // Prüfe ob Token noch in Redis existiert
            const storedToken = await redis_1.redis.get(`email_change:${payload.userId}`);
            if (!storedToken || storedToken !== token) {
                throw new errorHandler_1.AuthenticationError('Bestätigungs-Token ist abgelaufen oder ungültig');
            }
            // Prüfe ob neue E-Mail noch verfügbar ist
            const existingUser = await this.prisma.user.findUnique({
                where: { email: payload.newEmail }
            });
            if (existingUser && existingUser.id !== payload.userId) {
                throw new errorHandler_1.ConflictError('E-Mail-Adresse ist bereits registriert');
            }
            // Aktualisiere E-Mail-Adresse
            await this.prisma.user.update({
                where: { id: payload.userId },
                data: {
                    email: payload.newEmail,
                    isVerified: true // E-Mail ist durch Bestätigung verifiziert
                }
            });
            // Lösche Token
            await redis_1.redis.del(`email_change:${payload.userId}`);
            // Lösche alle Sessions (Sicherheit)
            await this.logout(payload.userId);
            logger_1.loggers.businessEvent('EMAIL_CHANGED', payload.userId, {
                oldEmail: payload.oldEmail,
                newEmail: payload.newEmail
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errorHandler_1.AuthenticationError('Ungültiger Bestätigungs-Token');
            }
            throw error;
        }
    }
    /**
     * Hilfsmethoden
     */
    getUserTypeDisplayName(userType) {
        switch (userType) {
            case client_1.UserType.TENANT:
                return 'Mieter';
            case client_1.UserType.LANDLORD:
                return 'Vermieter';
            case client_1.UserType.BUSINESS:
                return 'Geschäftskunde';
            default:
                return 'Benutzer';
        }
    }
    getLoginUrl() {
        if (config_1.config.nodeEnv === 'production') {
            return 'https://smartlaw.de/login';
        }
        return 'http://localhost:3000/login';
    }
    getBaseUrl() {
        if (config_1.config.nodeEnv === 'production') {
            return 'https://smartlaw.de';
        }
        return 'http://localhost:3000';
    }
}
exports.AuthService = AuthService;
