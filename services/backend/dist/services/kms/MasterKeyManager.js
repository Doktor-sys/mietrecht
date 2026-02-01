"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterKeyManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
const kms_1 = require("../../types/kms");
/**
 * Master Key Manager
 *
 * Verwaltet den Master Key für Envelope Encryption.
 * Der Master Key wird verwendet, um alle Data Encryption Keys (DEKs) zu verschlüsseln.
 */
class MasterKeyManager {
    /**
     * Initialisiert den Master Key Manager
     */
    constructor() {
        this.masterKey = null;
        this.keyLength = 32; // 256 bits
        this.loadMasterKey();
    }
    /**
     * Lädt den Master Key aus der Umgebungsvariable
     */
    loadMasterKey() {
        try {
            const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;
            if (!masterKeyHex) {
                throw new kms_1.KeyManagementError('Master encryption key not found in environment variables', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
            // Validiere Hex-Format
            if (!/^[0-9a-fA-F]+$/.test(masterKeyHex)) {
                throw new kms_1.KeyManagementError('Master encryption key must be in hexadecimal format', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
            // Validiere Länge (256 bits = 64 hex characters)
            if (masterKeyHex.length !== this.keyLength * 2) {
                throw new kms_1.KeyManagementError(`Master encryption key must be ${this.keyLength * 2} hexadecimal characters (${this.keyLength} bytes)`, kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
            this.masterKey = Buffer.from(masterKeyHex, 'hex');
            logger_1.logger.info('Master key loaded successfully');
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error('Failed to load master key:', error);
            throw new kms_1.KeyManagementError('Failed to load master encryption key', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
    }
    /**
     * Gibt den Master Key zurück
     */
    getMasterKey() {
        if (!this.masterKey) {
            throw new kms_1.KeyManagementError('Master key not initialized', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
        return this.masterKey;
    }
    /**
     * Validiert, ob der Master Key korrekt geladen wurde
     */
    validateMasterKey() {
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
                logger_1.logger.warn('Master key contains only zeros - this is insecure');
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Master key validation failed:', error);
            return false;
        }
    }
    /**
     * Rotiert den Master Key
     * WICHTIG: Diese Methode sollte nur mit äußerster Vorsicht verwendet werden
     * und erfordert Re-Encryption aller DEKs
     */
    async rotateMasterKey(newMasterKeyHex) {
        try {
            // Validiere neuen Master Key
            if (!/^[0-9a-fA-F]+$/.test(newMasterKeyHex)) {
                throw new kms_1.KeyManagementError('New master key must be in hexadecimal format', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
            if (newMasterKeyHex.length !== this.keyLength * 2) {
                throw new kms_1.KeyManagementError(`New master key must be ${this.keyLength * 2} hexadecimal characters`, kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
            const newMasterKey = Buffer.from(newMasterKeyHex, 'hex');
            // Prüfe ob neuer Key unterschiedlich ist
            if (this.masterKey && this.masterKey.equals(newMasterKey)) {
                throw new kms_1.KeyManagementError('New master key must be different from current master key', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
            // Speichere alten Key für Re-Encryption
            const oldMasterKey = this.masterKey;
            // Setze neuen Master Key
            this.masterKey = newMasterKey;
            logger_1.logger.info('Master key rotated successfully');
            // Hinweis: Die Re-Encryption aller DEKs muss vom KeyManagementService durchgeführt werden
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error('Master key rotation failed:', error);
            throw new kms_1.KeyManagementError('Failed to rotate master key', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
    }
    /**
     * Generiert einen neuen Master Key
     * WARNUNG: Nur für Entwicklung/Testing verwenden!
     */
    static generateMasterKey() {
        const key = crypto_1.default.randomBytes(32);
        return key.toString('hex');
    }
    /**
     * Gibt Informationen über den Master Key zurück (ohne den Key selbst preiszugeben)
     */
    getMasterKeyInfo() {
        return {
            length: this.keyLength,
            algorithm: 'aes-256-gcm',
            isValid: this.validateMasterKey()
        };
    }
}
exports.MasterKeyManager = MasterKeyManager;
