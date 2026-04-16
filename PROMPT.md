# RNSP — Full-Stack Rebuild Prompt
## React (Vite) Frontend + Express.js Backend
### Rwanda National Sports Platform

---

## 🎯 PROJECT OVERVIEW

You are building **RNSP (Rwanda National Sports Platform)** — a full-stack, production-grade sports management platform for Rwanda. The backend is **Express.js with PostgreSQL (or MySQL)**. The frontend is **React (Vite) with Tailwind CSS**. The system manages national sports leagues, fixtures, live scores, standings, teams, players, documents, news, and an integrated interschool competition module called **AKC3 (Amashuri Kagame Cup)**.

The live PHP system already exists. Your job is to rebuild it completely using modern JavaScript full-stack architecture — keeping every single feature, improving the UI/UX, and making it production-ready.

---

## 🏗️ TECH STACK

### Backend
```
Runtime:     Node.js 20+
Framework:   Express.js 4.x
Database:    PostgreSQL 15+ (or MySQL 8+)
ORM:         Prisma (preferred) or Sequelize
Auth:        JWT (access token 15min + refresh token 7d, stored in httpOnly cookies)
File Upload: Multer + Sharp (image compression/resize)
Real-time:   Socket.IO (live match scores, live events feed)
Email:       Nodemailer (SMTP)
Validation:  Zod
Security:    Helmet, express-rate-limit, cors, bcrypt (cost factor 12)
Docs:        Swagger (OpenAPI 3.0)
```

### Frontend
```
Framework:   React 18 + Vite 5
Routing:     React Router v6 (file-based via convention)
State:       Zustand (global) + React Query / TanStack Query v5 (server state)
Styling:     Tailwind CSS v3 + shadcn/ui components
Fonts:       Bebas Neue (display) + DM Sans (body) — Google Fonts
Animations:  Framer Motion 11
Icons:       Lucide React + custom SVG sports icons
Charts:      Recharts (standings, stats)
Real-time:   Socket.IO client
Forms:       React Hook Form + Zod
Image:       Next/Image equivalent via lazy loading + blur placeholder
```

### Infrastructure
```
API Base:    /api/v1/
Port:        Backend 5000, Frontend 5173 (dev)
Auth Header: Bearer <JWT> OR httpOnly cookie
CORS:        Configured for frontend origin
Static:      /uploads/ served by Express (production: CDN)
```

---

## 📁 PROJECT STRUCTURE

```
rnsp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # Database connection (Prisma client)
│   │   │   ├── env.js           # Validated env vars (zod)
│   │   │   ├── cors.js          # CORS config
│   │   │   └── socket.js        # Socket.IO setup
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify, role check
│   │   │   ├── upload.js        # Multer config (images + docs)
│   │   │   ├── validate.js      # Zod request validation
│   │   │   ├── rateLimit.js     # Rate limiting per route
│   │   │   └── errorHandler.js  # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── sports.routes.js
│   │   │   ├── leagues.routes.js
│   │   │   ├── teams.routes.js
│   │   │   ├── players.routes.js
│   │   │   ├── fixtures.routes.js
│   │   │   ├── results.routes.js
│   │   │   ├── standings.routes.js
│   │   │   ├── news.routes.js
│   │   │   ├── documents.routes.js
│   │   │   ├── transfers.routes.js
│   │   │   ├── venues.routes.js
│   │   │   ├── federations.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── settings.routes.js
│   │   │   ├── contacts.routes.js
│   │   │   ├── activity.routes.js
│   │   │   └── akc3/
│   │   │       ├── schools.routes.js
│   │   │       ├── akc3Teams.routes.js
│   │   │       ├── akc3Players.routes.js
│   │   │       ├── competitions.routes.js
│   │   │       ├── akc3Fixtures.routes.js
│   │   │       ├── akc3Standings.routes.js
│   │   │       └── announcements.routes.js
│   │   ├── controllers/         # One controller per route file
│   │   ├── services/            # Business logic layer
│   │   │   ├── standings.service.js   # Auto-recalculate standings
│   │   │   ├── liveMatch.service.js   # Socket.IO live events
│   │   │   └── document.service.js    # Secure document handling
│   │   ├── utils/
│   │   │   ├── slugify.js
│   │   │   ├── paginate.js
│   │   │   ├── jwt.js
│   │   │   └── sendMail.js
│   │   └── app.js               # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma        # Full schema (see below)
│   │   └── seed.js              # Seed file with sample data
│   └── server.js                # Entry point
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.js        # Axios instance (interceptors, refresh token)
    │   │   └── endpoints/       # One file per domain
    │   ├── components/
    │   │   ├── ui/              # shadcn/ui base components
    │   │   ├── layout/
    │   │   │   ├── PublicLayout.jsx
    │   │   │   ├── AdminLayout.jsx
    │   │   │   └── TeamLayout.jsx
    │   │   ├── shared/
    │   │   │   ├── FixtureCard.jsx
    │   │   │   ├── LeagueCard.jsx
    │   │   │   ├── StandingsTable.jsx
    │   │   │   ├── PlayerCard.jsx
    │   │   │   ├── NewsCard.jsx
    │   │   │   ├── LiveBadge.jsx
    │   │   │   ├── SportChip.jsx
    │   │   │   ├── StatusBadge.jsx
    │   │   │   ├── FilterBar.jsx
    │   │   │   ├── Skeleton.jsx
    │   │   │   ├── Pagination.jsx
    │   │   │   └── FormField.jsx
    │   │   ├── home/
    │   │   │   ├── Hero.jsx
    │   │   │   ├── LiveScoreBoard.jsx
    │   │   │   ├── QuickAccessGrid.jsx
    │   │   │   ├── FeaturedMatch.jsx
    │   │   │   └── StatsBanner.jsx
    │   │   ├── admin/
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── Topbar.jsx
    │   │   │   ├── StatCard.jsx
    │   │   │   ├── DataTable.jsx
    │   │   │   ├── DocumentViewer.jsx
    │   │   │   ├── LiveMatchPanel.jsx
    │   │   │   └── LineupEditor.jsx
    │   │   └── akc3/            # AKC3 specific components
    │   ├── pages/
    │   │   ├── public/
    │   │   │   ├── HomePage.jsx
    │   │   │   ├── SportsPage.jsx
    │   │   │   ├── LeaguesPage.jsx
    │   │   │   ├── LeagueDetailPage.jsx
    │   │   │   ├── FixturesPage.jsx
    │   │   │   ├── ResultsPage.jsx
    │   │   │   ├── MatchPage.jsx
    │   │   │   ├── NewsPage.jsx
    │   │   │   ├── NewsArticlePage.jsx
    │   │   │   └── ContactPage.jsx
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── TeamRegisterPage.jsx
    │   │   ├── admin/
    │   │   │   ├── DashboardPage.jsx
    │   │   │   ├── SportsPage.jsx
    │   │   │   ├── LeaguesPage.jsx
    │   │   │   ├── FixturesPage.jsx
    │   │   │   ├── EnterResultPage.jsx
    │   │   │   ├── LiveMatchPage.jsx
    │   │   │   ├── LineupsPage.jsx
    │   │   │   ├── StandingsPage.jsx
    │   │   │   ├── TeamsPage.jsx
    │   │   │   ├── ViewTeamPage.jsx
    │   │   │   ├── PlayersPage.jsx
    │   │   │   ├── DocumentsPage.jsx
    │   │   │   ├── RegistrationsPage.jsx
    │   │   │   ├── TransfersPage.jsx
    │   │   │   ├── NewsPage.jsx
    │   │   │   ├── ContactsPage.jsx
    │   │   │   ├── PagesPage.jsx
    │   │   │   ├── UsersPage.jsx
    │   │   │   ├── FederationsPage.jsx
    │   │   │   ├── VenuesPage.jsx
    │   │   │   ├── SettingsPage.jsx
    │   │   │   ├── ActivityPage.jsx
    │   │   │   └── Akc3DashboardPage.jsx
    │   │   ├── team/
    │   │   │   ├── TeamDashboard.jsx
    │   │   │   ├── TeamProfile.jsx
    │   │   │   ├── TeamPlayers.jsx
    │   │   │   ├── TeamDocuments.jsx
    │   │   │   ├── TeamLeagues.jsx
    │   │   │   └── TeamFixtures.jsx
    │   │   └── akc3/
    │   │       ├── Akc3HomePage.jsx
    │   │       ├── SchoolsPage.jsx
    │   │       ├── Akc3FixturesPage.jsx
    │   │       ├── Akc3ResultsPage.jsx
    │   │       ├── Akc3StandingsPage.jsx
    │   │       ├── AnnouncementsPage.jsx
    │   │       └── admin/ (full AKC3 admin pages)
    │   ├── store/
    │   │   ├── authStore.js     # Zustand — user, token, role
    │   │   ├── themeStore.js    # Zustand — dark/light
    │   │   └── liveStore.js     # Zustand — live match state from Socket.IO
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── useLiveMatch.js  # Socket.IO subscription
    │   │   ├── useDebounce.js
    │   │   └── usePagination.js
    │   ├── utils/
    │   │   ├── formatDate.js
    │   │   ├── scoreDisplay.js
    │   │   └── statusBadge.js
    │   ├── App.jsx              # Router + layout wrapper
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🗄️ DATABASE SCHEMA (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── SETTINGS ────────────────────────────────────────────────────
model Setting {
  id    Int    @id @default(autoincrement())
  skey  String @unique @db.VarChar(100)
  sval  String? @db.Text
  label String? @db.VarChar(200)
  grp   String  @default("general") @db.VarChar(80)
  // Groups: branding | homepage | contact | social | footer
}

// ─── USERS ───────────────────────────────────────────────────────
model User {
  id          Int      @id @default(autoincrement())
  username    String   @unique @db.VarChar(80)
  password    String   @db.VarChar(255)    // bcrypt hash
  fullName    String   @db.VarChar(200)
  email       String?  @unique @db.VarChar(200)
  phone       String?  @db.VarChar(50)
  role        Role     @default(PUBLIC)
  active      Boolean  @default(true)
  verified    Boolean  @default(false)
  avatar      String?  @db.VarChar(300)
  lastLogin   DateTime?
  createdAt   DateTime @default(now())

  // Relations
  managedTeam Team?         @relation("TeamManager")
  newsArticles News[]
  activityLogs ActivityLog[]
  refreshTokens RefreshToken[]
}

enum Role {
  SUPERADMIN
  LEAGUE_ADMIN
  TEAM_MANAGER
  PUBLIC
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique @db.VarChar(512)
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// ─── SPORTS ──────────────────────────────────────────────────────
model Sport {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(150)
  slug        String?  @db.VarChar(170)
  icon        String   @default("🏅") @db.VarChar(10)
  description String?  @db.Text
  coverImage  String?  @db.VarChar(300)
  category    SportCategory @default(OTHER)
  sortOrder   Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  leagues     League[]
  teams       Team[]
  federations Federation[]
}

enum SportCategory {
  FIELD
  COURT
  TRACK
  WATER
  COMBAT
  RACKET
  OTHER
}

// ─── FEDERATIONS ─────────────────────────────────────────────────
model Federation {
  id           Int      @id @default(autoincrement())
  name         String   @db.VarChar(200)
  abbreviation String?  @db.VarChar(20)
  sportId      Int?
  sport        Sport?   @relation(fields: [sportId], references: [id], onDelete: SetNull)
  logo         String?  @db.VarChar(300)
  description  String?  @db.Text
  website      String?  @db.VarChar(300)
  email        String?  @db.VarChar(200)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  leagues      League[]
}

// ─── LEAGUES ─────────────────────────────────────────────────────
model League {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(200)
  slug          String?  @db.VarChar(220)
  sportId       Int
  sport         Sport    @relation(fields: [sportId], references: [id])
  federationId  Int?
  federation    Federation? @relation(fields: [federationId], references: [id], onDelete: SetNull)
  season        String   @default("2025/2026") @db.VarChar(50)
  gender        Gender   @default(MALE)
  ageCategory   AgeCategory @default(SENIOR)
  level         CompLevel @default(NATIONAL)
  format        LeagueFormat @default(LEAGUE)
  status        LeagueStatus @default(UPCOMING)
  maxTeams      Int      @default(16)
  description   String?  @db.Text
  startDate     DateTime?
  endDate       DateTime?
  adminUserId   Int?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())

  teams         LeagueTeam[]
  fixtures      Fixture[]
  standings     Standing[]
  topScorers    TopScorer[]
  competitions  Competition[]
  registrations TeamRegistration[]
  news          News[]
  admins        LeagueAdmin[]
}

enum Gender      { MALE; FEMALE; MIXED; DISABLED }
enum AgeCategory { SENIOR; U20; U17; U15; U13; JUNIOR; VETERAN; ALL }
enum CompLevel   { NATIONAL; REGIONAL; DISTRICT; SCHOOL }
enum LeagueFormat{ LEAGUE; KNOCKOUT; GROUP_KNOCKOUT; ROUND_ROBIN }
enum LeagueStatus{ UPCOMING; ACTIVE; COMPLETED; SUSPENDED }

model LeagueAdmin {
  id         Int      @id @default(autoincrement())
  leagueId   Int
  league     League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  userId     Int
  assignedAt DateTime @default(now())
}

// ─── TEAMS ───────────────────────────────────────────────────────
model Team {
  id             Int      @id @default(autoincrement())
  name           String   @db.VarChar(200)
  shortName      String?  @db.VarChar(10)
  slug           String?  @db.VarChar(220)
  sportId        Int?
  sport          Sport?   @relation(fields: [sportId], references: [id], onDelete: SetNull)
  logo           String?  @db.VarChar(300)
  jerseyHome     String?  @db.VarChar(10)
  jerseyAway     String?  @db.VarChar(10)
  foundedYear    Int?
  homeVenue      String?  @db.VarChar(300)
  city           String?  @db.VarChar(150)
  province       String?  @db.VarChar(100)
  description    String?  @db.Text
  email          String?  @db.VarChar(200)
  phone          String?  @db.VarChar(50)
  website        String?  @db.VarChar(300)
  managerUserId  Int?     @unique
  managerUser    User?    @relation("TeamManager", fields: [managerUserId], references: [id], onDelete: SetNull)
  status         TeamStatus @default(PENDING)
  verifiedAt     DateTime?
  verifiedBy     Int?
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())

  leagues        LeagueTeam[]
  players        Player[]
  homeFixtures   Fixture[]   @relation("HomeTeam")
  awayFixtures   Fixture[]   @relation("AwayTeam")
  standings      Standing[]
  topScorers     TopScorer[]
  registrations  TeamRegistration[]
  transfersFrom  Transfer[]  @relation("TransferFrom")
  transfersTo    Transfer[]  @relation("TransferTo")
}

enum TeamStatus { PENDING; VERIFIED; SUSPENDED; REJECTED }

model LeagueTeam {
  id        Int      @id @default(autoincrement())
  leagueId  Int
  league    League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  teamId    Int
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  joinedAt  DateTime @default(now())

  @@unique([leagueId, teamId])
}

// ─── PLAYERS ─────────────────────────────────────────────────────
model Player {
  id            Int      @id @default(autoincrement())
  teamId        Int
  team          Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  fullName      String   @db.VarChar(200)
  photo         String?  @db.VarChar(300)
  dateOfBirth   DateTime? @db.Date
  nationality   String   @default("Rwandan") @db.VarChar(100)
  position      String?  @db.VarChar(100)
  jerseyNumber  Int?     @db.SmallInt
  skillLevel    PlayerSkill @default(AMATEUR)
  gender        PlayerGender @default(MALE)
  height        Int?     // cm
  weight        Int?     // kg
  bio           String?  @db.Text
  status        PlayerStatus @default(PENDING)
  verifiedAt    DateTime?
  verifiedBy    Int?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())

  documents     PlayerDocument[]
  lineups       Lineup[]
  topScorer     TopScorer?
  events        MatchEvent[]     @relation("PlayerEvent")
  subEvents     MatchEvent[]     @relation("SubEvent")
  transfersFrom Transfer[]
}

enum PlayerSkill  { ELITE; PROFESSIONAL; SEMI_PROFESSIONAL; AMATEUR }
enum PlayerGender { MALE; FEMALE }
enum PlayerStatus { PENDING; VERIFIED; SUSPENDED; REJECTED }

// ─── PLAYER DOCUMENTS ────────────────────────────────────────────
model PlayerDocument {
  id           Int      @id @default(autoincrement())
  playerId     Int
  player       Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  docType      DocType
  filename     String   @db.VarChar(300)  // stored name (hashed)
  originalName String?  @db.VarChar(300)  // user's original filename
  fileSize     Int?
  mimeType     String?  @db.VarChar(100)
  status       DocStatus @default(PENDING)
  reviewNote   String?  @db.Text
  reviewedBy   Int?
  uploadedAt   DateTime @default(now())
}

enum DocType   { BIRTH_CERTIFICATE; PASSPORT; NATIONAL_ID; MEDICAL; OTHER }
enum DocStatus { PENDING; APPROVED; REJECTED }

// ─── VENUES ──────────────────────────────────────────────────────
model Venue {
  id       Int      @id @default(autoincrement())
  name     String   @db.VarChar(200)
  city     String?  @db.VarChar(150)
  province String?  @db.VarChar(100)
  capacity Int?
  surface  String?  @db.VarChar(100)
  active   Boolean  @default(true)
}

// ─── COMPETITIONS ─────────────────────────────────────────────────
model Competition {
  id        Int      @id @default(autoincrement())
  leagueId  Int
  league    League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  name      String   @db.VarChar(200)
  roundType RoundType @default(REGULAR)
  sortOrder Int      @default(0)

  fixtures  Fixture[]
}

enum RoundType { GROUP; KNOCKOUT; FINAL; SEMI_FINAL; QUARTER_FINAL; REGULAR }

// ─── FIXTURES ────────────────────────────────────────────────────
model Fixture {
  id            Int      @id @default(autoincrement())
  leagueId      Int
  league        League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  competitionId Int?
  competition   Competition? @relation(fields: [competitionId], references: [id], onDelete: SetNull)
  homeTeamId    Int
  homeTeam      Team     @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeamId    Int
  awayTeam      Team     @relation("AwayTeam", fields: [awayTeamId], references: [id])
  matchday      Int      @default(1) @db.SmallInt
  venue         String?  @db.VarChar(300)
  matchDate     DateTime?
  status        FixtureStatus @default(SCHEDULED)
  homeScore     Int?     @db.SmallInt
  awayScore     Int?     @db.SmallInt
  homeScoreHt   Int?     @db.SmallInt  // half-time
  awayScoreHt   Int?     @db.SmallInt
  attendance    Int?
  referee       String?  @db.VarChar(200)
  matchNotes    String?  @db.Text
  streamUrl     String?  @db.VarChar(500)  // live video stream URL
  streamActive  Boolean  @default(false)
  createdAt     DateTime @default(now())

  events        MatchEvent[]
  lineups       Lineup[]
  liveState     LiveMatchState?
}

enum FixtureStatus { SCHEDULED; LIVE; COMPLETED; POSTPONED; CANCELLED }

// ─── MATCH EVENTS ────────────────────────────────────────────────
model MatchEvent {
  id          Int      @id @default(autoincrement())
  fixtureId   Int
  fixture     Fixture  @relation(fields: [fixtureId], references: [id], onDelete: Cascade)
  playerId    Int?
  player      Player?  @relation("PlayerEvent", fields: [playerId], references: [id], onDelete: SetNull)
  player2Id   Int?     // for substitution: player coming on
  player2     Player?  @relation("SubEvent", fields: [player2Id], references: [id], onDelete: SetNull)
  teamId      Int?
  eventType   EventType
  minute      Int?     @db.SmallInt
  extraTime   Int      @default(0) @db.SmallInt
  description String?  @db.VarChar(300)
  createdAt   DateTime @default(now())
}

enum EventType {
  GOAL; OWN_GOAL; PENALTY; RED_CARD; YELLOW_CARD
  SUBSTITUTION; INJURY; VAR; KICKOFF; HALFTIME; FULLTIME; EXTRA_TIME
}

// ─── LINEUPS ─────────────────────────────────────────────────────
model Lineup {
  id        Int     @id @default(autoincrement())
  fixtureId Int
  fixture   Fixture @relation(fields: [fixtureId], references: [id], onDelete: Cascade)
  teamId    Int
  playerId  Int
  player    Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)
  position  String? @db.VarChar(50)
  jerseyNo  Int?    @db.SmallInt
  isStarter Boolean @default(true)
  isCaptain Boolean @default(false)

  @@unique([fixtureId, playerId])
}

// ─── LIVE MATCH STATE ─────────────────────────────────────────────
model LiveMatchState {
  fixtureId Int     @id
  fixture   Fixture @relation(fields: [fixtureId], references: [id], onDelete: Cascade)
  minute    Int     @default(0) @db.SmallInt
  homeScore Int     @default(0) @db.SmallInt
  awayScore Int     @default(0) @db.SmallInt
  status    String  @default("live") @db.VarChar(30)
  lastEvent String? @db.VarChar(300)
  updatedAt DateTime @updatedAt
}

// ─── STANDINGS ────────────────────────────────────────────────────
model Standing {
  id            Int    @id @default(autoincrement())
  leagueId      Int
  league        League @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  teamId        Int
  team          Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  played        Int    @default(0)
  won           Int    @default(0)
  drawn         Int    @default(0)
  lost          Int    @default(0)
  goalsFor      Int    @default(0)
  goalsAgainst  Int    @default(0)
  points        Int    @default(0)
  form          String @default("") @db.VarChar(20)  // "WWDLL"
  updatedAt     DateTime @updatedAt

  @@unique([leagueId, teamId])
}

// ─── TOP SCORERS ──────────────────────────────────────────────────
model TopScorer {
  id        Int    @id @default(autoincrement())
  leagueId  Int
  league    League @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  playerId  Int    @unique
  player    Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  teamId    Int
  team      Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)