-- A player's recorded numbers for one season. See the model's doc comment: football
-- derives its sheet from MatchEvent and Lineup, but the platform records no box
-- score, so basketball's points/rebounds/assists have to be entered and stored.
CREATE TABLE "PlayerSeasonStat" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "season" VARCHAR(20) NOT NULL,
    "leagueId" INTEGER,
    "stats" JSONB NOT NULL,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerSeasonStat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlayerSeasonStat_playerId_season_key" ON "PlayerSeasonStat"("playerId", "season");
CREATE INDEX "PlayerSeasonStat_playerId_idx" ON "PlayerSeasonStat"("playerId");

ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
