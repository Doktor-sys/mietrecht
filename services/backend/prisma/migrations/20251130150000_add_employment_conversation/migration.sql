-- CreateTable
CREATE TABLE "EmploymentConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "facts" JSONB NOT NULL,
    "legalIssues" JSONB NOT NULL,
    "urgency" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "legalReferences" JSONB NOT NULL,
    "actionRecommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmploymentConversation_userId_idx" ON "EmploymentConversation"("userId");

-- CreateIndex
CREATE INDEX "EmploymentConversation_category_idx" ON "EmploymentConversation"("category");

-- CreateIndex
CREATE INDEX "EmploymentConversation_createdAt_idx" ON "EmploymentConversation"("createdAt");

-- AddForeignKey
ALTER TABLE "EmploymentConversation" ADD CONSTRAINT "EmploymentConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;