-- Sponsorships run for a period, and a sponsor is owed an answer about
-- whether the advert was actually seen. Neither was recorded.

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startsAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Ad_position_active_idx" ON "Ad"("position", "active");

