-- RNSP (Rwanda National Sports Platform) 
-- Full Database Schema for PostgreSQL / Supabase
-- Generated: 2026-05-24

-- 1. CREATE ENUMS
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER', 'PUBLIC');
CREATE TYPE "SportCategory" AS ENUM ('FIELD', 'COURT', 'TRACK', 'WATER', 'COMBAT', 'RACKET', 'OTHER');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'MIXED', 'DISABLED');
CREATE TYPE "AgeCategory" AS ENUM ('SENIOR', 'U20', 'U17', 'U15', 'U13', 'JUNIOR', 'VETERAN', 'ALL');
CREATE TYPE "CompLevel" AS ENUM ('NATIONAL', 'REGIONAL', 'DISTRICT', 'SCHOOL');
CREATE TYPE "LeagueFormat" AS ENUM ('LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT', 'ROUND_ROBIN');
CREATE TYPE "LeagueStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'SUSPENDED');
CREATE TYPE "TeamStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');
CREATE TYPE "PlayerSkill" AS ENUM ('ELITE', 'PROFESSIONAL', 'SEMI_PROFESSIONAL', 'AMATEUR');
CREATE TYPE "PlayerGender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "PlayerStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');
CREATE TYPE "DocType" AS ENUM ('BIRTH_CERTIFICATE', 'PASSPORT', 'NATIONAL_ID', 'MEDICAL', 'OTHER');
CREATE TYPE "DocStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "RoundType" AS ENUM ('GROUP', 'KNOCKOUT', 'FINAL', 'SEMI_FINAL', 'QUARTER_FINAL', 'REGULAR');
CREATE TYPE "FixtureStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'POSTPONED', 'CANCELLED');
CREATE TYPE "EventType" AS ENUM ('GOAL', 'OWN_GOAL', 'PENALTY', 'RED_CARD', 'YELLOW_CARD', 'SUBSTITUTION', 'INJURY', 'VAR', 'KICKOFF', 'HALFTIME', 'FULLTIME', 'EXTRA_TIME');
CREATE TYPE "TransferType" AS ENUM ('PERMANENT', 'LOAN', 'FREE', 'RETURN_FROM_LOAN');
CREATE TYPE "RegStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "NewsCategory" AS ENUM ('NEWS', 'ANNOUNCEMENT', 'RESULT', 'TRANSFER', 'INJURY', 'OTHER');
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'REPLIED');
CREATE TYPE "SchoolCategory" AS ENUM ('SECONDARY', 'TVET', 'PRIMARY');
CREATE TYPE "AkcGender" AS ENUM ('MALE', 'FEMALE', 'MIXED', 'INCLUSIVE');
CREATE TYPE "AkcAgeCategory" AS ENUM ('U13', 'U15', 'U17', 'U20', 'OPEN');
CREATE TYPE "AkcLevel" AS ENUM ('CELL', 'SECTOR', 'DISTRICT', 'PROVINCE', 'NATIONAL');
CREATE TYPE "AkcIdType" AS ENUM ('NATIONAL_ID', 'BIRTH_CERT', 'PASSPORT');
CREATE TYPE "AkcCompStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AkcStage" AS ENUM ('GROUP', 'ROUND16', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL', 'THIRD_PLACE');
CREATE TYPE "AkcFixtureStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'POSTPONED', 'CANCELLED');
CREATE TYPE "AkcAnnouncementCategory" AS ENUM ('GENERAL', 'REGISTRATION', 'COMPETITION', 'RESULTS', 'URGENT');

-- 2. CREATE TABLES
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "skey" VARCHAR(100) NOT NULL,
    "sval" TEXT,
    "label" VARCHAR(200),
    "grp" VARCHAR(80) NOT NULL DEFAULT 'general',
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(80) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200),
    "phone" VARCHAR(50),
    "role" "Role" NOT NULL DEFAULT 'PUBLIC',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar" VARCHAR(300),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sport" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(170),
    "icon" VARCHAR(10) NOT NULL DEFAULT '🏅',
    "description" TEXT,
    "coverImage" VARCHAR(300),
    "category" "SportCategory" NOT NULL DEFAULT 'OTHER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Federation" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "abbreviation" VARCHAR(20),
    "sportId" INTEGER,
    "logo" VARCHAR(300),
    "description" TEXT,
    "website" VARCHAR(300),
    "email" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Federation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "League" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220),
    "sportId" INTEGER NOT NULL,
    "federationId" INTEGER,
    "season" VARCHAR(50) NOT NULL DEFAULT '2025/2026',
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "ageCategory" "AgeCategory" NOT NULL DEFAULT 'SENIOR',
    "level" "CompLevel" NOT NULL DEFAULT 'NATIONAL',
    "format" "LeagueFormat" NOT NULL DEFAULT 'LEAGUE',
    "status" "LeagueStatus" NOT NULL DEFAULT 'UPCOMING',
    "maxTeams" INTEGER NOT NULL DEFAULT 16,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "adminUserId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeagueAdmin" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeagueAdmin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "shortName" VARCHAR(10),
    "slug" VARCHAR(220),
    "sportId" INTEGER,
    "logo" VARCHAR(300),
    "jerseyHome" VARCHAR(10),
    "jerseyAway" VARCHAR(10),
    "foundedYear" INTEGER,
    "homeVenue" VARCHAR(300),
    "city" VARCHAR(150),
    "province" VARCHAR(100),
    "description" TEXT,
    "email" VARCHAR(200),
    "phone" VARCHAR(50),
    "website" VARCHAR(300),
    "managerUserId" INTEGER,
    "status" "TeamStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeagueTeam" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeagueTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "photo" VARCHAR(300),
    "dateOfBirth" DATE,
    "nationality" VARCHAR(100) NOT NULL DEFAULT 'Rwandan',
    "position" VARCHAR(100),
    "jerseyNumber" SMALLINT,
    "skillLevel" "PlayerSkill" NOT NULL DEFAULT 'AMATEUR',
    "gender" "PlayerGender" NOT NULL DEFAULT 'MALE',
    "height" INTEGER,
    "weight" INTEGER,
    "bio" TEXT,
    "status" "PlayerStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerDocument" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "docType" "DocType" NOT NULL,
    "filename" VARCHAR(300) NOT NULL,
    "originalName" VARCHAR(300),
    "fileSize" INTEGER,
    "mimeType" VARCHAR(100),
    "status" "DocStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedBy" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "city" VARCHAR(150),
    "province" VARCHAR(100),
    "capacity" INTEGER,
    "surface" VARCHAR(100),
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Competition" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "roundType" "RoundType" NOT NULL DEFAULT 'REGULAR',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Fixture" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "competitionId" INTEGER,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "matchday" SMALLINT NOT NULL DEFAULT 1,
    "venue" VARCHAR(300),
    "matchDate" TIMESTAMP(3),
    "status" "FixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" SMALLINT,
    "awayScore" SMALLINT,
    "homeScoreHt" SMALLINT,
    "awayScoreHt" SMALLINT,
    "attendance" INTEGER,
    "referee" VARCHAR(200),
    "matchNotes" TEXT,
    "streamUrl" VARCHAR(500),
    "streamActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchEvent" (
    "id" SERIAL NOT NULL,
    "fixtureId" INTEGER NOT NULL,
    "playerId" INTEGER,
    "player2Id" INTEGER,
    "teamId" INTEGER,
    "eventType" "EventType" NOT NULL,
    "minute" SMALLINT,
    "extraTime" SMALLINT NOT NULL DEFAULT 0,
    "description" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lineup" (
    "id" SERIAL NOT NULL,
    "fixtureId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "position" VARCHAR(50),
    "jerseyNo" SMALLINT,
    "isStarter" BOOLEAN NOT NULL DEFAULT true,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Lineup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiveMatchState" (
    "fixtureId" INTEGER NOT NULL,
    "minute" SMALLINT NOT NULL DEFAULT 0,
    "homeScore" SMALLINT NOT NULL DEFAULT 0,
    "awayScore" SMALLINT NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'live',
    "lastEvent" VARCHAR(300),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LiveMatchState_pkey" PRIMARY KEY ("fixtureId")
);

CREATE TABLE "Standing" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "form" VARCHAR(20) NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Standing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopScorer" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopScorer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "fromTeamId" INTEGER,
    "toTeamId" INTEGER NOT NULL,
    "transferDate" DATE,
    "transferType" "TransferType" NOT NULL DEFAULT 'PERMANENT',
    "fee" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamRegistration" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "status" "RegStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    "notes" TEXT,
    CONSTRAINT "TeamRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "News" (
    "id" SERIAL NOT NULL,
    "sportId" INTEGER,
    "leagueId" INTEGER,
    "title" VARCHAR(300) NOT NULL,
    "slug" VARCHAR(320),
    "excerpt" TEXT,
    "body" TEXT,
    "coverImage" VARCHAR(300),
    "authorId" INTEGER,
    "category" "NewsCategory" NOT NULL DEFAULT 'NEWS',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200),
    "phone" VARCHAR(50),
    "subject" VARCHAR(300),
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT,
    "metaDesc" VARCHAR(300),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" VARCHAR(200) NOT NULL,
    "detail" TEXT,
    "module" VARCHAR(80),
    "ip" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkcSchool" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "shortName" VARCHAR(50),
    "code" VARCHAR(50),
    "category" "SchoolCategory" NOT NULL DEFAULT 'SECONDARY',
    "provinceId" INTEGER,
    "districtId" INTEGER,
    "sector" VARCHAR(100),
    "address" TEXT,
    "headTeacher" VARCHAR(200),
    "coordinator" VARCHAR(200),
    "coordPhone" VARCHAR(50),
    "coordEmail" VARCHAR(200),
    "phone" VARCHAR(50),
    "email" VARCHAR(200),
    "logo" VARCHAR(300),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AkcSchool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkcTeam" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "sportId" INTEGER NOT NULL,
    "gender" "AkcGender" NOT NULL DEFAULT 'MALE',
    "ageCategory" "AkcAgeCategory" NOT NULL DEFAULT 'U17',
    "level" "AkcLevel" NOT NULL DEFAULT 'NATIONAL',
    "coachName" VARCHAR(200),
    "coachPhone" VARCHAR(50),
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AkcTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkcPlayer" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "dob" DATE,
    "gender" "PlayerGender" NOT NULL DEFAULT 'MALE',
    "ageCategory" "AkcAgeCategory" NOT NULL DEFAULT 'U17',
    "position" VARCHAR(100),
    "jersey" SMALLINT,
    "idNumber" VARCHAR(100),
    "idType" "AkcIdType" NOT NULL DEFAULT 'NATIONAL_ID',
    "docVerified" BOOLEAN NOT NULL DEFAULT false,
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityType" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AkcPlayer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkcCompetition" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "edition" VARCHAR(50),
    "sportId" INTEGER,
    "gender" TEXT NOT NULL DEFAULT 'mixed',
    "ageCategory" TEXT NOT NULL DEFAULT 'Open',
    "level" "AkcLevel" NOT NULL DEFAULT 'NATIONAL',
    "startDate" DATE,
    "endDate" DATE,
    "venue" VARCHAR(200),
    "status" "AkcCompStatus" NOT NULL DEFAULT 'UPCOMING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AkcCompetition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkcFixture" (
    "id" SERIAL NOT NULL,
    "competitionId" INTEGER,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "matchDate" TIMESTAMP(3),
    "venue" VARCHAR(200),
    "round" VARCHAR(100),
    "stage" "AkcStage" NOT NULL DEFAULT 'GROUP',
    "status" "AkcFixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "winnerTeamId" INTEGER,
    "isDraw" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AkcFixture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkcStanding" (
    "id" SERIAL NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "gf" INTEGER NOT NULL DEFAULT 0,
    "ga" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AkcStanding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkcAnnouncement" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "body" TEXT NOT NULL,
    "category" "AkcAnnouncementCategory" NOT NULL DEFAULT 'GENERAL',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AkcAnnouncement_pkey" PRIMARY KEY ("id")
);

-- 3. CREATE INDEXES
CREATE UNIQUE INDEX "Setting_skey_key" ON "Setting"("skey");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE UNIQUE INDEX "Sport_name_key" ON "Sport"("name");
CREATE UNIQUE INDEX "Team_managerUserId_key" ON "Team"("managerUserId");
CREATE UNIQUE INDEX "LeagueTeam_leagueId_teamId_key" ON "LeagueTeam"("leagueId", "teamId");
CREATE UNIQUE INDEX "Lineup_fixtureId_playerId_key" ON "Lineup"("fixtureId", "playerId");
CREATE UNIQUE INDEX "Standing_leagueId_teamId_key" ON "Standing"("leagueId", "teamId");
CREATE UNIQUE INDEX "TopScorer_playerId_key" ON "TopScorer"("playerId");
CREATE UNIQUE INDEX "TeamRegistration_teamId_leagueId_key" ON "TeamRegistration"("teamId", "leagueId");
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE UNIQUE INDEX "AkcStanding_competitionId_teamId_key" ON "AkcStanding"("competitionId", "teamId");

-- 4. ADD FOREIGN KEYS
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Federation" ADD CONSTRAINT "Federation_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "League" ADD CONSTRAINT "League_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "League" ADD CONSTRAINT "League_federationId_fkey" FOREIGN KEY ("federationId") REFERENCES "Federation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeagueAdmin" ADD CONSTRAINT "LeagueAdmin_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeagueTeam" ADD CONSTRAINT "LeagueTeam_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeagueTeam" ADD CONSTRAINT "LeagueTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerDocument" ADD CONSTRAINT "PlayerDocument_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lineup" ADD CONSTRAINT "Lineup_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lineup" ADD CONSTRAINT "Lineup_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveMatchState" ADD CONSTRAINT "LiveMatchState_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopScorer" ADD CONSTRAINT "TopScorer_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopScorer" ADD CONSTRAINT "TopScorer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopScorer" ADD CONSTRAINT "TopScorer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamRegistration" ADD CONSTRAINT "TeamRegistration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamRegistration" ADD CONSTRAINT "TeamRegistration_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "News" ADD CONSTRAINT "News_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AkcTeam" ADD CONSTRAINT "AkcTeam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "AkcSchool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AkcPlayer" ADD CONSTRAINT "AkcPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "AkcTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AkcFixture" ADD CONSTRAINT "AkcFixture_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "AkcCompetition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AkcFixture" ADD CONSTRAINT "AkcFixture_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "AkcTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AkcFixture" ADD CONSTRAINT "AkcFixture_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "AkcTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AkcStanding" ADD CONSTRAINT "AkcStanding_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "AkcCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AkcStanding" ADD CONSTRAINT "AkcStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "AkcTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
