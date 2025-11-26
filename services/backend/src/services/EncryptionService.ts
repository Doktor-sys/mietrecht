import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export interface DecryptionOptions {
  encryptedData: string;
  iv: string;
  authTag: string;
  key?: string;
}

export interface KeyDerivationOptions {
  password: string;
  salt: string;
  iterations?: number;
  keyLength?: number;
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits
  private readonly defaultIterations = 100000; // PBKDF2 iterations

  /**
   * Generiert einen sicheren Verschlüsselungsschlüssel
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Generiert einen sicheren Salt für Key Derivation
   */
  generateSalt(): string {
    return crypto.randomBytes(this.saltLength).toString('hex');
  }

  /**
   * Leitet einen Schlüssel aus einem Passwort ab (PBKDF2)
   */
  deriveKey(options: KeyDerivationOptions): string {
    try {
      const {
        password,
        salt,
        iterations = this.defaultIterations,
        keyLength = this.keyLength
      } = options;

      const derivedKey = crypto.pbkdf2Sync(
        password,
        Buffer.from(salt, 'hex'),
        iterations,
        keyLength,
        'sha512'
      );

      return derivedKey.toString('hex');
    } catch (error) {
      logger.error('Error deriving key:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  /**
   * Verschlüsselt Daten mit AES-256-GCM
   */
  encrypt(data: string, key?: string): EncryptionResult {
    try {
      // Verwende bereitgestellten Schlüssel oder generiere neuen
      const encryptionKey = key ? Buffer.from(key, 'hex') : crypto.randomBytes(this.keyLength);
      
      // Generiere zufälligen IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Erstelle Cipher
      const cipher = crypto.createCipher(this.algorithm, encryptionKey);
      cipher.setAAD(Buffer.from('smartlaw-encryption', 'utf8')); // Additional Authenticated Data
      
      // Verschlüssele Daten
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Hole Authentication Tag
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Entschlüsselt Daten mit AES-256-GCM
   */
  decrypt(options: DecryptionOptions, key: string): string {
    try {
      const { encryptedData, iv, authTag } = options;
      
      // Konvertiere Hex-Strings zu Buffers
      const encryptionKey = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');
      
      // Erstelle Decipher
      const decipher = crypto.createDecipher(this.algorithm, encryptionKey);
      decipher.setAAD(Buffer.from('smartlaw-encryption', 'utf8'));
      decipher.setAuthTag(authTagBuffer);
      
      // Entschlüssele Daten
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data - data may be corrupted or key is invalid');
    }
  }

  /**
   * Verschlüsselt ein JSON-Objekt
   */
  encryptObject(obj: any, key?: string): EncryptionResult {
    try {
      const jsonString = JSON.stringify(obj);
      return this.encrypt(jsonString, key);
    } catch (error) {
      logger.error('Error encrypting object:', error);
      throw new Error('Failed to encrypt object');
    }
  }

  /**
   * Entschlüsselt ein JSON-Objekt
   */
  decryptObject<T = any>(options: DecryptionOptions, key: string): T {
    try {
      const decryptedString = this.decrypt(options, key);
      return JSON.parse(decryptedString) as T;
    } catch (error) {
      logger.error('Error decrypting object:', error);
      throw new Error('Failed to decrypt object');
    }
  }

  /**
   * Verschlüsselt eine Datei (Buffer)
   */
  encryptFile(fileBuffer: Buffer, key?: string): EncryptionResult {
    try {
      const base64Data = fileBuffer.toString('base64');
      return this.encrypt(base64Data, key);
    } catch (error) {
      logger.error('Error encrypting file:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Entschlüsselt eine Datei (Buffer)
   */
  decryptFile(options: DecryptionOptions, key: string): Buffer {
    try {
      const decryptedBase64 = this.decrypt(options, key);
      return Buffer.from(decryptedBase64, 'base64');
    } catch (error) {
      logger.error('Error decrypting file:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  /**
   * Erstellt einen Hash von Daten (für Integritätsprüfung)
   */
  createHash(data: string, algorithm: string = 'sha256'): string {
    try {
      return crypto.createHash(algorithm).update(data, 'utf8').digest('hex');
    } catch (error) {
      logger.error('Error creating hash:', error);
      throw new Error('Failed to create hash');
    }
  }

  /**
   * Verifiziert einen Hash
   */
  verifyHash(data: string, expectedHash: string, algorithm: string = 'sha256'): boolean {
    try {
      const actualHash = this.createHash(data, algorithm);
      return crypto.timingSafeEqual(
        Buffer.from(actualHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying hash:', error);
      return false;
    }
  }

  /**
   * Generiert einen sicheren Token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Erstellt einen HMAC für Message Authentication
   */
  createHMAC(data: string, key: string, algorithm: string = 'sha256'): string {
    try {
      return crypto.createHmac(algorithm, key).update(data, 'utf8').digest('hex');
    } catch (error) {
      logger.error('Error creating HMAC:', error);
      throw new Error('Failed to create HMAC');
    }
  }

  /**
   * Verifiziert einen HMAC
   */
  verifyHMAC(data: string, expectedHmac: string, key: string, algorithm: string = 'sha256'): boolean {
    try {
      const actualHmac = this.createHMAC(data, key, algorithm);
      return crypto.timingSafeEqual(
        Buffer.from(actualHmac, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying HMAC:', error);
      return false;
    }
  }

  /**
   * Verschlüsselt sensitive Felder in einem Objekt
   */
  encryptSensitiveFields(
    obj: Record<string, any>, 
    sensitiveFields: string[], 
    key: string
  ): Record<string, any> {
    try {
      const result = { ...obj };
      
      for (const field of sensitiveFields) {
        if (result[field] !== undefined && result[field] !== null) {
          const fieldValue = typeof result[field] === 'string' 
            ? result[field] 
            : JSON.stringify(result[field]);
          
          const encrypted = this.encrypt(fieldValue, key);
          result[`${field}_encrypted`] = encrypted;
          delete result[field]; // Entferne Klartext
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error encrypting sensitive fields:', error);
      throw new Error('Failed to encrypt sensitive fields');
    }
  }

  /**
   * Entschlüsselt sensitive Felder in einem Objekt
   */
  decryptSensitiveFields(
    obj: Record<string, any>, 
    sensitiveFields: string[], 
    key: string
  ): Record<string, any> {
    try {
      const result = { ...obj };
      
      for (const field of sensitiveFields) {
        const encryptedField = `${field}_encrypted`;
        
        if (result[encryptedField]) {
          try {
            const decrypted = this.decrypt(result[encryptedField], key);
            
            // Versuche JSON zu parsen, falls es ein Objekt war
            try {
              result[field] = JSON.parse(decrypted);
            } catch {
              result[field] = decrypted; // Bleibt String
            }
            
            delete result[encryptedField]; // Entferne verschlüsselte Version
          } catch (decryptError) {
            logger.warn(`Failed to decrypt field ${field}:`, decryptError);
            // Feld bleibt verschlüsselt
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error decrypting sensitive fields:', error);
      throw new Error('Failed to decrypt sensitive fields');
    }
  }

  /**
   * Rotiert Verschlüsselungsschlüssel (re-encrypt mit neuem Schlüssel)
   */
  rotateKey(
    encryptedData: EncryptionResult, 
    oldKey: string, 
    newKey: string
  ): EncryptionResult {
    try {
      // Entschlüssele mit altem Schlüssel
      const decrypted = this.decrypt(encryptedData, oldKey);
      
      // Verschlüssele mit neuem Schlüssel
      return this.encrypt(decrypted, newKey);
    } catch (error) {
      logger.error('Error rotating encryption key:', error);
      throw new Error('Failed to rotate encryption key');
    }
  }

  /**
   * Validiert Verschlüsselungsparameter
   */
  validateEncryptionParams(params: any): boolean {
    try {
      const { encryptedData, iv, authTag } = params;
      
      // Prüfe ob alle erforderlichen Felder vorhanden sind
      if (!encryptedData || !iv || !authTag) {
        return false;
      }
      
      // Prüfe Hex-Format und Längen
      const hexRegex = /^[0-9a-fA-F]+$/;
      
      if (!hexRegex.test(iv) || iv.length !== this.ivLength * 2) {
        return false;
      }
      
      if (!hexRegex.test(authTag) || authTag.length !== this.tagLength * 2) {
        return false;
      }
      
      if (!hexRegex.test(encryptedData)) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating encryption params:', error);
      return false;
    }
  }
}

// ============================================
// KMS Integration
// ============================================

import type { KeyManagementService } from './kms/KeyManagementService';
import { KeyPurpose, EncryptionResultWithKeyRef } from '../types/kms';

/**
 * Erweiterte EncryptionService-Klasse mit KMS-Integration
 */
export class EncryptionServiceWithKMS extends EncryptionService {
  private kms?: KeyManagementService;

  /**
   * Setzt die KMS-Instanz für erweiterte Funktionen
   */
  setKMS(kms: KeyManagementService): void {
    this.kms = kms;
    logger.info('KMS integration enabled for EncryptionService');
  }

  /**
   * Verschlüsselt Daten mit KMS-verwalteten Schlüsseln
   */
  async encryptWithKMS(
    data: string,
    tenantId: string,
    purpose: KeyPurpose,
    serviceId?: string
  ): Promise<EncryptionResultWithKeyRef> {
    if (!this.kms) {
      throw new Error('KMS not initialized - call setKMS() first');
    }

    try {
      // Hole aktuellen Schlüssel für Purpose
      const keyMetadata = await this.kms.getKeyForPurpose(tenantId, purpose);
      const key = await this.kms.getKey(keyMetadata.id, tenantId, serviceId);

      // Verschlüssele mit EncryptionService
      const encrypted = this.encrypt(data, key);

      return {
        ...encrypted,
        keyId: keyMetadata.id,
        keyVersion: keyMetadata.version
      };
    } catch (error) {
      logger.error('Failed to encrypt with KMS:', error);
      throw new Error('Encryption with KMS failed');
    }
  }

  /**
   * Entschlüsselt Daten mit KMS-verwalteten Schlüsseln
   */
  async decryptWithKMS(
    encrypted: EncryptionResultWithKeyRef,
    tenantId: string,
    serviceId?: string
  ): Promise<string> {
    if (!this.kms) {
      throw new Error('KMS not initialized - call setKMS() first');
    }

    try {
      // Hole Schlüssel vom KMS
      const key = await this.kms.getKey(encrypted.keyId, tenantId, serviceId);

      // Entschlüssele mit EncryptionService
      return this.decrypt(encrypted, key);
    } catch (error) {
      logger.error('Failed to decrypt with KMS:', error);
      throw new Error('Decryption with KMS failed');
    }
  }

  /**
   * Verschlüsselt ein Objekt mit KMS
   */
  async encryptObjectWithKMS<T = any>(
    obj: T,
    tenantId: string,
    purpose: KeyPurpose,
    serviceId?: string
  ): Promise<EncryptionResultWithKeyRef> {
    const jsonString = JSON.stringify(obj);
    return this.encryptWithKMS(jsonString, tenantId, purpose, serviceId);
  }

  /**
   * Entschlüsselt ein Objekt mit KMS
   */
  async decryptObjectWithKMS<T = any>(
    encrypted: EncryptionResultWithKeyRef,
    tenantId: string,
    serviceId?: string
  ): Promise<T> {
    const decryptedString = await this.decryptWithKMS(encrypted, tenantId, serviceId);
    return JSON.parse(decryptedString) as T;
  }

  /**
   * Verschlüsselt eine Datei mit KMS
   */
  async encryptFileWithKMS(
    fileBuffer: Buffer,
    tenantId: string,
    purpose: KeyPurpose,
    serviceId?: string
  ): Promise<EncryptionResultWithKeyRef> {
    const base64Data = fileBuffer.toString('base64');
    return this.encryptWithKMS(base64Data, tenantId, purpose, serviceId);
  }

  /**
   * Entschlüsselt eine Datei mit KMS
   */
  async decryptFileWithKMS(
    encrypted: EncryptionResultWithKeyRef,
    tenantId: string,
    serviceId?: string
  ): Promise<Buffer> {
    const decryptedBase64 = await this.decryptWithKMS(encrypted, tenantId, serviceId);
    return Buffer.from(decryptedBase64, 'base64');
  }

  /**
   * Verschlüsselt sensitive Felder mit KMS
   */
  async encryptSensitiveFieldsWithKMS(
    obj: Record<string, any>,
    sensitiveFields: string[],
    tenantId: string,
    purpose: KeyPurpose,
    serviceId?: string
  ): Promise<Record<string, any>> {
    if (!this.kms) {
      throw new Error('KMS not initialized');
    }

    try {
      const result = { ...obj };
      const keyMetadata = await this.kms.getKeyForPurpose(tenantId, purpose);
      const key = await this.kms.getKey(keyMetadata.id, tenantId, serviceId);

      for (const field of sensitiveFields) {
        if (result[field] !== undefined && result[field] !== null) {
          const fieldValue = typeof result[field] === 'string'
            ? result[field]
            : JSON.stringify(result[field]);

          const encrypted = this.encrypt(fieldValue, key);
          result[`${field}_encrypted`] = {
            ...encrypted,
            keyId: keyMetadata.id,
            keyVersion: keyMetadata.version
          };
          delete result[field];
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to encrypt sensitive fields with KMS:', error);
      throw new Error('Failed to encrypt sensitive fields');
    }
  }

  /**
   * Entschlüsselt sensitive Felder mit KMS
   */
  async decryptSensitiveFieldsWithKMS(
    obj: Record<string, any>,
    sensitiveFields: string[],
    tenantId: string,
    serviceId?: string
  ): Promise<Record<string, any>> {
    if (!this.kms) {
      throw new Error('KMS not initialized');
    }

    try {
      const result = { ...obj };

      for (const field of sensitiveFields) {
        const encryptedField = `${field}_encrypted`;

        if (result[encryptedField]) {
          try {
            const encryptedData = result[encryptedField];
            const key = await this.kms.getKey(encryptedData.keyId, tenantId, serviceId);
            const decrypted = this.decrypt(encryptedData, key);

            try {
              result[field] = JSON.parse(decrypted);
            } catch {
              result[field] = decrypted;
            }

            delete result[encryptedField];
          } catch (decryptError) {
            logger.warn(`Failed to decrypt field ${field}:`, decryptError);
          }
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to decrypt sensitive fields with KMS:', error);
      throw new Error('Failed to decrypt sensitive fields');
    }
  }

  /**
   * Rotiert Verschlüsselung mit neuem KMS-Schlüssel
   */
  async rotateEncryption(
    encrypted: EncryptionResultWithKeyRef,
    tenantId: string,
    purpose: KeyPurpose,
    serviceId?: string
  ): Promise<EncryptionResultWithKeyRef> {
    if (!this.kms) {
      throw new Error('KMS not initialized');
    }

    try {
      // Entschlüssele mit altem Schlüssel
      const decrypted = await this.decryptWithKMS(encrypted, tenantId, serviceId);

      // Verschlüssele mit neuem Schlüssel
      return this.encryptWithKMS(decrypted, tenantId, purpose, serviceId);
    } catch (error) {
      logger.error('Failed to rotate encryption:', error);
      throw new Error('Encryption rotation failed');
    }
  }
}
