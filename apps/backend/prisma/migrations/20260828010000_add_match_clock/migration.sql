-- CreateEnum
CREATE TYPE "MatchPeriod" AS ENUM ('PRE', 'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FULL_TIME');

-- AlterTable
ALTER TABLE "LiveMatchState" ADD COLUMN     "addedMinutes" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "period" "MatchPeriod" NOT NULL DEFAULT 'PRE',
ADD COLUMN     "periodBaseMinute" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "periodStartedAt" TIMESTAMP(3);

