-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE');

-- CreateTable
CREATE TABLE "Deal" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "valueCents" INTEGER NOT NULL DEFAULT 0,
    "stage" "DealStage" NOT NULL DEFAULT 'LEAD',
    "version" INTEGER NOT NULL DEFAULT 1,
    "expectedCloseDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "contactId" UUID,
    "companyId" UUID,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "contactId" UUID,
    "dealId" UUID,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_ownerId_createdAt_id_idx" ON "Deal"("ownerId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Deal_ownerId_stage_createdAt_id_idx" ON "Deal"("ownerId", "stage", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Deal_contactId_idx" ON "Deal"("contactId");

-- CreateIndex
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");

-- CreateIndex
CREATE INDEX "Deal_createdAt_id_idx" ON "Deal"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Activity_ownerId_occurredAt_id_idx" ON "Activity"("ownerId", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "Activity_contactId_occurredAt_id_idx" ON "Activity"("contactId", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "Activity_dealId_occurredAt_id_idx" ON "Activity"("dealId", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "Activity_occurredAt_id_idx" ON "Activity"("occurredAt", "id");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
