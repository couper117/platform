-- Admin ecosystem models (reporter profiles, notifications, favourites,
-- join requests, media records, AI model registry) and the per-account
-- capability columns on User.
--
-- These were applied with `prisma db push` while the migration chain was
-- unreplayable. With the chain repaired by 20260817110000, they belong here so a
-- fresh database reaches the same schema by migrating rather than by pushing.
-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('TEAM', 'RACING', 'COMBAT', 'RACKET');

-- CreateEnum
CREATE TYPE "ReporterAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('MATCH_UPCOMING', 'MATCH_STARTING', 'MATCH_RESULT', 'MATCH_UPDATE', 'MATCH_POSTPONED', 'MATCH_CANCELLED', 'LINEUP_PUBLISHED', 'FIXTURE_ASSIGNED', 'DOCUMENT_REVIEWED', 'ORGANISATION_STATUS', 'GENERAL');

-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('CLUB', 'SCHOOL', 'FEDERATION', 'SPORT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'AMASHURI_ADMIN';

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "idNumber" VARCHAR(60),
ADD COLUMN     "licenseNo" VARCHAR(60);

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Sport" ADD COLUMN     "type" "SportType" NOT NULL DEFAULT 'TEAM',
ALTER COLUMN "icon" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "district" VARCHAR(100),
ADD COLUMN     "primaryColor" VARCHAR(30),
ADD COLUMN     "registrationNo" VARCHAR(60),
ADD COLUMN     "secondaryColor" VARCHAR(30),
ADD COLUMN     "subscriptionActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "grantedCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" VARCHAR(128),
ADD COLUMN     "revokedCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ReporterProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sportIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "location" VARCHAR(200),
    "bio" TEXT,
    "yearsActive" SMALLINT,
    "availability" "ReporterAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "busyUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReporterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "anonToken" VARCHAR(64),
    "kind" "NotificationKind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "link" VARCHAR(300),
    "subjectType" VARCHAR(40),
    "subjectId" INTEGER,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER,
    "anonToken" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRequest" (
    "id" SERIAL NOT NULL,
    "kind" "RequestKind" NOT NULL,
    "organisation" VARCHAR(200) NOT NULL,
    "contactName" VARCHAR(200) NOT NULL,
    "contactEmail" VARCHAR(200) NOT NULL,
    "contactPhone" VARCHAR(50),
    "sportId" INTEGER,
    "details" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "bytes" INTEGER NOT NULL,
    "ownerType" VARCHAR(40) NOT NULL,
    "ownerId" INTEGER,
    "purpose" VARCHAR(40),
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "provider" VARCHAR(60) NOT NULL,
    "modelId" VARCHAR(120) NOT NULL,
    "purpose" VARCHAR(200),
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReporterProfile_userId_key" ON "ReporterProfile"("userId");

-- CreateIndex
CREATE INDEX "ReporterProfile_availability_idx" ON "ReporterProfile"("availability");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_anonToken_readAt_idx" ON "Notification"("anonToken", "readAt");

-- CreateIndex
CREATE INDEX "Notification_subjectType_subjectId_idx" ON "Notification"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "Favorite_anonToken_idx" ON "Favorite"("anonToken");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_teamId_userId_key" ON "Favorite"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_teamId_anonToken_key" ON "Favorite"("teamId", "anonToken");

-- CreateIndex
CREATE INDEX "PlatformRequest_status_idx" ON "PlatformRequest"("status");

-- CreateIndex
CREATE INDEX "Media_ownerType_ownerId_idx" ON "Media"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_name_key" ON "AiModel"("name");

-- AddForeignKey
ALTER TABLE "ReporterProfile" ADD CONSTRAINT "ReporterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRequest" ADD CONSTRAINT "PlatformRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

