-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT,
    "accessToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integrations_type_idx" ON "integrations"("type");

-- CreateIndex
CREATE INDEX "integrations_isActive_idx" ON "integrations"("isActive");