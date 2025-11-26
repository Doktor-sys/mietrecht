/**
 * KMS Validation Utilities
 * 
 * Provides validation functions for Key Management System operations
 * to ensure data integrity and security compliance.
 */

import { KeyPurpose, KeyManagementError, KeyManagementErrorCode } from '../../types/kms';
import { logger } from '../../utils/logger';

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
export function validateTenantId(tenantId: string): void {
  if (!tenantId) {
    throw new KeyManagementError(
      'Tenant ID ist erforderlich',
      KeyManagementErrorCode.INVALID_TENANT
    );
  }

  if (typeof tenantId !== 'string') {
    throw new KeyManagementError(
      'Tenant ID muss ein String sein',
      KeyManagementErrorCode.INVALID_TENANT,
      undefined,
      tenantId
    );
  }

  if (!TENANT_ID_REGEX.test(tenantId)) {
    throw new KeyManagementError(
      'Tenant ID enthält ungültige Zeichen oder ist zu lang (max. 64 Zeichen, nur alphanumerisch, _, -)',
      KeyManagementErrorCode.INVALID_TENANT,
      undefined,
      tenantId
    );
  }

  // Security: Prevent common injection patterns
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /[<>'"]/,         // XSS patterns
    /\$\{/,           // Template injection
    /\bselect\b/i,    // SQL injection
    /\bunion\b/i,     // SQL injection
    /\bdrop\b/i       // SQL injection
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(tenantId)) {
      logger.warn('Suspicious tenant ID pattern detected', { 
        tenantId: '[REDACTED]',
        pattern: pattern.toString()
      });
      throw new KeyManagementError(
        'Tenant ID enthält verdächtige Muster',
        KeyManagementErrorCode.INVALID_TENANT,
        undefined,
        tenantId
      );
    }
  }
}

/**
 * Validates key ID format and security requirements
 */
export function validateKeyId(keyId: string): void {
  if (!keyId) {
    throw new KeyManagementError(
      'Key ID ist erforderlich',
      KeyManagementErrorCode.KEY_NOT_FOUND
    );
  }

  if (typeof keyId !== 'string') {
    throw new KeyManagementError(
      'Key ID muss ein String sein',
      KeyManagementErrorCode.KEY_NOT_FOUND,
      keyId
    );
  }

  if (!KEY_ID_REGEX.test(keyId)) {
    throw new KeyManagementError(
      'Key ID enthält ungültige Zeichen oder ist zu lang (max. 128 Zeichen, nur alphanumerisch, _, -)',
      KeyManagementErrorCode.KEY_NOT_FOUND,
      keyId
    );
  }
}

/**
 * Validates key purpose
 */
export function validateKeyPurpose(purpose: KeyPurpose): void {
  if (!purpose) {
    throw new KeyManagementError(
      'Key Purpose ist erforderlich',
      KeyManagementErrorCode.ENCRYPTION_FAILED
    );
  }

  if (!Object.values(KeyPurpose).includes(purpose)) {
    throw new KeyManagementError(
      `Ungültiger Key Purpose: ${purpose}. Erlaubte Werte: ${Object.values(KeyPurpose).join(', ')}`,
      KeyManagementErrorCode.ENCRYPTION_FAILED
    );
  }
}

/**
 * Validates service ID format
 */
export function validateServiceId(serviceId?: string): void {
  if (serviceId && !SERVICE_ID_REGEX.test(serviceId)) {
    throw new KeyManagementError(
      'Service ID enthält ungültige Zeichen oder ist zu lang (max. 64 Zeichen, nur alphanumerisch, _, -)',
      KeyManagementErrorCode.UNAUTHORIZED_ACCESS
    );
  }
}

/**
 * Validates user ID format
 */
export function validateUserId(userId?: string): void {
  if (userId && !USER_ID_REGEX.test(userId)) {
    throw new KeyManagementError(
      'User ID enthält ungültige Zeichen oder ist zu lang (max. 64 Zeichen, nur alphanumerisch, _, -)',
      KeyManagementErrorCode.UNAUTHORIZED_ACCESS
    );
  }
}

/**
 * Validates rotation interval
 */
export function validateRotationInterval(intervalDays: number): void {
  if (!Number.isInteger(intervalDays)) {
    throw new KeyManagementError(
      'Rotation Interval muss eine ganze Zahl sein',
      KeyManagementErrorCode.ROTATION_FAILED
    );
  }

  if (intervalDays < MIN_ROTATION_INTERVAL_DAYS || intervalDays > MAX_ROTATION_INTERVAL_DAYS) {
    throw new KeyManagementError(
      `Rotation Interval muss zwischen ${MIN_ROTATION_INTERVAL_DAYS} und ${MAX_ROTATION_INTERVAL_DAYS} Tagen liegen`,
      KeyManagementErrorCode.ROTATION_FAILED
    );
  }
}

/**
 * Validates expiration date
 */
export function validateExpirationDate(expiresAt?: Date): void {
  if (expiresAt) {
    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new KeyManagementError(
        'Expiration Date muss ein gültiges Datum sein',
        KeyManagementErrorCode.ENCRYPTION_FAILED
      );
    }

    if (expiresAt <= new Date()) {
      throw new KeyManagementError(
        'Expiration Date muss in der Zukunft liegen',
        KeyManagementErrorCode.ENCRYPTION_FAILED
      );
    }

    // Prevent extremely long expiration dates (max 10 years)
    const maxExpirationDate = new Date();
    maxExpirationDate.setFullYear(maxExpirationDate.getFullYear() + 10);
    
    if (expiresAt > maxExpirationDate) {
      throw new KeyManagementError(
        'Expiration Date darf nicht mehr als 10 Jahre in der Zukunft liegen',
        KeyManagementErrorCode.ENCRYPTION_FAILED
      );
    }
  }
}

/**
 * Validates metadata object
 */
export function validateMetadata(metadata?: Record<string, any>): void {
  if (metadata) {
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new KeyManagementError(
        'Metadata muss ein Objekt sein',
        KeyManagementErrorCode.ENCRYPTION_FAILED
      );
    }

    // Check size limit
    const metadataString = JSON.stringify(metadata);
    if (metadataString.length > MAX_METADATA_SIZE) {
      throw new KeyManagementError(
        `Metadata ist zu groß (max. ${MAX_METADATA_SIZE} Bytes)`,
        KeyManagementErrorCode.ENCRYPTION_FAILED
      );
    }

    // Validate keys and values
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof key !== 'string' || key.length === 0) {
        throw new KeyManagementError(
          'Metadata Keys müssen nicht-leere Strings sein',
          KeyManagementErrorCode.ENCRYPTION_FAILED
        );
      }

      if (key.length > 128) {
        throw new KeyManagementError(
          'Metadata Keys dürfen nicht länger als 128 Zeichen sein',
          KeyManagementErrorCode.ENCRYPTION_FAILED
        );
      }

      // Prevent dangerous values
      if (typeof value === 'function') {
        throw new KeyManagementError(
          'Metadata darf keine Funktionen enthalten',
          KeyManagementErrorCode.ENCRYPTION_FAILED
        );
      }
    }
  }
}

/**
 * Validates pagination parameters
 */
export function validatePagination(limit?: number, offset?: number): void {
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new KeyManagementError(
        'Limit muss eine ganze Zahl zwischen 1 und 1000 sein',
        KeyManagementErrorCode.ENCRYPTION_FAILED
      );
    }
  }

  if (offset !== undefined) {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new KeyManagementError(
        'Offset muss eine nicht-negative ganze Zahl sein',
        KeyManagementErrorCode.ENCRYPTION_FAILED
      );
    }
  }
}

/**
 * Validates IP address format
 */
export function validateIpAddress(ipAddress?: string): void {
  if (ipAddress) {
    // Basic IPv4 and IPv6 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    
    if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
      throw new KeyManagementError(
        'Ungültige IP-Adresse',
        KeyManagementErrorCode.AUDIT_LOG_ERROR
      );
    }
  }
}

/**
 * Validates algorithm parameter
 */
export function validateAlgorithm(algorithm?: string): void {
  const supportedAlgorithms = ['aes-256-gcm'];
  
  if (algorithm && !supportedAlgorithms.includes(algorithm)) {
    throw new KeyManagementError(
      `Nicht unterstützter Algorithmus: ${algorithm}. Unterstützte Algorithmen: ${supportedAlgorithms.join(', ')}`,
      KeyManagementErrorCode.ENCRYPTION_FAILED
    );
  }
}

/**
 * Comprehensive validation for key creation
 */
export function validateCreateKeyOptions(options: {
  tenantId: string;
  purpose: KeyPurpose;
  algorithm?: string;
  expiresAt?: Date;
  autoRotate?: boolean;
  rotationIntervalDays?: number;
  metadata?: Record<string, any>;
}): void {
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
    throw new KeyManagementError(
      'Rotation Interval ist erforderlich wenn Auto-Rotation aktiviert ist',
      KeyManagementErrorCode.ROTATION_FAILED
    );
  }
}

/**
 * Sanitizes error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: Error, keyId?: string): string {
  // Never expose actual key values or sensitive data in error messages
  let message = error.message;
  
  // Replace potential key data with placeholders
  message = message.replace(/[A-Fa-f0-9]{32,}/g, '[KEY_DATA_REDACTED]');
  
  // Replace potential tenant IDs in error messages (except for validation errors)
  if (!(error instanceof KeyManagementError && error.code === KeyManagementErrorCode.INVALID_TENANT)) {
    message = message.replace(/tenant[_-]?id[:\s]*[a-zA-Z0-9_-]+/gi, 'tenant_id: [REDACTED]');
  }
  
  return message;
}

/**
 * Creates a safe error context for logging (without sensitive data)
 */
export function createSafeErrorContext(context: {
  keyId?: string;
  tenantId?: string;
  serviceId?: string;
  userId?: string;
  operation?: string;
  [key: string]: any;
}): Record<string, any> {
  const safeContext: Record<string, any> = {};
  
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