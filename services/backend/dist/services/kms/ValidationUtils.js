"use strict";
/**
 * KMS Validation Utilities
 *
 * Provides validation functions for Key Management System operations
 * to ensure data integrity and security compliance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTenantId = validateTenantId;
exports.validateKeyId = validateKeyId;
exports.validateKeyPurpose = validateKeyPurpose;
exports.validateServiceId = validateServiceId;
exports.validateUserId = validateUserId;
exports.validateRotationInterval = validateRotationInterval;
exports.validateExpirationDate = validateExpirationDate;
exports.validateMetadata = validateMetadata;
exports.validatePagination = validatePagination;
exports.validateIpAddress = validateIpAddress;
exports.validateAlgorithm = validateAlgorithm;
exports.validateCreateKeyOptions = validateCreateKeyOptions;
exports.sanitizeErrorMessage = sanitizeErrorMessage;
exports.createSafeErrorContext = createSafeErrorContext;
const kms_1 = require("../../types/kms");
const logger_1 = require("../../utils/logger");
// ============================================
// Validation Constants
// ============================================
const TENANT_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const KEY_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const SERVICE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const USER_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const MIN_ROTATION_INTERVAL_DAYS = 1;
const MAX_ROTATION_INTERVAL_DAYS = 365;
const MAX_METADATA_SIZE = 4096; // 4KB
// ============================================
// Validation Functions
// ============================================
/**
 * Validates tenant ID format and security requirements
 */
function validateTenantId(tenantId) {
    if (!tenantId) {
        throw new kms_1.KeyManagementError('Tenant ID ist erforderlich', kms_1.KeyManagementErrorCode.INVALID_TENANT);
    }
    if (typeof tenantId !== 'string') {
        throw new kms_1.KeyManagementError('Tenant ID muss ein String sein', kms_1.KeyManagementErrorCode.INVALID_TENANT, undefined, tenantId);
    }
    if (!TENANT_ID_REGEX.test(tenantId)) {
        throw new kms_1.KeyManagementError('Tenant ID enthält ungültige Zeichen oder ist zu lang (max. 64 Zeichen, nur alphanumerisch, _, -)', kms_1.KeyManagementErrorCode.INVALID_TENANT, undefined, tenantId);
    }
    // Security: Prevent common injection patterns
    const suspiciousPatterns = [
        /\.\./, // Path traversal
        /[<>'"]/, // XSS patterns
        /\$\{/, // Template injection
        /\bselect\b/i, // SQL injection
        /\bunion\b/i, // SQL injection
        /\bdrop\b/i // SQL injection
    ];
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(tenantId)) {
            logger_1.logger.warn('Suspicious tenant ID pattern detected', {
                tenantId: '[REDACTED]',
                pattern: pattern.toString()
            });
            throw new kms_1.KeyManagementError('Tenant ID enthält verdächtige Muster', kms_1.KeyManagementErrorCode.INVALID_TENANT, undefined, tenantId);
        }
    }
}
/**
 * Validates key ID format and security requirements
 */
function validateKeyId(keyId) {
    if (!keyId) {
        throw new kms_1.KeyManagementError('Key ID ist erforderlich', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND);
    }
    if (typeof keyId !== 'string') {
        throw new kms_1.KeyManagementError('Key ID muss ein String sein', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId);
    }
    if (!KEY_ID_REGEX.test(keyId)) {
        throw new kms_1.KeyManagementError('Key ID enthält ungültige Zeichen oder ist zu lang (max. 128 Zeichen, nur alphanumerisch, _, -)', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId);
    }
}
/**
 * Validates key purpose
 */
function validateKeyPurpose(purpose) {
    if (!purpose) {
        throw new kms_1.KeyManagementError('Key Purpose ist erforderlich', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
    }
    if (!Object.values(kms_1.KeyPurpose).includes(purpose)) {
        throw new kms_1.KeyManagementError(`Ungültiger Key Purpose: ${purpose}. Erlaubte Werte: ${Object.values(kms_1.KeyPurpose).join(', ')}`, kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
    }
}
/**
 * Validates service ID format
 */
function validateServiceId(serviceId) {
    if (serviceId && !SERVICE_ID_REGEX.test(serviceId)) {
        throw new kms_1.KeyManagementError('Service ID enthält ungültige Zeichen oder ist zu lang (max. 64 Zeichen, nur alphanumerisch, _, -)', kms_1.KeyManagementErrorCode.UNAUTHORIZED_ACCESS);
    }
}
/**
 * Validates user ID format
 */
function validateUserId(userId) {
    if (userId && !USER_ID_REGEX.test(userId)) {
        throw new kms_1.KeyManagementError('User ID enthält ungültige Zeichen oder ist zu lang (max. 64 Zeichen, nur alphanumerisch, _, -)', kms_1.KeyManagementErrorCode.UNAUTHORIZED_ACCESS);
    }
}
/**
 * Validates rotation interval
 */
function validateRotationInterval(intervalDays) {
    if (!Number.isInteger(intervalDays)) {
        throw new kms_1.KeyManagementError('Rotation Interval muss eine ganze Zahl sein', kms_1.KeyManagementErrorCode.ROTATION_FAILED);
    }
    if (intervalDays < MIN_ROTATION_INTERVAL_DAYS || intervalDays > MAX_ROTATION_INTERVAL_DAYS) {
        throw new kms_1.KeyManagementError(`Rotation Interval muss zwischen ${MIN_ROTATION_INTERVAL_DAYS} und ${MAX_ROTATION_INTERVAL_DAYS} Tagen liegen`, kms_1.KeyManagementErrorCode.ROTATION_FAILED);
    }
}
/**
 * Validates expiration date
 */
function validateExpirationDate(expiresAt) {
    if (expiresAt) {
        if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
            throw new kms_1.KeyManagementError('Expiration Date muss ein gültiges Datum sein', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
        }
        if (expiresAt <= new Date()) {
            throw new kms_1.KeyManagementError('Expiration Date muss in der Zukunft liegen', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
        }
        // Prevent extremely long expiration dates (max 10 years)
        const maxExpirationDate = new Date();
        maxExpirationDate.setFullYear(maxExpirationDate.getFullYear() + 10);
        if (expiresAt > maxExpirationDate) {
            throw new kms_1.KeyManagementError('Expiration Date darf nicht mehr als 10 Jahre in der Zukunft liegen', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
        }
    }
}
/**
 * Validates metadata object
 */
function validateMetadata(metadata) {
    if (metadata) {
        if (typeof metadata !== 'object' || Array.isArray(metadata)) {
            throw new kms_1.KeyManagementError('Metadata muss ein Objekt sein', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
        }
        // Check size limit
        const metadataString = JSON.stringify(metadata);
        if (metadataString.length > MAX_METADATA_SIZE) {
            throw new kms_1.KeyManagementError(`Metadata ist zu groß (max. ${MAX_METADATA_SIZE} Bytes)`, kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
        }
        // Validate keys and values
        for (const [key, value] of Object.entries(metadata)) {
            if (typeof key !== 'string' || key.length === 0) {
                throw new kms_1.KeyManagementError('Metadata Keys müssen nicht-leere Strings sein', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
            }
            if (key.length > 128) {
                throw new kms_1.KeyManagementError('Metadata Keys dürfen nicht länger als 128 Zeichen sein', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
            }
            // Prevent dangerous values
            if (typeof value === 'function') {
                throw new kms_1.KeyManagementError('Metadata darf keine Funktionen enthalten', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
            }
        }
    }
}
/**
 * Validates pagination parameters
 */
function validatePagination(limit, offset) {
    if (limit !== undefined) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
            throw new kms_1.KeyManagementError('Limit muss eine ganze Zahl zwischen 1 und 1000 sein', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
        }
    }
    if (offset !== undefined) {
        if (!Number.isInteger(offset) || offset < 0) {
            throw new kms_1.KeyManagementError('Offset muss eine nicht-negative ganze Zahl sein', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
        }
    }
}
/**
 * Validates IP address format
 */
function validateIpAddress(ipAddress) {
    if (ipAddress) {
        // Basic IPv4 and IPv6 validation
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
            throw new kms_1.KeyManagementError('Ungültige IP-Adresse', kms_1.KeyManagementErrorCode.AUDIT_LOG_ERROR);
        }
    }
}
/**
 * Validates algorithm parameter
 */
function validateAlgorithm(algorithm) {
    const supportedAlgorithms = ['aes-256-gcm'];
    if (algorithm && !supportedAlgorithms.includes(algorithm)) {
        throw new kms_1.KeyManagementError(`Nicht unterstützter Algorithmus: ${algorithm}. Unterstützte Algorithmen: ${supportedAlgorithms.join(', ')}`, kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED);
    }
}
/**
 * Comprehensive validation for key creation
 */
function validateCreateKeyOptions(options) {
    validateTenantId(options.tenantId);
    validateKeyPurpose(options.purpose);
    if (options.algorithm) {
        validateAlgorithm(options.algorithm);
    }
    if (options.expiresAt) {
        validateExpirationDate(options.expiresAt);
    }
    if (options.rotationIntervalDays !== undefined) {
        validateRotationInterval(options.rotationIntervalDays);
    }
    if (options.metadata) {
        validateMetadata(options.metadata);
    }
    // Validate auto-rotation logic
    if (options.autoRotate && !options.rotationIntervalDays) {
        throw new kms_1.KeyManagementError('Rotation Interval ist erforderlich wenn Auto-Rotation aktiviert ist', kms_1.KeyManagementErrorCode.ROTATION_FAILED);
    }
}
/**
 * Sanitizes error messages to prevent information leakage
 */
function sanitizeErrorMessage(error, keyId) {
    // Never expose actual key values or sensitive data in error messages
    let message = error.message;
    // Replace potential key data with placeholders
    message = message.replace(/[A-Fa-f0-9]{32,}/g, '[KEY_DATA_REDACTED]');
    // Replace potential tenant IDs in error messages (except for validation errors)
    if (!(error instanceof kms_1.KeyManagementError && error.code === kms_1.KeyManagementErrorCode.INVALID_TENANT)) {
        message = message.replace(/tenant[_-]?id[:\s]*[a-zA-Z0-9_-]+/gi, 'tenant_id: [REDACTED]');
    }
    return message;
}
/**
 * Creates a safe error context for logging (without sensitive data)
 */
function createSafeErrorContext(context) {
    const safeContext = {};
    // Include non-sensitive identifiers
    if (context.keyId) {
        safeContext.keyId = context.keyId;
    }
    if (context.tenantId) {
        safeContext.tenantId = context.tenantId;
    }
    if (context.serviceId) {
        safeContext.serviceId = context.serviceId;
    }
    if (context.userId) {
        safeContext.userId = context.userId;
    }
    if (context.operation) {
        safeContext.operation = context.operation;
    }
    // Include other non-sensitive fields
    const sensitiveFields = ['key', 'password', 'secret', 'token', 'encryptedKey', 'masterKey'];
    for (const [key, value] of Object.entries(context)) {
        if (!sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            safeContext[key] = value;
        }
    }
    return safeContext;
}
