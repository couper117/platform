-- Where a club lives on the rest of the internet. JSON rather than six columns
-- because the seventh network should not be a migration.
ALTER TABLE "Team" ADD COLUMN "socials" JSONB;
