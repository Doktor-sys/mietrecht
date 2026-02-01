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
export declare class EncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly tagLength;
    private readonly saltLength;
    private readonly defaultIterations;
    /**
     * Generates a secure encryption key
     */
    generateKey(): string;
    /**
     * Generates a secure salt for key derivation
     */
    generateSalt(): string;
    /**
     * Derives a key from a password (PBKDF2)
     */
    deriveKey(options: KeyDerivationOptions): string;
    /**
     * Encrypts data with AES-256-GCM
     */
    encrypt(data: string, key?: string): EncryptionResult;
    /**
     * Decrypts data with AES-256-GCM
     */
    decrypt(options: DecryptionOptions, key: string): string;
    /**
     * Encrypts a JSON object
     */
    encryptObject(obj: any, key?: string): EncryptionResult;
    /**
     * Decrypts a JSON object
     */
    decryptObject<T = any>(options: DecryptionOptions, key: string): T;
    /**
     * Encrypts a file (Buffer)
     */
    encryptFile(fileBuffer: Buffer, key?: string): EncryptionResult;
    /**
     * Decrypts a file (Buffer)
     */
    decryptFile(options: DecryptionOptions, key: string): Buffer;
    /**
     * Creates a hash of data (for integrity check)
     */
    createHash(data: string, algorithm?: string): string;
    /**
     * Verifies a hash
     */
    verifyHash(data: string, expectedHash: string, algorithm?: string): boolean;
    /**
     * Generates a secure token
     */
    generateSecureToken(length?: number): string;
    /**
     * Creates an HMAC for message authentication
     */
    createHMAC(data: string, key: string, algorithm?: string): string;
    /**
     * Verifies an HMAC
     */
    verifyHMAC(data: string, expectedHmac: string, key: string, algorithm?: string): boolean;
    /**
     * Encrypts sensitive fields in an object
     */
    encryptSensitiveFields(obj: Record<string, any>, sensitiveFields: string[], key: string): Record<string, any>;
    /**
     * Decrypts sensitive fields in an object
     */
    decryptSensitiveFields(obj: Record<string, any>, sensitiveFields: string[], key: string): Record<string, any>;
    /**
     * Rotates encryption key (re-encrypt with new key)
     */
    rotateKey(encryptedData: EncryptionResult, oldKey: string, newKey: string): EncryptionResult;
    /**
     * Validates encryption parameters
     */
    validateEncryptionParams(params: any): boolean;
}
import type { KeyManagementService } from './kms/KeyManagementService';
import { KeyPurpose, EncryptionResultWithKeyRef } from '../types/kms';
/**
 * Extended EncryptionService class with KMS integration
 */
export declare class EncryptionServiceWithKMS extends EncryptionService {
    private kms?;
    /**
     * Sets the KMS instance for extended functions
     */
    setKMS(kms: KeyManagementService): void;
    /**
     * Encrypts data with KMS-managed keys
     */
    encryptWithKMS(data: string, tenantId: string, purpose: KeyPurpose, serviceId?: string): Promise<EncryptionResultWithKeyRef>;
    /**
     * Decrypts data with KMS-managed keys
     */
    decryptWithKMS(encrypted: EncryptionResultWithKeyRef, tenantId: string, serviceId?: string): Promise<string>;
    /**
     * Encrypts an object with KMS
     */
    encryptObjectWithKMS<T>(obj: T, tenantId: string, purpose: KeyPurpose, serviceId?: string): Promise<EncryptionResultWithKeyRef>;
    /**
     * Decrypts an object with KMS
     */
    decryptObjectWithKMS<T = any>(encrypted: EncryptionResultWithKeyRef, tenantId: string, serviceId?: string): Promise<T>;
    /**
     * Encrypts a file with KMS
     */
    encryptFileWithKMS(fileBuffer: Buffer, tenantId: string, purpose: KeyPurpose, serviceId?: string): Promise<EncryptionResultWithKeyRef>;
    /**
     * Decrypts a file with KMS
     */
    decryptFileWithKMS(encrypted: EncryptionResultWithKeyRef, tenantId: string, serviceId?: string): Promise<Buffer>;
    /**
     * Encrypts sensitive fields with KMS
     */
    encryptSensitiveFieldsWithKMS<T extends Record<string, any>>(obj: T, sensitiveFields: string[], tenantId: string, purpose: KeyPurpose, serviceId?: string): Promise<T & {
        _encryptedFields: Record<string, EncryptionResultWithKeyRef>;
    }>;
    /**
     * Decrypts sensitive fields with KMS
     */
    decryptSensitiveFieldsWithKMS(obj: Record<string, any>, sensitiveFields: string[], tenantId: string, serviceId?: string): Promise<Record<string, any>>;
    /**
     * Rotates encryption with new KMS key
     */
    rotateEncryption(encrypted: EncryptionResultWithKeyRef, tenantId: string, purpose: KeyPurpose, serviceId?: string): Promise<EncryptionResultWithKeyRef>;
}
