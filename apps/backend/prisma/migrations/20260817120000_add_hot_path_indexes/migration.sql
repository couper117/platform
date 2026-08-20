-- Index hot foreign-key / query-path columns. Prisma does not auto-create
-- indexes on FK columns for PostgreSQL, so these were sequential scans at scale.

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

CREATE INDEX "AkcCompetition_sportId_idx" ON "AkcCompetition"("sportId");
CREATE INDEX "AkcFixture_competitionId_idx" ON "AkcFixture"("competitionId");
CREATE INDEX "AkcFixture_homeTeamId_idx" ON "AkcFixture"("homeTeamId");
CREATE INDEX "AkcFixture_awayTeamId_idx" ON "AkcFixture"("awayTeamId");
CREATE INDEX "AkcPlayer_teamId_idx" ON "AkcPlayer"("teamId");
CREATE INDEX "AkcTeam_schoolId_idx" ON "AkcTeam"("schoolId");
CREATE INDEX "AkcTeam_sportId_idx" ON "AkcTeam"("sportId");

CREATE INDEX "Competition_leagueId_idx" ON "Competition"("leagueId");

CREATE INDEX "Federation_sportId_idx" ON "Federation"("sportId");
CREATE INDEX "FederationAdminAssignment_userId_idx" ON "FederationAdminAssignment"("userId");

CREATE INDEX "Fixture_leagueId_idx" ON "Fixture"("leagueId");
CREATE INDEX "Fixture_homeTeamId_idx" ON "Fixture"("homeTeamId");
CREATE INDEX "Fixture_awayTeamId_idx" ON "Fixture"("awayTeamId");
CREATE INDEX "Fixture_competitionId_idx" ON "Fixture"("competitionId");

CREATE INDEX "League_sportId_idx" ON "League"("sportId");
CREATE INDEX "League_federationId_idx" ON "League"("federationId");
CREATE INDEX "LeagueAdminAssignment_userId_idx" ON "LeagueAdminAssignment"("userId");
CREATE INDEX "LeagueTeam_teamId_idx" ON "LeagueTeam"("teamId");

CREATE INDEX "MatchEvent_fixtureId_idx" ON "MatchEvent"("fixtureId");
CREATE INDEX "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");

CREATE INDEX "News_leagueId_idx" ON "News"("leagueId");
CREATE INDEX "News_sportId_idx" ON "News"("sportId");
CREATE INDEX "News_authorId_idx" ON "News"("authorId");

CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");
CREATE INDEX "PlayerDocument_playerId_idx" ON "PlayerDocument"("playerId");

CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "ReporterAssignment_userId_idx" ON "ReporterAssignment"("userId");

CREATE INDEX "Suspension_playerId_idx" ON "Suspension"("playerId");

CREATE INDEX "Team_sportId_idx" ON "Team"("sportId");
CREATE INDEX "TeamOfficial_teamId_idx" ON "TeamOfficial"("teamId");
CREATE INDEX "TeamRegistration_leagueId_idx" ON "TeamRegistration"("leagueId");

CREATE INDEX "TopScorer_leagueId_idx" ON "TopScorer"("leagueId");
CREATE INDEX "TopScorer_teamId_idx" ON "TopScorer"("teamId");

CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

CREATE INDEX "Transfer_playerId_idx" ON "Transfer"("playerId");
CREATE INDEX "Transfer_toTeamId_idx" ON "Transfer"("toTeamId");
CREATE INDEX "Transfer_fromTeamId_idx" ON "Transfer"("fromTeamId");
