-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICTION', 'PORTABILITY', 'OBJECTION');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('DATA_PROCESSING', 'ANALYTICS', 'MARKETING', 'THIRD_PARTY_SHARING', 'FUNCTIONAL', 'PERSONALIZATION');

-- CreateEnum
CREATE TYPE "DataBreachSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DPIAStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "dsgvo_data_subject_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestType" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestData" JSONB NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "dsgvo_data_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "consentText" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_breach_reports" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedUsers" INTEGER NOT NULL,
    "severity" "DataBreachSeverity" NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "notifiedAuthorities" BOOLEAN NOT NULL DEFAULT false,
    "notificationDate" TIMESTAMP(3),

    CONSTRAINT "data_breach_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpia_records" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conductedBy" TEXT NOT NULL,
    "stakeholders" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "mitigations" JSONB NOT NULL,
    "status" "DPIAStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),

    CONSTRAINT "dpia_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dsgvo_data_subject_requests_requestId_key" ON "dsgvo_data_subject_requests"("requestId");

-- CreateIndex
CREATE INDEX "dsgvo_data_subject_requests_userId_idx" ON "dsgvo_data_subject_requests"("userId");

-- CreateIndex
CREATE INDEX "dsgvo_data_subject_requests_requestType_idx" ON "dsgvo_data_subject_requests"("requestType");

-- CreateIndex
CREATE INDEX "dsgvo_data_subject_requests_status_idx" ON "dsgvo_data_subject_requests"("status");

-- CreateIndex
CREATE INDEX "dsgvo_data_subject_requests_createdAt_idx" ON "dsgvo_data_subject_requests"("createdAt");

-- CreateIndex
CREATE INDEX "consent_records_userId_idx" ON "consent_records"("userId");

-- CreateIndex
CREATE INDEX "consent_records_consentType_idx" ON "consent_records"("consentType");

-- CreateIndex
CREATE INDEX "consent_records_givenAt_idx" ON "consent_records"("givenAt");

-- CreateIndex
CREATE INDEX "consent_records_withdrawnAt_idx" ON "consent_records"("withdrawnAt");

-- CreateIndex
CREATE INDEX "data_breach_reports_severity_idx" ON "data_breach_reports"("severity");

-- CreateIndex
CREATE INDEX "data_breach_reports_reportedAt_idx" ON "data_breach_reports"("reportedAt");

-- CreateIndex
CREATE INDEX "data_breach_reports_resolvedAt_idx" ON "data_breach_reports"("resolvedAt");

-- CreateIndex
CREATE INDEX "dpia_records_status_idx" ON "dpia_records"("status");

-- CreateIndex
CREATE INDEX "dpia_records_createdAt_idx" ON "dpia_records"("createdAt");

-- CreateIndex
CREATE INDEX "dpia_records_completedAt_idx" ON "dpia_records"("completedAt");

-- AddForeignKey
ALTER TABLE "dsgvo_data_subject_requests" ADD CONSTRAINT "dsgvo_data_subject_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;