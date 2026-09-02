-- CreateEnum
CREATE TYPE "DsrType" AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'OBJECTION', 'PORTABILITY', 'RESTRICTION');

-- CreateEnum
CREATE TYPE "DsrRelationship" AS ENUM ('SELF', 'PARENT_OR_GUARDIAN', 'LEGAL_REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "DsrStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "AkcPlayer" ADD COLUMN     "guardianConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guardianConsentAt" TIMESTAMP(3),
ADD COLUMN     "guardianName" VARCHAR(200);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" SERIAL NOT NULL,
    "type" "DsrType" NOT NULL,
    "subjectName" VARCHAR(200) NOT NULL,
    "subjectEmail" VARCHAR(200),
    "subjectPhone" VARCHAR(50),
    "relationship" "DsrRelationship" NOT NULL DEFAULT 'SELF',
    "details" TEXT,
    "status" "DsrStatus" NOT NULL DEFAULT 'RECEIVED',
    "handledBy" INTEGER,
    "responseNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_dueAt_idx" ON "DataSubjectRequest"("dueAt");

