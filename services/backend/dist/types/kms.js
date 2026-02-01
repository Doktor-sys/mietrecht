"use strict";
/**
 * Key Management System (KMS) Types and Interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyManagementError = exports.KeyManagementErrorCode = exports.AuditEventType = exports.KeyStatus = exports.KeyPurpose = void 0;
// ============================================
// Enums
// ============================================
var KeyPurpose;
(function (KeyPurpose) {
    KeyPurpose["DATA_ENCRYPTION"] = "data_encryption";
    KeyPurpose["DOCUMENT_ENCRYPTION"] = "document_encryption";
    KeyPurpose["FIELD_ENCRYPTION"] = "field_encryption";
    KeyPurpose["BACKUP_ENCRYPTION"] = "backup_encryption";
    KeyPurpose["API_KEY_ENCRYPTION"] = "api_key_encryption";
})(KeyPurpose || (exports.KeyPurpose = KeyPurpose = {}));
var KeyStatus;
(function (KeyStatus) {
    KeyStatus["ACTIVE"] = "active";
    KeyStatus["DEPRECATED"] = "deprecated";
    KeyStatus["DISABLED"] = "disabled";
    KeyStatus["COMPROMISED"] = "compromised";
    KeyStatus["DELETED"] = "deleted";
})(KeyStatus || (exports.KeyStatus = KeyStatus = {}));
var AuditEventType;
(function (AuditEventType) {
    AuditEventType["KEY_CREATED"] = "key_created";
    AuditEventType["KEY_ACCESSED"] = "key_accessed";
    AuditEventType["KEY_ROTATED"] = "key_rotated";
    AuditEventType["KEY_STATUS_CHANGED"] = "key_status_changed";
    AuditEventType["KEY_DELETED"] = "key_deleted";
    AuditEventType["SECURITY_ALERT"] = "security_alert";
    AuditEventType["UNAUTHORIZED_ACCESS"] = "unauthorized_access";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
var KeyManagementErrorCode;
(function (KeyManagementErrorCode) {
    KeyManagementErrorCode["KEY_NOT_FOUND"] = "KEY_NOT_FOUND";
    KeyManagementErrorCode["KEY_EXPIRED"] = "KEY_EXPIRED";
    KeyManagementErrorCode["KEY_DISABLED"] = "KEY_DISABLED";
    KeyManagementErrorCode["KEY_COMPROMISED"] = "KEY_COMPROMISED";
    KeyManagementErrorCode["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    KeyManagementErrorCode["INVALID_TENANT"] = "INVALID_TENANT";
    KeyManagementErrorCode["MASTER_KEY_ERROR"] = "MASTER_KEY_ERROR";
    KeyManagementErrorCode["ROTATION_FAILED"] = "ROTATION_FAILED";
    KeyManagementErrorCode["ENCRYPTION_FAILED"] = "ENCRYPTION_FAILED";
    KeyManagementErrorCode["DECRYPTION_FAILED"] = "DECRYPTION_FAILED";
    KeyManagementErrorCode["CACHE_ERROR"] = "CACHE_ERROR";
    KeyManagementErrorCode["AUDIT_LOG_ERROR"] = "AUDIT_LOG_ERROR";
})(KeyManagementErrorCode || (exports.KeyManagementErrorCode = KeyManagementErrorCode = {}));
// ============================================
// Error Class
// ============================================
class KeyManagementError extends Error {
    constructor(message, code, keyId, tenantId) {
        super(message);
        this.code = code;
        this.keyId = keyId;
        this.tenantId = tenantId;
        this.name = 'KeyManagementError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.KeyManagementError = KeyManagementError;
