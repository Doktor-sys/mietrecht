-- Migration für Bulk Processing Features

-- Erweitere Document-Tabelle für B2B-Support
ALTER TABLE "documents" 
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "metadata" JSONB,
ALTER COLUMN "userId" DROP NOT NULL;

-- Füge Foreign Key für Organization hinzu
ALTER TABLE "documents" 
ADD CONSTRAINT "documents_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- Erstelle Index für bessere Performance bei B2B-Abfragen
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");
CREATE INDEX "batch_jobs_organizationId_status_idx" ON "batch_jobs"("organizationId", "status");
CREATE INDEX "api_requests_apiKeyId_createdAt_idx" ON "api_requests"("apiKeyId", "createdAt");

-- Aktualisiere DocumentAnalysis für vereinfachte JSON-Struktur
ALTER TABLE "document_analyses" 
DROP CONSTRAINT IF EXISTS "document_analyses_analysisId_fkey",
ADD COLUMN "issues_json" JSONB,
ADD COLUMN "recommendations_json" JSONB,
ALTER COLUMN "riskLevel" TYPE TEXT;

-- Migriere bestehende Issues und Recommendations zu JSON
UPDATE "document_analyses" 
SET "issues_json" = '[]'::jsonb, 
    "recommendations_json" = '[]'::jsonb
WHERE "issues_json" IS NULL;

-- Entferne separate Issues und Recommendations Tabellen für B2B (optional)
-- DROP TABLE IF EXISTS "issues";
-- DROP TABLE IF EXISTS "recommendations";