-- AlterTable
ALTER TABLE "documents" ADD COLUMN "encryptionKeyId" TEXT;
ALTER TABLE "documents" ADD COLUMN "encryptionKeyVersion" INTEGER;

-- CreateIndex
CREATE INDEX "documents_encryptionKeyId_idx" ON "documents"("encryptionKeyId");
