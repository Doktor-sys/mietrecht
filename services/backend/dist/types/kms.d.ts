/**
 * Key Management System (KMS) Types and Interfaces
 */
export declare enum KeyPurpose {
    DATA_ENCRYPTION = "data_encryption",
    DOCUMENT_ENCRYPTION = "document_encryption",
    FIELD_ENCRYPTION = "field_encryption",
    BACKUP_ENCRYPTION = "backup_encryption",
    API_KEY_ENCRYPTION = "api_key_encryption"
}
export declare enum KeyStatus {
    ACTIVE = "active",
    DEPRECATED = "deprecated",
    DISABLED = "disabled",
    COMPROMISED = "compromised",
    DELETED = "deleted"
}
export declare enum AuditEventType {
    KEY_CREATED = "key_created",
    KEY_ACCESSED = "key_accessed",
    KEY_ROTATED = "key_rotated",
    KEY_STATUS_CHANGED = "key_status_changed",
    KEY_DELETED = "key_deleted",
    SECURITY_ALERT = "security_alert",
    UNAUTHORIZED_ACCESS = "unauthorized_access"
}
export declare enum KeyManagementErrorCode {
    KEY_NOT_FOUND = "KEY_NOT_FOUND",
    KEY_EXPIRED = "KEY_EXPIRED",
    KEY_DISABLED = "KEY_DISABLED",
    KEY_COMPROMISED = "KEY_COMPROMISED",
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
    INVALID_TENANT = "INVALID_TENANT",
    MASTER_KEY_ERROR = "MASTER_KEY_ERROR",
    ROTATION_FAILED = "ROTATION_FAILED",
    ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
    DECRYPTION_FAILED = "DECRYPTION_FAILED",
    CACHE_ERROR = "CACHE_ERROR",
    AUDIT_LOG_ERROR = "AUDIT_LOG_ERROR"
}
export interface CreateKeyOptions {
    tenantId: string;
    purpose: KeyPurpose;
    algorithm?: 'aes-256-gcm';
    expiresAt?: Date;
    autoRotate?: boolean;
    rotationIntervalDays?: number;
    metadata?: Record<string, any>;
}
export interface KeyMetadata {
    id: string;
    tenantId: string;
    purpose: KeyPurpose;
    algorithm: string;
    version: number;
    status: KeyStatus;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    rotationSchedule?: RotationSchedule;
    metadata?: Record<string, any>;
}
export interface EncryptedKeyData {
    id: string;
    tenantId: string;
    encryptedKey: string;
    iv: string;
    authTag: string;
    version: number;
    status: KeyStatus;
    purpose: KeyPurpose;
    algorithm: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    metadata?: Record<string, any>;
}
export interface RotationSchedule {
    enabled: boolean;
    intervalDays: number;
    nextRotationAt: Date;
    lastRotationAt?: Date;
}
export interface RotationReport {
    rotatedKeys: string[];
    failedKeys: string[];
    totalProcessed: number;
    duration: number;
}
export interface DataReference {
    table: string;
    column: string;
    idColumn: string;
    ids: string[];
}
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    eventType: AuditEventType;
    keyId: string;
    tenantId: string;
    serviceId?: string;
    userId?: string;
    action: string;
    result: 'success' | 'failure';
    metadata?: Record<string, any>;
    ipAddress?: string;
    hmacSignature: string;
}
export interface AuditLogFilters {
    tenantId?: string;
    keyId?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    serviceId?: string;
    userId?: string;
    result?: 'success' | 'failure';
    limit?: number;
    offset?: number;
}
export interface SecurityEvent {
    eventType: AuditEventType;
    keyId?: string;
    tenantId: string;
    serviceId?: string;
    userId?: string;
    action: string;
    result: 'success' | 'failure';
    metadata?: Record<string, any>;
    ipAddress?: string;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    cachedKeys: number;
}
export interface KeyFilters {
    status?: KeyStatus;
    purpose?: KeyPurpose;
    expiresAfter?: Date;
    expiresBefore?: Date;
    limit?: number;
    offset?: number;
}
export interface EncryptedBackup {
    version: string;
    timestamp: Date;
    tenantId: string;
    encryptedData: string;
    iv: string;
    authTag: string;
    keyCount: number;
    checksum: string;
}
export declare class KeyManagementError extends Error {
    code: KeyManagementErrorCode;
    keyId?: string | undefined;
    tenantId?: string | undefined;
    constructor(message: string, code: KeyManagementErrorCode, keyId?: string | undefined, tenantId?: string | undefined);
}
export interface EncryptionResultWithKeyRef {
    encryptedData: string;
    iv: string;
    authTag: string;
    keyId: string;
    keyVersion: number;
}
export interface EncryptionResultWithKeyRef {
    encryptedData: string;
    iv: string;
    authTag: string;
    keyId: string;
    keyVersion: number;
}
