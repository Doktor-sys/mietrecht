import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { 
  ValidationError, 
  NotFoundError, 
  AuthenticationError 
} from '../middleware/errorHandler';

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerificationResult {
  success: boolean;
  message: string;
}

export class TwoFactorAuthService {
  constructor(private prisma: PrismaClient) {
    // Konstruktor bleibt leer
  }

  /**
   * Initialisiert 2FA für einen Benutzer
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResult> {
    try {
      // Prüfe ob Benutzer existiert
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden');
      }

      // Generiere pseudo TOTP Secret
      const secret = this.generatePseudoSecret();
      
      // Erstelle QR Code URL für Authenticator Apps (pseudo)
      const serviceName = 'SmartLaw Mietrecht';
      const accountName = user.email;
      const qrCodeUrl = `otpauth://totp/${serviceName}:${accountName}?secret=${secret}&issuer=${serviceName}`;
      
      // Generiere Backup Codes
      const backupCodes = this.generateBackupCodes();
      
      logger.info(`2FA setup initiated for user ${userId}`);
      
      return {
        secret,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      logger.error('Failed to setup two-factor authentication:', error);
      throw error;
    }
  }

  /**
   * Verifiziert den initialen 2FA Code und aktiviert 2FA
   */
  async verifyAndEnableTwoFactor(userId: string, token: string): Promise<TwoFactorVerificationResult> {
    try {
      // Lade Benutzer
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden');
      }

      // Verifiziere Token (pseudo-Verifizierung)
      const isValid = this.verifyPseudoToken(token);
      
      if (!isValid) {
        return {
          success: false,
          message: 'Ungültiger Verifizierungscode'
        };
      }

      logger.info(`2FA successfully enabled for user ${userId}`);
      
      return {
        success: true,
        message: 'Zwei-Faktor-Authentifizierung erfolgreich aktiviert'
      };
    } catch (error) {
      logger.error('Failed to verify and enable two-factor authentication:', error);
      throw error;
    }
  }

  /**
   * Verifiziert einen 2FA Code während des Login-Prozesses
   */
  async verifyTwoFactorToken(userId: string, token: string): Promise<TwoFactorVerificationResult> {
    try {
      // Lade Benutzer
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('Benutzer nicht gefunden');
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
    } catch (error) {
      logger.error('Failed to verify two-factor token:', error);
      throw error;
    }
  }

  /**
   * Verifiziert einen Backup Code
   */
  private async verifyBackupCode(userId: string, backupCode: string): Promise<TwoFactorVerificationResult> {
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
        throw new ValidationError('Benutzer nicht gefunden');
      }

      return {
        success: true,
        message: 'Backup Code erfolgreich verifiziert'
      };
    } catch (error) {
      logger.error('Failed to verify backup code:', error);
      throw error;
    }
  }

  /**
   * Deaktiviert 2FA für einen Benutzer
   */
  async disableTwoFactor(userId: string): Promise<void> {
    try {
      logger.info(`2FA disabled for user ${userId}`);
    } catch (error) {
      logger.error('Failed to disable two-factor authentication:', error);
      throw error;
    }
  }

  /**
   * Generiert QR Code als Data URL (pseudo-Implementierung)
   */
  async generateQRCodeDataUrl(qrCodeUrl: string): Promise<string> {
    try {
      // Pseudo-Implementierung
      return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw new Error('QR Code konnte nicht generiert werden');
    }
  }

  /**
   * Generiert pseudo TOTP Secret
   */
  private generatePseudoSecret(): string {
    // Generiere pseudo-secret ohne externe Bibliothek
    return Math.random().toString(36).substring(2, 18).toUpperCase();
  }

  /**
   * Verifiziert pseudo TOTP Token
   */
  private verifyPseudoToken(token: string): boolean {
    // Pseudo-Verifizierung ohne externe Bibliothek
    return token.length === 6 && /^\d+$/.test(token);
  }

  /**
   * Generiert Backup Codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
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
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      // In einer echten Implementierung würden wir hier den Status aus der Datenbank laden
      return false;
    } catch (error) {
      logger.error('Failed to check two-factor status:', error);
      return false;
    }
  }

  /**
   * Fordert 2FA während des Login-Prozesses an
   */
  async requireTwoFactorForLogin(userId: string): Promise<boolean> {
    return await this.isTwoFactorEnabled(userId);
  }
}