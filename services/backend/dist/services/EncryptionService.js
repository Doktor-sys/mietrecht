"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionServiceWithKMS = exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 12; // 96 bits (recommended for GCM)
        this.tagLength = 16; // 128 bits
        this.saltLength = 32; // 256 bits
        this.defaultIterations = 100000; // PBKDF2 iterations
    }
    /**
     * Generates a secure encryption key
     */
    generateKey() {
        return crypto_1.default.randomBytes(this.keyLength).toString('hex');
    }
    /**
     * Generates a secure salt for key derivation
     */
    generateSalt() {
        return crypto_1.default.randomBytes(this.saltLength).toString('hex');
    }
    /**
     * Derives a key from a password (PBKDF2)
     */
    deriveKey(options) {
        try {
            const { password, salt, iterations = this.defaultIterations, keyLength = this.keyLength } = options;
            const derivedKey = crypto_1.default.pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, keyLength, 'sha512');
            return derivedKey.toString('hex');
        }
        catch (error) {
            logger_1.logger.error('Error deriving key:', error);
            throw new Error('Failed to derive encryption key');
        }
    }
    /**
     * Encrypts data with AES-256-GCM
     */
    encrypt(data, key) {
        try {
            // Use provided key or generate new one
            const encryptionKey = key ? Buffer.from(key, 'hex') : crypto_1.default.randomBytes(this.keyLength);
            // Generate random IV
            const iv = crypto_1.default.randomBytes(this.ivLength);
            // Create cipher
            const cipher = crypto_1.default.createCipheriv(this.algorithm, encryptionKey, iv);
            cipher.setAAD(Buffer.from('smartlaw-encryption', 'utf8')); // Additional Authenticated Data
            // Encrypt data
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            // Get authentication tag
            const authTag = cipher.getAuthTag();
            return {
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        }
        catch (error) {
            logger_1.logger.error('Error encrypting data:', error);
            throw new Error('Failed to encrypt data');
        }
    }
    /**
     * Decrypts data with AES-256-GCM
     */
    decrypt(options, key) {
        try {
            const { encryptedData, iv, authTag } = options;
            // Convert hex strings to buffers
            const encryptionKey = Buffer.from(key, 'hex');
            const ivBuffer = Buffer.from(iv, 'hex');
            const authTagBuffer = Buffer.from(authTag, 'hex');
            // Create decipher
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, encryptionKey, ivBuffer);
            decipher.setAAD(Buffer.from('smartlaw-encryption', 'utf8'));
            decipher.setAuthTag(authTagBuffer);
            // Decrypt data
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Error decrypting data:', error);
            throw new Error('Failed to decrypt data - data may be corrupted or key is invalid');
        }
    }
    /**
     * Encrypts a JSON object
     */
    encryptObject(obj, key) {
        try {
            const jsonString = JSON.stringify(obj);
            return this.encrypt(jsonString, key);
        }
        catch (error) {
            logger_1.logger.error('Error encrypting object:', error);
            throw new Error('Failed to encrypt object');
        }
    }
    /**
     * Decrypts a JSON object
     */
    decryptObject(options, key) {
        try {
            const decryptedString = this.decrypt(options, key);
            return JSON.parse(decryptedString);
        }
        catch (error) {
            logger_1.logger.error('Error decrypting object:', error);
            throw new Error('Failed to decrypt object');
        }
    }
    /**
     * Encrypts a file (Buffer)
     */
    encryptFile(fileBuffer, key) {
        try {
            const base64Data = fileBuffer.toString('base64');
            return this.encrypt(base64Data, key);
        }
        catch (error) {
            logger_1.logger.error('Error encrypting file:', error);
            throw new Error('Failed to encrypt file');
        }
    }
    /**
     * Decrypts a file (Buffer)
     */
    decryptFile(options, key) {
        try {
            const decryptedBase64 = this.decrypt(options, key);
            return Buffer.from(decryptedBase64, 'base64');
        }
        catch (error) {
            logger_1.logger.error('Error decrypting file:', error);
            throw new Error('Failed to decrypt file');
        }
    }
    /**
     * Creates a hash of data (for integrity check)
     */
    createHash(data, algorithm = 'sha256') {
        try {
            return crypto_1.default.createHash(algorithm).update(data, 'utf8').digest('hex');
        }
        catch (error) {
            logger_1.logger.error('Error creating hash:', error);
            throw new Error('Failed to create hash');
        }
    }
    /**
     * Verifies a hash
     */
    verifyHash(data, expectedHash, algorithm = 'sha256') {
        try {
            const actualHash = this.createHash(data, algorithm);
            return crypto_1.default.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
        }
        catch (error) {
            logger_1.logger.error('Error verifying hash:', error);
            return false;
        }
    }
    /**
     * Generates a secure token
     */
    generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    /**
     * Creates an HMAC for message authentication
     */
    createHMAC(data, key, algorithm = 'sha256') {
        try {
            return crypto_1.default.createHmac(algorithm, key).update(data, 'utf8').digest('hex');
        }
        catch (error) {
            logger_1.logger.error('Error creating HMAC:', error);
            throw new Error('Failed to create HMAC');
        }
    }
    /**
     * Verifies an HMAC
     */
    verifyHMAC(data, expectedHmac, key, algorithm = 'sha256') {
        try {
            const actualHmac = this.createHMAC(data, key, algorithm);
            return crypto_1.default.timingSafeEqual(Buffer.from(actualHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
        }
        catch (error) {
            logger_1.logger.error('Error verifying HMAC:', error);
            return false;
        }
    }
    /**
     * Encrypts sensitive fields in an object
     */
    encryptSensitiveFields(obj, sensitiveFields, key) {
        try {
            const result = { ...obj };
            for (const field of sensitiveFields) {
                if (result[field] !== undefined && result[field] !== null) {
                    const fieldValue = typeof result[field] === 'string'
                        ? result[field]
                        : JSON.stringify(result[field]);
                    const encrypted = this.encrypt(fieldValue, key);
                    result[`${field}_encrypted`] = encrypted;
                    delete result[field]; // Remove plaintext
                }
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error encrypting sensitive fields:', error);
            throw new Error('Failed to encrypt sensitive fields');
        }
    }
    /**
     * Decrypts sensitive fields in an object
     */
    decryptSensitiveFields(obj, sensitiveFields, key) {
        try {
            const result = { ...obj };
            for (const field of sensitiveFields) {
                const encryptedField = `${field}_encrypted`;
                if (result[encryptedField]) {
                    try {
                        const decrypted = this.decrypt(result[encryptedField], key);
                        // Try to parse JSON, if it was an object
                        try {
                            result[field] = JSON.parse(decrypted);
                        }
                        catch {
                            result[field] = decrypted; // Stay string
                        }
                        delete result[encryptedField]; // Remove encrypted version
                    }
                    catch (decryptError) {
                        logger_1.logger.warn(`Failed to decrypt field ${field}:`, decryptError);
                        // Field stays encrypted
                    }
                }
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error decrypting sensitive fields:', error);
            throw new Error('Failed to decrypt sensitive fields');
        }
    }
    /**
     * Rotates encryption key (re-encrypt with new key)
     */
    rotateKey(encryptedData, oldKey, newKey) {
        try {
            // Decrypt with old key
            const decrypted = this.decrypt(encryptedData, oldKey);
            // Encrypt with new key
            return this.encrypt(decrypted, newKey);
        }
        catch (error) {
            logger_1.logger.error('Error rotating encryption key:', error);
            throw new Error('Failed to rotate encryption key');
        }
    }
    /**
     * Validates encryption parameters
     */
    validateEncryptionParams(params) {
        try {
            const { encryptedData, iv, authTag } = params;
            // Check if all required fields are present
            if (!encryptedData || !iv || !authTag) {
                return false;
            }
            // Check hex format and lengths
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
        }
        catch (error) {
            logger_1.logger.error('Error validating encryption params:', error);
            return false;
        }
    }
}
exports.EncryptionService = EncryptionService;
/**
 * Extended EncryptionService class with KMS integration
 */
class EncryptionServiceWithKMS extends EncryptionService {
    /**
     * Sets the KMS instance for extended functions
     */
    setKMS(kms) {
        this.kms = kms;
        logger_1.logger.info('KMS integration enabled for EncryptionService');
    }
    /**
     * Encrypts data with KMS-managed keys
     */
    async encryptWithKMS(data, tenantId, purpose, serviceId) {
        if (!this.kms) {
            throw new Error('KMS not initialized - call setKMS() first');
        }
        try {
            // Get current key for purpose
            const keyMetadata = await this.kms.getActiveKeyForPurpose(tenantId, purpose);
            const key = await this.kms.getKey(keyMetadata.id, tenantId, serviceId);
            // Encrypt with EncryptionService
            const encrypted = this.encrypt(data, key);
            return {
                ...encrypted,
                keyId: keyMetadata.id,
                keyVersion: keyMetadata.version
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt with KMS:', error);
            throw new Error('Encryption with KMS failed');
        }
    }
    /**
     * Decrypts data with KMS-managed keys
     */
    async decryptWithKMS(encrypted, tenantId, serviceId) {
        if (!this.kms) {
            throw new Error('KMS not initialized - call setKMS() first');
        }
        try {
            // Get key from KMS
            const key = await this.kms.getKey(encrypted.keyId, tenantId, serviceId);
            // Decrypt with EncryptionService
            return this.decrypt(encrypted, key);
        }
        catch (error) {
            logger_1.logger.error('Failed to decrypt with KMS:', error);
            throw new Error('Decryption with KMS failed');
        }
    }
    /**
     * Encrypts an object with KMS
     */
    async encryptObjectWithKMS(obj, tenantId, purpose, serviceId) {
        if (!this.kms) {
            throw new Error('KMS not initialized - call setKMS() first');
        }
        try {
            // Get current key for purpose
            const keyMetadata = await this.kms.getActiveKeyForPurpose(tenantId, purpose);
            const key = await this.kms.getKey(keyMetadata.id, tenantId, serviceId);
            // Serialize and encrypt object
            const jsonString = JSON.stringify(obj);
            const encrypted = this.encrypt(jsonString, key);
            return {
                ...encrypted,
                keyId: keyMetadata.id,
                keyVersion: keyMetadata.version
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt object with KMS:', error);
            throw new Error('Object encryption with KMS failed');
        }
    }
    /**
     * Decrypts an object with KMS
     */
    async decryptObjectWithKMS(encrypted, tenantId, serviceId) {
        const decryptedString = await this.decryptWithKMS(encrypted, tenantId, serviceId);
        return JSON.parse(decryptedString);
    }
    /**
     * Encrypts a file with KMS
     */
    async encryptFileWithKMS(fileBuffer, tenantId, purpose, serviceId) {
        const base64Data = fileBuffer.toString('base64');
        return this.encryptWithKMS(base64Data, tenantId, purpose, serviceId);
    }
    /**
     * Decrypts a file with KMS
     */
    async decryptFileWithKMS(encrypted, tenantId, serviceId) {
        const decryptedBase64 = await this.decryptWithKMS(encrypted, tenantId, serviceId);
        return Buffer.from(decryptedBase64, 'base64');
    }
    /**
     * Encrypts sensitive fields with KMS
     */
    async encryptSensitiveFieldsWithKMS(obj, sensitiveFields, tenantId, purpose, serviceId) {
        if (!this.kms) {
            throw new Error('KMS not initialized - call setKMS() first');
        }
        try {
            // Get current key for purpose
            const keyMetadata = await this.kms.getActiveKeyForPurpose(tenantId, purpose);
            const key = await this.kms.getKey(keyMetadata.id, tenantId, serviceId);
            const result = { ...obj };
            const encryptedFields = {};
            // Encrypt each sensitive field
            for (const field of sensitiveFields) {
                if (result[field] !== undefined) {
                    const encrypted = this.encrypt(String(result[field]), key);
                    encryptedFields[field] = {
                        ...encrypted,
                        keyId: keyMetadata.id,
                        keyVersion: keyMetadata.version
                    };
                    result[field] = '[ENCRYPTED]';
                }
            }
            result._encryptedFields = encryptedFields;
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt sensitive fields with KMS:', error);
            throw new Error('Sensitive field encryption with KMS failed');
        }
    }
    /**
     * Decrypts sensitive fields with KMS
     */
    async decryptSensitiveFieldsWithKMS(obj, sensitiveFields, tenantId, serviceId) {
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
                        }
                        catch {
                            result[field] = decrypted;
                        }
                        delete result[encryptedField];
                    }
                    catch (decryptError) {
                        logger_1.logger.warn(`Failed to decrypt field ${field}:`, decryptError);
                    }
                }
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to decrypt sensitive fields with KMS:', error);
            throw new Error('Failed to decrypt sensitive fields');
        }
    }
    /**
     * Rotates encryption with new KMS key
     */
    async rotateEncryption(encrypted, tenantId, purpose, serviceId) {
        if (!this.kms) {
            throw new Error('KMS not initialized');
        }
        try {
            // Decrypt with old key
            const decrypted = await this.decryptWithKMS(encrypted, tenantId, serviceId);
            // Encrypt with new key
            return this.encryptWithKMS(decrypted, tenantId, purpose, serviceId);
        }
        catch (error) {
            logger_1.logger.error('Failed to rotate encryption:', error);
            throw new Error('Encryption rotation failed');
        }
    }
}
exports.EncryptionServiceWithKMS = EncryptionServiceWithKMS;
