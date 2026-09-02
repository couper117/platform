-- Repair: create tables that no migration ever created.
--
-- 20260817120000_add_hot_path_indexes builds indexes on Suspension, Transaction
-- and others, but nothing in the chain ever created those tables, so replaying
-- the migrations failed there. It went unnoticed because the database in use was
-- built with `prisma db push`, which reads schema.prisma directly and never
-- replays migrations at all -- so `migrate deploy` was broken for a fresh
-- database while everything looked fine locally.
--
-- This runs immediately before that index migration so the chain replays. The
-- definitions used are the current ones, which is exact here: no migration in
-- the chain ever altered any of these five tables.

-- Enums
CREATE TYPE "OfficialRole" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_DOCTOR', 'OTHER');

CREATE TYPE "SuspensionReason" AS ENUM ('RED_CARD', 'YELLOW_ACCUMULATION', 'MISCONDUCT', 'OTHER');

CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');


-- Tables
CREATE TABLE "TeamOfficial" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "role" "OfficialRole" NOT NULL DEFAULT 'OTHER',
    "fullName" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(200),
    "idNumber" VARCHAR(60),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamOfficial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Suspension" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "reason" "SuspensionReason" NOT NULL DEFAULT 'RED_CARD',
    "matches" INTEGER NOT NULL DEFAULT 1,
    "matchesServed" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "originFixtureId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchTeamSheet" (
    "id" SERIAL NOT NULL,
    "fixtureId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "formation" VARCHAR(20),
    "coachName" VARCHAR(200),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchTeamSheet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchStat" (
    "id" SERIAL NOT NULL,
    "fixtureId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "possession" INTEGER,
    "shots" INTEGER,
    "shotsOnTarget" INTEGER,
    "shotsInsideBox" INTEGER,
    "shotsOutsideBox" INTEGER,
    "corners" INTEGER,
    "offsides" INTEGER,
    "fouls" INTEGER,
    "yellowCards" INTEGER,
    "redCards" INTEGER,
    "gkSaves" INTEGER,
    "passAccuracy" INTEGER,
    "xg" DECIMAL(4,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchStat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'SUBSCRIPTION',
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
    "reference" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchTeamSheet_fixtureId_teamId_key" ON "MatchTeamSheet"("fixtureId", "teamId");

CREATE UNIQUE INDEX "MatchStat_fixtureId_teamId_key" ON "MatchStat"("fixtureId", "teamId");

CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");


-- Foreign keys
ALTER TABLE "TeamOfficial" ADD CONSTRAINT "TeamOfficial_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Suspension" ADD CONSTRAINT "Suspension_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchTeamSheet" ADD CONSTRAINT "MatchTeamSheet_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchStat" ADD CONSTRAINT "MatchStat_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

