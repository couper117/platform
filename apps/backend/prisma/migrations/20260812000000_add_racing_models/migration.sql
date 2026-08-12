-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Race" (
    "id" SERIAL NOT NULL,
    "sportId" INTEGER NOT NULL,
    "competitionId" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "discipline" VARCHAR(80),
    "distanceKm" DOUBLE PRECISION,
    "unit" VARCHAR(10),
    "date" TIMESTAMP(3),
    "status" "RaceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "results" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classification" (
    "id" SERIAL NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "identityLabel" VARCHAR(60),
    "valueColumns" JSONB NOT NULL DEFAULT '[]',
    "rows" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Race_sportId_idx" ON "Race"("sportId");

-- CreateIndex
CREATE UNIQUE INDEX "Classification_competitionId_key" ON "Classification"("competitionId");

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classification" ADD CONSTRAINT "Classification_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

