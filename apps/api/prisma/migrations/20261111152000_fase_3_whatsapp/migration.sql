-- CreateEnum
CREATE TYPE "WhatsAppChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('RECEIVED', 'QUEUED', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "phoneNormalized" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WhatsAppAccount" (
    "id" UUID NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "displayPhoneNumber" TEXT,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "channel" "WhatsAppChannel" NOT NULL DEFAULT 'WHATSAPP',
    "contactId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "body" TEXT NOT NULL,
    "externalId" TEXT,
    "clientMessageId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAccount_phoneNumberId_key" ON "WhatsAppAccount"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsAppAccount_ownerId_idx" ON "WhatsAppAccount"("ownerId");

-- CreateIndex
CREATE INDEX "Conversation_ownerId_lastMessageAt_id_idx" ON "Conversation"("ownerId", "lastMessageAt", "id");

-- CreateIndex
CREATE INDEX "Conversation_accountId_idx" ON "Conversation"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_contactId_channel_key" ON "Conversation"("contactId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalId_key" ON "Message"("externalId");

-- CreateIndex
CREATE INDEX "Message_conversationId_sentAt_id_idx" ON "Message"("conversationId", "sentAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_clientMessageId_key" ON "Message"("conversationId", "clientMessageId");

-- Backfill: normaliza telefones existentes antes da unicidade por dono
UPDATE "Contact"
SET "phoneNormalized" = NULLIF(regexp_replace("phone", '\D', '', 'g'), '')
WHERE "phone" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contact_ownerId_phoneNormalized_key" ON "Contact"("ownerId", "phoneNormalized");

-- AddForeignKey
ALTER TABLE "WhatsAppAccount" ADD CONSTRAINT "WhatsAppAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsAppAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
