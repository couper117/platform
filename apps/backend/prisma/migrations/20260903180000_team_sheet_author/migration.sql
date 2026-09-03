-- AlterTable
--
-- Who named the side. The eleven is the coach's decision, filed from the club
-- portal, but a reporter may also enter it from paper at the ground — and the two
-- were indistinguishable, so neither portal could say which it was looking at.
--
-- Nullable: every sheet written before this column existed has no answer, and
-- guessing one would be worse than admitting it. Additive only; no existing row
-- changes meaning and the migration cannot fail on existing data.
ALTER TABLE "MatchTeamSheet" ADD COLUMN "submittedById" INTEGER;

-- ON DELETE SET NULL: closing an account must not delete the team sheets of
-- matches that have already been played.
ALTER TABLE "MatchTeamSheet"
  ADD CONSTRAINT "MatchTeamSheet_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
