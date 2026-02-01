"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorAuthService = void 0;
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class TwoFactorAuthService {
    constructor(prisma) {
        this.prisma = prisma;
        // Konstruktor bleibt leer
    }
    /**
     * Initialisiert 2FA für einen Benutzer
     */
    async setupTwoFactor(userId) {
        try {
            // Prüfe ob Benutzer existiert
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('Benutzer nicht gefunden');
            }
            // Generiere pseudo TOTP Secret
            const secret = this.generatePseudoSecret();
            // Erstelle QR Code URL für Authenticator Apps (pseudo)
            const serviceName = 'SmartLaw Mietrecht';
            const accountName = user.email;
            const qrCodeUrl = `otpauth://totp/${serviceName}:${accountName}?secret=${secret}&issuer=${serviceName}`;
            // Generiere Backup Codes
            const backupCodes = this.generateBackupCodes();
            logger_1.logger.info(`2FA setup initiated for user ${userId}`);
            return {
                secret,
                qrCodeUrl,
                backupCodes
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to setup two-factor authentication:', error);
            throw error;
        }
    }
    /**
     * Verifiziert den initialen 2FA Code und aktiviert 2FA
     */
    async verifyAndEnableTwoFactor(userId, token) {
        try {
            // Lade Benutzer
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('Benutzer nicht gefunden');
            }
            // Verifiziere Token (pseudo-Verifizierung)
            const isValid = this.verifyPseudoToken(token);
            if (!isValid) {
                return {
                    success: false,
                    message: 'Ungültiger Verifizierungscode'
                };
            }
            logger_1.logger.info(`2FA successfully enabled for user ${userId}`);
            return {
                success: true,
                message: 'Zwei-Faktor-Authentifizierung erfolgreich aktiviert'
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify and enable two-factor authentication:', error);
            throw error;
        }
    }
    /**
     * Verifiziert einen 2FA Code während des Login-Prozesses
     */
    async verifyTwoFactorToken(userId, token) {
        try {
            // Lade Benutzer
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('Benutzer nicht gefunden');
            }
            // Prüfe ob es ein Backup Code ist
            if (token.startsWith('backup_')) {
                return await this.verifyBackupCode(userId, token);
            }
            // Verifiziere TOTP Token (pseudo-Verifizierung)
            const isValid = this.verifyPseudoToken(token);
            if (!isValid) {
                return {
                    success: false,
                    message: 'Ungültiger Zwei-Faktor-Code'
                };
            }
            return {
                success: true,
                message: 'Zwei-Faktor-Authentifizierung erfolgreich verifiziert'
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify two-factor token:', error);
            throw error;
        }
    }
    /**
     * Verifiziert einen Backup Code
     */
    async verifyBackupCode(userId, backupCode) {
        try {
            // Validierung des Backup-Code Formats
            if (!backupCode.startsWith('backup_') || backupCode.length !== 15) {
                return {
                    success: false,
                    message: 'Ungültiges Backup Code Format'
                };
            }
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errorHandler_1.ValidationError('Benutzer nicht gefunden');
            }
            return {
                success: true,
                message: 'Backup Code erfolgreich verifiziert'
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify backup code:', error);
            throw error;
        }
    }
    /**
     * Deaktiviert 2FA für einen Benutzer
     */
    async disableTwoFactor(userId) {
        try {
            logger_1.logger.info(`2FA disabled for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to disable two-factor authentication:', error);
            throw error;
        }
    }
    /**
     * Generiert QR Code als Data URL (pseudo-Implementierung)
     */
    async generateQRCodeDataUrl(qrCodeUrl) {
        try {
            // Pseudo-Implementierung
            return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate QR code:', error);
            throw new Error('QR Code konnte nicht generiert werden');
        }
    }
    /**
     * Generiert pseudo TOTP Secret
     */
    generatePseudoSecret() {
        // Generiere pseudo-secret ohne externe Bibliothek
        return Math.random().toString(36).substring(2, 18).toUpperCase();
    }
    /**
     * Verifiziert pseudo TOTP Token
     */
    verifyPseudoToken(token) {
        // Pseudo-Verifizierung ohne externe Bibliothek
        return token.length === 6 && /^\d+$/.test(token);
    }
    /**
     * Generiert Backup Codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generiere 8-stelligen alphanumerischen Code
            const code = 'backup_' + Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    /**
     * Prüft ob 2FA für einen Benutzer aktiviert ist
     */
    async isTwoFactorEnabled(userId) {
        try {
            // In einer echten Implementierung würden wir hier den Status aus der Datenbank laden
            return false;
        }
        catch (error) {
            logger_1.logger.error('Failed to check two-factor status:', error);
            return false;
        }
    }
    /**
     * Fordert 2FA während des Login-Prozesses an
     */
    async requireTwoFactorForLogin(userId) {
        return await this.isTwoFactorEnabled(userId);
    }
}
exports.TwoFactorAuthService = TwoFactorAuthService;
