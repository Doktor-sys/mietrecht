-- CreateTable
CREATE TABLE "legal_trends" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "trendType" "TrendType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "source" TEXT,
    "sourceUrl" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_trends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legal_trends_category_idx" ON "legal_trends"("category");

-- CreateIndex
CREATE INDEX "legal_trends_jurisdiction_idx" ON "legal_trends"("jurisdiction");

-- CreateIndex
CREATE INDEX "legal_trends_relevanceScore_idx" ON "legal_trends"("relevanceScore");

-- CreateIndex
CREATE INDEX "legal_trends_trendType_idx" ON "legal_trends"("trendType");

-- CreateIndex
CREATE INDEX "legal_trends_startDate_idx" ON "legal_trends"("startDate");

-- CreateEnum
CREATE TYPE "TrendType" AS ENUM ('emerging', 'established', 'declining');