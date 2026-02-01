-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('pending', 'in_progress', 'completed', 'non_compliant');

-- CreateTable
CREATE TABLE "legal_updates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "impactAreas" TEXT[],
    "complianceRequirements" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "legalUpdateId" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL,
    "findings" TEXT[],
    "recommendations" TEXT[],
    "deadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legal_updates_category_idx" ON "legal_updates"("category");

-- CreateIndex
CREATE INDEX "legal_updates_jurisdiction_idx" ON "legal_updates"("jurisdiction");

-- CreateIndex
CREATE INDEX "legal_updates_severity_idx" ON "legal_updates"("severity");

-- CreateIndex
CREATE INDEX "legal_updates_effectiveDate_idx" ON "legal_updates"("effectiveDate");

-- CreateIndex
CREATE INDEX "compliance_checks_organizationId_idx" ON "compliance_checks"("organizationId");

-- CreateIndex
CREATE INDEX "compliance_checks_legalUpdateId_idx" ON "compliance_checks"("legalUpdateId");

-- CreateIndex
CREATE INDEX "compliance_checks_status_idx" ON "compliance_checks"("status");

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_legalUpdateId_fkey" FOREIGN KEY ("legalUpdateId") REFERENCES "legal_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;