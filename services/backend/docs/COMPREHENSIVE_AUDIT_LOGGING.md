# Comprehensive Audit Logging Documentation

## Overview

This document describes the comprehensive audit logging system implemented for the JurisMind Mietrecht application. The system provides enhanced security, compliance, and monitoring capabilities through blockchain-inspired integrity verification and detailed event tracking.

## Features

### 1. Enhanced Audit Logging with Blockchain-like Integrity

The enhanced audit logging system extends the basic audit functionality with:

- **Immutable Log Entries**: Each log entry includes cryptographic hashes for integrity verification
- **Blockchain-inspired Chain**: Log entries are chained together to detect tampering
- **Block-based Organization**: Related log entries are grouped into blocks with Merkle tree structures
- **Cryptographic Verification**: HMAC signatures ensure authenticity and integrity

### 2. Audit Chain Structure

#### EnhancedAuditLogEntry
```typescript
interface EnhancedAuditLogEntry extends AuditLogEntry {
  previousHash: string;  // Hash of the previous entry in the chain
  blockHash: string;     // Hash of the block this entry belongs to
  blockHeight: number;   // Height of the block this entry belongs to
}
```

#### AuditChainBlock
```typescript
interface AuditChainBlock {
  height: number;        // Block height
  hash: string;          // Block hash
  previousHash: string;  // Hash of the previous block
  timestamp: Date;       // Block creation timestamp
  logEntries: EnhancedAuditLogEntry[];  // Entries in this block
  merkleRoot: string;    // Merkle root of all entries
}
```

### 3. API Endpoints

#### Query Enhanced Logs
```
GET /api/audit/enhanced/logs
```
Query parameters:
- `userId`: Filter by user ID
- `eventType`: Filter by event type
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `blockHeight`: Filter by specific block height
- `minBlockHeight`: Filter by minimum block height
- `maxBlockHeight`: Filter by maximum block height
- `limit`: Maximum number of results (default: 100)
- `offset`: Result offset (default: 0)

#### Verify Audit Chain
```
POST /api/audit/enhanced/chain/verify
```
Verifies the integrity of the entire audit chain, checking:
- HMAC signatures of all entries
- Chain continuity (previousHash connections)
- Block integrity (merkle roots)

#### Detect Enhanced Anomalies
```
GET /api/audit/enhanced/anomalies
```
Query parameters:
- `startDate`: Required start date for analysis
- `endDate`: Required end date for analysis
- `tenantId`: Optional tenant ID filter

### 4. Cryptographic Security

#### HMAC Signature Generation
Each log entry is signed with an HMAC using SHA-256:
```typescript
const hmac = crypto
  .createHmac('sha256', hmacKey)
  .update(JSON.stringify(logData))
  .digest('hex');
```

#### Entry Hash Calculation
Each entry's hash is calculated as:
```typescript
const entryHash = crypto
  .createHash('sha256')
  .update(JSON.stringify(entryData))
  .digest('hex');
```

#### Block Hash Calculation
Each block's hash includes:
- Block height
- Previous block hash
- Timestamp
- Merkle root of entries

### 5. Data Integrity Verification

The system provides multiple layers of integrity verification:

1. **Entry-level HMAC verification**: Ensures each entry hasn't been tampered with
2. **Chain continuity verification**: Ensures no entries have been removed or reordered
3. **Block integrity verification**: Ensures blocks haven't been tampered with
4. **Merkle tree verification**: Ensures all entries in a block are accounted for

### 6. Compliance Features

#### GDPR Compliance
- Detailed tracking of all GDPR-related events:
  - Data export requests
  - Data deletion requests
  - Data correction requests
  - Consent management

#### Audit Trail Completeness
- Immutable record of all system activities
- Tamper-evident logging mechanism
- Long-term retention policies

#### Regulatory Reporting
- Automated compliance report generation
- Export capabilities in multiple formats (JSON, CSV)
- Detailed statistics on security events

## Implementation Details

### Database Schema

The enhanced audit logging uses a dedicated table structure:

```sql
CREATE TABLE "enhanced_audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "hmacSignature" TEXT NOT NULL,
    "previousHash" TEXT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockHeight" INTEGER NOT NULL,
    CONSTRAINT "enhanced_audit_logs_pkey" PRIMARY KEY ("id")
);
```

### Indexes for Performance

Multiple indexes ensure efficient querying:
- `(userId, timestamp)` - User activity queries
- `(tenantId, timestamp)` - Tenant-specific queries
- `(eventType, timestamp)` - Event type filtering
- `(timestamp)` - Time-based queries
- `(blockHeight, timestamp)` - Block-based queries

## Usage Examples

### Creating an Enhanced Log Entry
```typescript
const enhancedEntry = await enhancedAuditService.logEnhancedEvent(
  'user_login',
  userId,
  tenantId,
  'authentication',
  null,
  'login',
  'success',
  req.ip,
  req.get('User-Agent')
);
```

### Verifying Audit Chain Integrity
```typescript
const verificationResult = await enhancedAuditService.verifyAuditChain();
if (!verificationResult.isValid) {
  logger.error('Audit chain integrity violation:', verificationResult.message);
  // Trigger security alert
}
```

### Detecting Enhanced Anomalies
```typescript
const anomalies = await enhancedAuditService.detectEnhancedAnomalies(
  startDate,
  endDate,
  tenantId
);

anomalies.forEach(anomaly => {
  if (anomaly.anomalyType === 'audit_chain_integrity_violation') {
    // Critical security issue - immediate action required
    securityMonitoring.triggerAlert('critical', anomaly.description);
  }
});
```

## Security Considerations

### Key Management
- HMAC keys should be securely stored and rotated regularly
- Keys should be protected with appropriate access controls
- Consider using hardware security modules (HSM) for key storage

### Performance Impact
- Enhanced logging adds computational overhead for hashing
- Database storage requirements increase with additional fields
- Query performance is optimized through strategic indexing

### Monitoring and Maintenance
- Regular verification of audit chain integrity
- Monitoring for failed verification attempts
- Alerting on detected anomalies
- Backup and disaster recovery procedures for audit logs

## Future Enhancements

### Real-time Monitoring
- Stream processing for immediate anomaly detection
- WebSocket-based live audit feed
- Integration with SIEM systems

### Advanced Analytics
- Machine learning for anomaly detection
- Behavioral analysis for user activity patterns
- Predictive threat modeling

### External Integration
- Blockchain anchoring for additional immutability
- Integration with external audit systems
- Federation with partner organization audit trails