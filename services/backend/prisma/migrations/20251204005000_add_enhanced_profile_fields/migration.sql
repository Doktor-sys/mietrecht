-- AlterTable
ALTER TABLE "user_preferences" 
ADD COLUMN IF NOT EXISTS "accessibility" JSONB,
ADD COLUMN IF NOT EXISTS "legalTopics" JSONB,
ADD COLUMN IF NOT EXISTS "frequentDocuments" JSONB,
ADD COLUMN IF NOT EXISTS "alerts" JSONB;