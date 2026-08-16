-- Drop the dead Team.jerseyHome / Team.jerseyAway columns. They were written by
-- nothing and read by nothing (club identity colour is Team.primaryColor now).

ALTER TABLE "Team" DROP COLUMN "jerseyHome";
ALTER TABLE "Team" DROP COLUMN "jerseyAway";
