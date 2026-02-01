/**
 * KMS Validation Utilities
 *
 * Provides validation functions for Key Management System operations
 * to ensure data integrity and security compliance.
 */
import { KeyPurpose } from '../../types/kms';
/**
 * Validates tenant ID format and security requirements
 */
export declare function validateTenantId(tenantId: string): void;
/**
 * Validates key ID format and security requirements
 */
export declare function validateKeyId(keyId: string): void;
/**
 * Validates key purpose
 */
export declare function validateKeyPurpose(purpose: KeyPurpose): void;
/**
 * Validates service ID format
 */
export declare function validateServiceId(serviceId?: string): void;
/**
 * Validates user ID format
 */
export declare function validateUserId(userId?: string): void;
/**
 * Validates rotation interval
 */
export declare function validateRotationInterval(intervalDays: number): void;
/**
 * Validates expiration date
 */
export declare function validateExpirationDate(expiresAt?: Date): void;
/**
 * Validates metadata object
 */
export declare function validateMetadata(metadata?: Record<string, any>): void;
/**
 * Validates pagination parameters
 */
export declare function validatePagination(limit?: number, offset?: number): void;
/**
 * Validates IP address format
 */
export declare function validateIpAddress(ipAddress?: string): void;
/**
 * Validates algorithm parameter
 */
export declare function validateAlgorithm(algorithm?: string): void;
/**
 * Comprehensive validation for key creation
 */
export declare function validateCreateKeyOptions(options: {
    tenantId: string;
    purpose: KeyPurpose;
    algorithm?: string;
    expiresAt?: Date;
    autoRotate?: boolean;
    rotationIntervalDays?: number;
    metadata?: Record<string, any>;
}): void;
/**
 * Sanitizes error messages to prevent information leakage
 */
export declare function sanitizeErrorMessage(error: Error, keyId?: string): string;
/**
 * Creates a safe error context for logging (without sensitive data)
 */
export declare function createSafeErrorContext(context: {
    keyId?: string;
    tenantId?: string;
    serviceId?: string;
    userId?: string;
    operation?: string;
    [key: string]: any;
}): Record<string, any>;
