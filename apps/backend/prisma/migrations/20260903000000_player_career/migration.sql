-- A player's club history before this platform. See the model's doc comment for
-- why Transfer cannot hold it: Transfer points at two rows in our own Team table,
-- so a signing from a club that is not on the platform has nothing to point at.
CREATE TABLE "PlayerCareer" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "club" VARCHAR(200) NOT NULL,
    "country" VARCHAR(100),
    "fromYear" SMALLINT,
    "toYear" SMALLINT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCareer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlayerCareer_playerId_idx" ON "PlayerCareer"("playerId");

ALTER TABLE "PlayerCareer" ADD CONSTRAINT "PlayerCareer_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
