-- CreateTable
CREATE TABLE "encryption_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "encryptedKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotation_schedules" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "intervalDays" INTEGER NOT NULL,
    "nextRotationAt" TIMESTAMP(3) NOT NULL,
    "lastRotationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotation_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_audit_logs" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "serviceId" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "hmacSignature" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_key_config" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_key_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encryption_keys_tenantId_status_idx" ON "encryption_keys"("tenantId", "status");

-- CreateIndex
CREATE INDEX "encryption_keys_status_idx" ON "encryption_keys"("status");

-- CreateIndex
CREATE INDEX "encryption_keys_expiresAt_idx" ON "encryption_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "encryption_keys_purpose_idx" ON "encryption_keys"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "encryption_keys_tenantId_purpose_version_key" ON "encryption_keys"("tenantId", "purpose", "version");

-- CreateIndex
CREATE UNIQUE INDEX "rotation_schedules_keyId_key" ON "rotation_schedules"("keyId");

-- CreateIndex
CREATE INDEX "rotation_schedules_nextRotationAt_enabled_idx" ON "rotation_schedules"("nextRotationAt", "enabled");

-- CreateIndex
CREATE INDEX "key_audit_logs_keyId_timestamp_idx" ON "key_audit_logs"("keyId", "timestamp");

-- CreateIndex
CREATE INDEX "key_audit_logs_tenantId_timestamp_idx" ON "key_audit_logs"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "key_audit_logs_eventType_timestamp_idx" ON "key_audit_logs"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "key_audit_logs_timestamp_idx" ON "key_audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "rotation_schedules" ADD CONSTRAINT "rotation_schedules_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "encryption_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_audit_logs" ADD CONSTRAINT "key_audit_logs_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "encryption_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
