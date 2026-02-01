-- CreateTable
CREATE TABLE "benchmarks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "industryAverage" DOUBLE PRECISION,
    "industryMedian" DOUBLE PRECISION,
    "industryMin" DOUBLE PRECISION,
    "industryMax" DOUBLE PRECISION,
    "percentile" DOUBLE PRECISION,
    "comparisonDate" TIMESTAMP(3) NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "benchmarks_name_idx" ON "benchmarks"("name");

-- CreateIndex
CREATE INDEX "benchmarks_category_idx" ON "benchmarks"("category");

-- CreateIndex
CREATE INDEX "benchmarks_jurisdiction_idx" ON "benchmarks"("jurisdiction");

-- CreateIndex
CREATE INDEX "benchmarks_comparisonDate_idx" ON "benchmarks"("comparisonDate");