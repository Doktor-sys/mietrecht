-- CreateTable
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

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_userId_timestamp_idx" ON "enhanced_audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_tenantId_timestamp_idx" ON "enhanced_audit_logs"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_eventType_timestamp_idx" ON "enhanced_audit_logs"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_resourceType_resourceId_idx" ON "enhanced_audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_timestamp_idx" ON "enhanced_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_result_timestamp_idx" ON "enhanced_audit_logs"("result", "timestamp");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_action_timestamp_idx" ON "enhanced_audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_blockHeight_timestamp_idx" ON "enhanced_audit_logs"("blockHeight", "timestamp");