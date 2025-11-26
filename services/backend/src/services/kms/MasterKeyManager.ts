import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { KeyManagementError, KeyManagementErrorCode } from '../../types/kms';

/**
 * Master Key Manager
 * 
 * Verwaltet den Master Key für Envelope Encryption.
 * Der Master Key wird verwendet, um alle Data Encryption Keys (DEKs) zu verschlüsseln.
 */
export class MasterKeyManager {
  private masterKey: Buffer | null = null;
  private readonly keyLength = 32; // 256 bits

  /**
   * Initialisiert den Master Key Manager
   */
  constructor() {
    this.loadMasterKey();
  }

  /**
   * Lädt den Master Key aus der Umgebungsvariable
   */
  private loadMasterKey(): void {
    try {
      const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;

      if (!masterKeyHex) {
        throw new KeyManagementError(
          'Master encryption key not found in environment variables',
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }

      // Validiere Hex-Format
      if (!/^[0-9a-fA-F]+$/.test(masterKeyHex)) {
        throw new KeyManagementError(
          'Master encryption key must be in hexadecimal format',
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }

      // Validiere Länge (256 bits = 64 hex characters)
      if (masterKeyHex.length !== this.keyLength * 2) {
        throw new KeyManagementError(
          `Master encryption key must be ${this.keyLength * 2} hexadecimal characters (${this.keyLength} bytes)`,
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }

      this.masterKey = Buffer.from(masterKeyHex, 'hex');
      logger.info('Master key loaded successfully');
    } catch (error) {
      if (error instanceof KeyManagementError) {
        throw error;
      }
      logger.error('Failed to load master key:', error);
      throw new KeyManagementError(
        'Failed to load master encryption key',
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
  }

  /**
   * Gibt den Master Key zurück
   */
  getMasterKey(): Buffer {
    if (!this.masterKey) {
      throw new KeyManagementError(
        'Master key not initialized',
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
    return this.masterKey;
  }

  /**
   * Validiert, ob der Master Key korrekt geladen wurde
   */
  validateMasterKey(): boolean {
    try {
      if (!this.masterKey) {
        return false;
      }

      // Prüfe ob der Key die richtige Länge hat
      if (this.masterKey.length !== this.keyLength) {
        return false;
      }

      // Prüfe ob der Key nicht nur Nullen enthält
      const isAllZeros = this.masterKey.every(byte => byte === 0);
      if (isAllZeros) {
        logger.warn('Master key contains only zeros - this is insecure');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Master key validation failed:', error);
      return false;
    }
  }

  /**
   * Rotiert den Master Key
   * WICHTIG: Diese Methode sollte nur mit äußerster Vorsicht verwendet werden
   * und erfordert Re-Encryption aller DEKs
   */
  async rotateMasterKey(newMasterKeyHex: string): Promise<void> {
    try {
      // Validiere neuen Master Key
      if (!/^[0-9a-fA-F]+$/.test(newMasterKeyHex)) {
        throw new KeyManagementError(
          'New master key must be in hexadecimal format',
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }

      if (newMasterKeyHex.length !== this.keyLength * 2) {
        throw new KeyManagementError(
          `New master key must be ${this.keyLength * 2} hexadecimal characters`,
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }

      const newMasterKey = Buffer.from(newMasterKeyHex, 'hex');

      // Prüfe ob neuer Key unterschiedlich ist
      if (this.masterKey && this.masterKey.equals(newMasterKey)) {
        throw new KeyManagementError(
          'New master key must be different from current master key',
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }

      // Speichere alten Key für Re-Encryption
      const oldMasterKey = this.masterKey;

      // Setze neuen Master Key
      this.masterKey = newMasterKey;

      logger.info('Master key rotated successfully');

      // Hinweis: Die Re-Encryption aller DEKs muss vom KeyManagementService durchgeführt werden
    } catch (error) {
      if (error instanceof KeyManagementError) {
        throw error;
      }
      logger.error('Master key rotation failed:', error);
      throw new KeyManagementError(
        'Failed to rotate master key',
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
  }

  /**
   * Generiert einen neuen Master Key
   * WARNUNG: Nur für Entwicklung/Testing verwenden!
   */
  static generateMasterKey(): string {
    const key = crypto.randomBytes(32);
    return key.toString('hex');
  }

  /**
   * Gibt Informationen über den Master Key zurück (ohne den Key selbst preiszugeben)
   */
  getMasterKeyInfo(): { length: number; algorithm: string; isValid: boolean } {
    return {
      length: this.keyLength,
      algorithm: 'aes-256-gcm',
      isValid: this.validateMasterKey()
    };
  }
}
