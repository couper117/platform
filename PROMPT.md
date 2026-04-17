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
  goals     Int    @default(0)
  assists   Int    @default(0)
  updatedAt DateTime @updatedAt
}

// ─── TRANSFERS ────────────────────────────────────────────────────
model Transfer {
  id           Int      @id @default(autoincrement())
  playerId     Int
  player       Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  fromTeamId   Int?
  fromTeam     Team?    @relation("TransferFrom", fields: [fromTeamId], references: [id], onDelete: SetNull)
  toTeamId     Int
  toTeam       Team     @relation("TransferTo", fields: [toTeamId], references: [id])
  transferDate DateTime? @db.Date
  transferType TransferType @default(PERMANENT)
  fee          Decimal? @db.Decimal(12, 2)
  notes        String?  @db.Text
  createdAt    DateTime @default(now())
}

enum TransferType { PERMANENT; LOAN; FREE; RETURN_FROM_LOAN }

// ─── TEAM REGISTRATIONS ───────────────────────────────────────────
model TeamRegistration {
  id          Int      @id @default(autoincrement())
  teamId      Int
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  leagueId    Int
  league      League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  status      RegStatus @default(PENDING)
  submittedAt DateTime  @default(now())
  reviewedAt  DateTime?
  reviewedBy  Int?
  notes       String?  @db.Text

  @@unique([teamId, leagueId])
}

enum RegStatus { PENDING; APPROVED; REJECTED }

// ─── NEWS ─────────────────────────────────────────────────────────
model News {
  id          Int      @id @default(autoincrement())
  sportId     Int?
  leagueId    Int?
  league      League?  @relation(fields: [leagueId], references: [id], onDelete: SetNull)
  title       String   @db.VarChar(300)
  slug        String?  @db.VarChar(320)
  excerpt     String?  @db.Text
  body        String?  @db.Text  // HTML content
  coverImage  String?  @db.VarChar(300)
  authorId    Int?
  author      User?    @relation(fields: [authorId], references: [id], onDelete: SetNull)
  category    NewsCategory @default(NEWS)
  featured    Boolean  @default(false)
  published   Boolean  @default(true)
  views       Int      @default(0)
  createdAt   DateTime @default(now())
}

enum NewsCategory { NEWS; ANNOUNCEMENT; RESULT; TRANSFER; INJURY; OTHER }

// ─── CONTACTS ─────────────────────────────────────────────────────
model Contact {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(200)
  email     String?  @db.VarChar(200)
  phone     String?  @db.VarChar(50)
  subject   String?  @db.VarChar(300)
  message   String   @db.Text
  status    ContactStatus @default(NEW)
  createdAt DateTime @default(now())
}

enum ContactStatus { NEW; READ; REPLIED }

// ─── PAGES (static CMS) ───────────────────────────────────────────
model Page {
  id        Int      @id @default(autoincrement())
  slug      String   @unique @db.VarChar(100)
  title     String   @db.VarChar(300)
  content   String?  @db.LongText
  metaDesc  String?  @db.VarChar(300)
  published Boolean  @default(true)
  updatedAt DateTime @updatedAt
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────
model ActivityLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   @db.VarChar(200)
  detail    String?  @db.Text
  module    String?  @db.VarChar(80)
  ip        String?  @db.VarChar(50)
  createdAt DateTime @default(now())
}

// ─────────────────────────────────────────────────────────────────
// AKC3 — AMASHURI KAGAME CUP (separate but related module)
// Uses same database, prefixed with "Akc" in Prisma
// ─────────────────────────────────────────────────────────────────

model AkcSchool {
  id           Int      @id @default(autoincrement())
  name         String   @db.VarChar(200)
  shortName    String?  @db.VarChar(50)
  code         String?  @db.VarChar(50)
  category     SchoolCategory @default(SECONDARY)
  provinceId   Int?
  districtId   Int?
  sector       String?  @db.VarChar(100)
  address      String?  @db.Text
  headTeacher  String?  @db.VarChar(200)
  coordinator  String?  @db.VarChar(200)
  coordPhone   String?  @db.VarChar(50)
  coordEmail   String?  @db.VarChar(200)
  phone        String?  @db.VarChar(50)
  email        String?  @db.VarChar(200)
  logo         String?  @db.VarChar(300)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  teams        AkcTeam[]
}

enum SchoolCategory { SECONDARY; TVET; PRIMARY }

model AkcTeam {
  id           Int      @id @default(autoincrement())
  schoolId     Int
  school       AkcSchool @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  sportId      Int      // references Sports table
  gender       AkcGender @default(MALE)
  ageCategory  AkcAgeCategory @default(U17)
  level        AkcLevel @default(NATIONAL)
  coachName    String?  @db.VarChar(200)
  coachPhone   String?  @db.VarChar(50)
  isInclusive  Boolean  @default(false)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  players      AkcPlayer[]
  homeFixtures AkcFixture[] @relation("AkcHome")
  awayFixtures AkcFixture[] @relation("AkcAway")
  standings    AkcStanding[]
}

enum AkcGender      { MALE; FEMALE; MIXED; INCLUSIVE }
enum AkcAgeCategory { U13; U15; U17; U20; OPEN }
enum AkcLevel       { CELL; SECTOR; DISTRICT; PROVINCE; NATIONAL }

model AkcPlayer {
  id           Int      @id @default(autoincrement())
  teamId       Int
  team         AkcTeam  @relation(fields: [teamId], references: [id], onDelete: Cascade)
  fullName     String   @db.VarChar(200)
  dob          DateTime? @db.Date
  gender       PlayerGender @default(MALE)
  ageCategory  AkcAgeCategory @default(U17)
  position     String?  @db.VarChar(100)
  jersey       Int?     @db.SmallInt
  idNumber     String?  @db.VarChar(100)
  idType       AkcIdType @default(NATIONAL_ID)
  docVerified  Boolean  @default(false)
  hasDisability Boolean @default(false)
  disabilityType String? @db.VarChar(200)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
}

enum AkcIdType { NATIONAL_ID; BIRTH_CERT; PASSPORT }

model AkcCompetition {
  id           Int      @id @default(autoincrement())
  name         String   @db.VarChar(200)
  edition      String?  @db.VarChar(50)
  sportId      Int?
  gender       String   @default("mixed")
  ageCategory  String   @default("Open")
  level        AkcLevel @default(NATIONAL)
  startDate    DateTime? @db.Date
  endDate      DateTime? @db.Date
  venue        String?  @db.VarChar(200)
  status       AkcCompStatus @default(UPCOMING)
  description  String?  @db.Text
  createdAt    DateTime @default(now())

  fixtures     AkcFixture[]
  standings    AkcStanding[]
}

enum AkcCompStatus { UPCOMING; ONGOING; COMPLETED; CANCELLED }

model AkcFixture {
  id            Int      @id @default(autoincrement())
  competitionId Int?
  competition   AkcCompetition? @relation(fields: [competitionId], references: [id], onDelete: SetNull)
  homeTeamId    Int
  homeTeam      AkcTeam  @relation("AkcHome", fields: [homeTeamId], references: [id])
  awayTeamId    Int
  awayTeam      AkcTeam  @relation("AkcAway", fields: [awayTeamId], references: [id])
  matchDate     DateTime?
  venue         String?  @db.VarChar(200)
  round         String?  @db.VarChar(100)
  stage         AkcStage @default(GROUP)
  status        AkcFixtureStatus @default(SCHEDULED)
  homeScore     Int?
  awayScore     Int?
  winnerTeamId  Int?
  isDraw        Boolean  @default(false)
  notes         String?  @db.Text
  createdAt     DateTime @default(now())
}

enum AkcStage { GROUP; ROUND16; QUARTERFINAL; SEMIFINAL; FINAL; THIRD_PLACE }
enum AkcFixtureStatus { SCHEDULED; ONGOING; COMPLETED; POSTPONED; CANCELLED }

model AkcStanding {
  id            Int    @id @default(autoincrement())
  competitionId Int
  competition   AkcCompetition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  teamId        Int
  team          AkcTeam @relation(fields: [teamId], references: [id], onDelete: Cascade)
  played        Int    @default(0)
  won           Int    @default(0)
  drawn         Int    @default(0)
  lost          Int    @default(0)
  gf            Int    @default(0)
  ga            Int    @default(0)
  points        Int    @default(0)
  updatedAt     DateTime @updatedAt

  @@unique([competitionId, teamId])
}

model AkcAnnouncement {
  id         Int      @id @default(autoincrement())
  title      String   @db.VarChar(300)
  body       String   @db.Text
  category   AkcAnnouncementCategory @default(GENERAL)
  published  Boolean  @default(true)
  pinned     Boolean  @default(false)
  authorId   Int?
  createdAt  DateTime @default(now())
}

enum AkcAnnouncementCategory { GENERAL; REGISTRATION; COMPETITION; RESULTS; URGENT }
```

---

## 🔌 API ENDPOINTS

### Authentication — `/api/v1/auth`
```
POST   /login                  Body: {username, password}
                               Returns: {accessToken, user} + sets refreshToken cookie
POST   /logout                 Clears refresh token cookie
POST   /refresh                Reads refreshToken cookie, returns new accessToken
GET    /me                     Returns current authenticated user profile
PUT    /change-password        Body: {currentPassword, newPassword}
POST   /team/register          Public team manager registration
       Body: {username, password, fullName, email, phone, teamName, sportId, city, province}
       Creates User(TEAM_MANAGER) + Team(PENDING) atomically
```

### Settings — `/api/v1/settings`
```
GET    /                       Public: returns all published settings as {key:value} map
PUT    /                       SUPERADMIN: bulk update settings
       Body: [{skey, sval}]
```

### Sports — `/api/v1/sports`
```
GET    /                       Public: all active sports with league count, team count
GET    /:slug                  Public: sport detail + leagues list
POST   /                       SUPERADMIN: create sport
       Body: {name, icon, description, category, sortOrder, coverImage(file)}
PUT    /:id                    SUPERADMIN: update sport
DELETE /:id                    SUPERADMIN: soft delete (active=false)
```

### Federations — `/api/v1/federations`
```
GET    /                       Public: all active federations
POST   /                       SUPERADMIN: create
PUT    /:id                    SUPERADMIN: update
DELETE /:id                    SUPERADMIN: delete
```

### Leagues — `/api/v1/leagues`
```
GET    /                       Public: all active leagues
                               Query: ?sportId=&gender=&level=&status=&page=&limit=
GET    /:id                    Public: league detail
GET    /:id/standings          Public: full standings table
GET    /:id/fixtures           Public: fixtures (upcoming + live)
                               Query: ?matchday=&status=
GET    /:id/results            Public: completed matches
GET    /:id/top-scorers        Public: top scorer list
GET    /:id/teams              Public: teams in league
POST   /                       SUPERADMIN | LEAGUE_ADMIN: create league
PUT    /:id                    SUPERADMIN | LEAGUE_ADMIN: update league
DELETE /:id                    SUPERADMIN: delete
POST   /:id/teams/:teamId      SUPERADMIN: add team to league
DELETE /:id/teams/:teamId      SUPERADMIN: remove team from league
```

### Teams — `/api/v1/teams`
```
GET    /                       Public: list all active teams
                               Query: ?sportId=&status=&province=&page=
GET    /:id                    Public: team detail + players + leagues + recent fixtures
POST   /                       SUPERADMIN: admin-create team
PUT    /:id                    SUPERADMIN | own TEAM_MANAGER: update team
                               Multipart: includes logo file upload
PUT    /:id/status             SUPERADMIN: approve/reject/suspend team
                               Body: {status: "verified"|"rejected"|"suspended"}
```

### Players — `/api/v1/players`
```
GET    /                       Admin: list all players
                               Query: ?teamId=&status=&page=
GET    /:id                    Public: player profile
POST   /                       TEAM_MANAGER | SUPERADMIN: add player to team
       Multipart: photo file + JSON body {fullName, dateOfBirth, nationality, position, jerseyNumber, gender}
PUT    /:id                    TEAM_MANAGER (own team) | SUPERADMIN: update player
PUT    /:id/status             SUPERADMIN: verify/reject player
       Body: {status: "verified"|"rejected"}
DELETE /:id                    SUPERADMIN: soft delete
```

### Player Documents — `/api/v1/documents`
```
GET    /                       SUPERADMIN | LEAGUE_ADMIN: list all documents
                               Query: ?status=&playerId=&teamId=&page=
GET    /:id/view               Admin: view document (streams file securely, no path exposed)
GET    /:id/download           Admin: download document as attachment
POST   /upload                 TEAM_MANAGER: upload document for a player
       Multipart: file + JSON {playerId, docType}
       Accepts: jpg, jpeg, png, pdf, webp (max 8MB)
       Stores with hashed filename in /uploads/documents/ (not web-accessible directly)
PUT    /:id/review             SUPERADMIN | LEAGUE_ADMIN: approve or reject document
       Body: {status: "approved"|"rejected", reviewNote?}
       AUTO-LOGIC: if player has Birth Certificate + Passport + National ID all approved
                   → automatically set player.status = "verified"
```

### Fixtures — `/api/v1/fixtures`
```
GET    /                       Public: list fixtures
                               Query: ?leagueId=&sportId=&status=&from=&to=&page=
GET    /:id                    Public: fixture detail with events, lineups, live state
POST   /                       SUPERADMIN | LEAGUE_ADMIN: create fixture
       Body: {leagueId, homeTeamId, awayTeamId, matchDate, venue, matchday, referee, streamUrl}
PUT    /:id                    SUPERADMIN | LEAGUE_ADMIN: update fixture
PUT    /:id/go-live            Admin: set status=LIVE, create LiveMatchState row
PUT    /:id/end-live           Admin: end live, set status=COMPLETED
DELETE /:id                    SUPERADMIN: delete
```

### Results (Enter Result) — `/api/v1/results`
```
POST   /fixtures/:id/result    SUPERADMIN | LEAGUE_ADMIN: save full-time result
       Body: {homeScore, awayScore, homeScoreHt?, awayScoreHt?, attendance?, status}
       AUTO-LOGIC (standings.service.js):
         1. Update fixture scores + status = COMPLETED
         2. Recalculate full standings for that league:
            - Loop all completed fixtures in league
            - Rebuild: played, won, drawn, lost, goalsFor, goalsAgainst, points
            - points = W×3 + D×1
            - Upsert standings rows for all teams
            - Update form string (last 5 results W/D/L)
         3. Update top_scorers from match_events for that fixture

POST   /fixtures/:id/events    SUPERADMIN | LEAGUE_ADMIN: add match event
       Body: {eventType, minute, teamId, playerId?, player2Id?, description?}
       AUTO-LOGIC:
         - If eventType = GOAL or PENALTY: increment that team's score in fixture + LiveMatchState
         - If OWN_GOAL: increment opponent score
         - Emit via Socket.IO: 'matchEvent' event to room `fixture-{id}`

DELETE /events/:eventId        Admin: delete a match event

GET    /fixtures/:id/events    Public: all events for a fixture (timeline)
```

### Lineups — `/api/v1/lineups`
```
GET    /fixtures/:id           Public: lineups for a fixture (home + away)
POST   /fixtures/:id           Admin: save entire lineup for a fixture
       Body: {
         home: [{playerId, position, jerseyNo, isStarter, isCaptain}],
         away: [{playerId, position, jerseyNo, isStarter, isCaptain}]
       }
       Deletes existing lineups then inserts new ones (full replace)
```

### Live Match — `/api/v1/live`
```
GET    /                       Public: all currently LIVE fixtures with live state
GET    /fixtures/:id           Public: live state for specific fixture
                               (also available via Socket.IO room subscription)
```

### Standings — `/api/v1/standings`
```
GET    /leagues/:id            Public: standings table for a league
                               Returns: sorted array with goal_diff computed
POST   /leagues/:id/recalculate Admin: force full standings recalculation
                                Rebuilds from scratch using all completed fixtures
```

### Transfers — `/api/v1/transfers`
```
GET    /                       Admin: list all transfers
POST   /                       SUPERADMIN: record a transfer
       Body: {playerId, fromTeamId?, toTeamId, transferDate, transferType, fee?, notes?}
       Also updates player.teamId to toTeamId
```

### Team Registrations — `/api/v1/registrations`
```
GET    /                       SUPERADMIN: list all pending/reviewed registrations
POST   /                       TEAM_MANAGER: apply to join a league
       Body: {leagueId}
PUT    /:id/review             SUPERADMIN | LEAGUE_ADMIN: approve/reject
       Body: {status: "approved"|"rejected", notes?}
       If APPROVED: creates league_teams row, assigns team to league
```

### News — `/api/v1/news`
```
GET    /                       Public: list published articles
                               Query: ?sportId=&leagueId=&category=&page=&featured=true
GET    /:slug                  Public: article detail (also increments views)
POST   /                       SUPERADMIN | LEAGUE_ADMIN: create article
       Multipart: coverImage file + JSON body
       {title, excerpt, body (HTML), category, sportId?, leagueId?, featured, published}
       AUTO: generate slug from title
PUT    /:id                    Admin: update article
DELETE /:id                    Admin: delete
```

### Contacts — `/api/v1/contacts`
```
POST   /                       Public: submit contact form
       Body: {name, email?, phone?, subject?, message}
       Rate limited: 5 per IP per hour
GET    /                       SUPERADMIN: list all messages
PUT    /:id/status             Admin: mark as read/replied
```

### Venues — `/api/v1/venues`
```
GET    /                       Public: list all active venues
POST   /                       SUPERADMIN: create
PUT    /:id                    SUPERADMIN: update
DELETE /:id                    SUPERADMIN: delete
```

### Users — `/api/v1/users`
```
GET    /                       SUPERADMIN: list all users
POST   /                       SUPERADMIN: create admin user
PUT    /:id                    SUPERADMIN: update user (role, active, etc.)
DELETE /:id                    SUPERADMIN: deactivate user
```

### Activity Log — `/api/v1/activity`
```
GET    /                       SUPERADMIN: list activity log
                               Query: ?userId=&module=&page=
                               Every write operation throughout the API logs:
                               {userId, action: "Create Fixture", detail: "...", module: "fixtures", ip}
```

### Pages (CMS) — `/api/v1/pages`
```
GET    /:slug                  Public: get a static page by slug (about, privacy, terms)
POST   /                       SUPERADMIN: create page
PUT    /:slug                  SUPERADMIN: update page content (HTML)
```

### AKC3 — `/api/v1/akc3`
```
// --- PUBLIC ---
GET    /                       AKC3 overview stats (schools, teams, players counts)
GET    /schools                List all active schools
GET    /schools/:id            School detail + teams
GET    /competitions           List competitions by status
GET    /competitions/:id       Competition detail + fixtures + standings
GET    /fixtures               List fixtures Query: ?competitionId=&status=&schoolId=
GET    /fixtures/:id           Fixture detail with score
GET    /results                Completed fixtures with scores
GET    /standings/:compId      Standings for competition
GET    /announcements          Published announcements (pinned first)
GET    /regulations            Static page content

// --- ADMIN (SUPERADMIN only for AKC3 admin) ---
POST   /admin/schools          Create school
PUT    /admin/schools/:id      Update school
POST   /admin/teams            Create team for a school
PUT    /admin/teams/:id        Update team
POST   /admin/players          Add player to team
PUT    /admin/players/:id      Update player
PUT    /admin/players/:id/verify  Verify player document
POST   /admin/competitions     Create competition
PUT    /admin/competitions/:id Update competition
POST   /admin/fixtures         Create AKC3 fixture
PUT    /admin/fixtures/:id     Update fixture
POST   /admin/results/:fixtureId  Enter result
       Body: {homeScore, awayScore}
       AUTO: recalculate AKC3 standings for that competition
POST   /admin/announcements    Create announcement
PUT    /admin/announcements/:id Update/publish
POST   /admin/import/players   CSV bulk import players
       Parses CSV: schoolCode, teamSportId, gender, ageCategory,
                   playerFullName, dob, position, jersey, idType, idNumber
       Returns: {created, skipped, errors[]}
```

### Dashboard Stats — `/api/v1/dashboard`
```
GET    /admin                  SUPERADMIN | LEAGUE_ADMIN: dashboard counters
       Returns: {
         sports, leagues, teams, players, fixtures_today,
         live_fixtures, pending_teams, pending_docs,
         pending_registrations, unread_contacts,
         recent_activity[10], upcoming_fixtures[5]
       }

GET    /team                   TEAM_MANAGER: own team dashboard
       Returns: {
         team, players_count, verified_players, pending_docs,
         leagues_count, upcoming_fixtures[5], recent_results[5]
       }
```

---

## ⚡ SOCKET.IO — REAL-TIME LIVE SCORES

```javascript
// Server emits these events:
// ---------------------------------
// 'liveUpdate'    → broadcast to all connected clients
//   payload: { fixtureId, minute, homeScore, awayScore, status, lastEvent }

// 'matchEvent'    → broadcast to room `fixture-{id}`
//   payload: { fixtureId, event: { type, minute, player, team, description } }

// 'liveStart'     → broadcast when match goes LIVE
//   payload: { fixtureId, homeTeam, awayTeam, leagueName }

// 'liveEnd'       → broadcast when match ends
//   payload: { fixtureId, homeScore, awayScore }

// Client subscribes like this:
socket.emit('joinFixture', fixtureId)     // join room for a specific match
socket.emit('leaveFixture', fixtureId)    // leave room

// Admin emits live events through the REST API (POST /results/fixtures/:id/events)
// The API controller calls socket.io.emit() internally after saving to DB
```

---

## 🎨 FRONTEND PAGES & COMPONENTS

### PUBLIC SITE

#### `HomePage.jsx`
- Sticky live ticker (scores scrolling from Socket.IO `liveUpdate`)
- Hero section: `font-['Bebas_Neue']` bold headline, animated gradient background
  with dot grid overlay (CSS `background-image: radial-gradient`), Rwanda flag color
  accents (green #20603D, yellow #FAD201, blue #00A1DE)
- `<LiveScoreBoard />` panel (right side on desktop): shows live/upcoming fixtures,
  polls Socket.IO `liveUpdate` event in real-time
- `<QuickAccessGrid />`: 4 cards → Fixtures, Results, Standings, Leagues
- `<StatsBanner />`: animated count-up numbers (sports, teams, players, matches played)
- "Featured Match of the Week" section: admin-pinned featured fixture card with
  full-width layout, team logos, big score display, venue + date
- Active Leagues grid: filterable by sport (Framer Motion `AnimatePresence` for filter transitions)
- Latest News: 3-column grid on desktop
- `FeaturedNewsCard`: large hero-style article with image overlay
- CTA section: "Register Your Team" with form or redirect
- Footer with social links, admin portal link, AKC3 link

#### `FixturesPage.jsx`
- Page banner with background gradient
- Horizontally scrollable sport filter chips (touch-friendly, no wrapping)
- Group fixtures by date (sticky date headers)
- Each `<FixtureCard />`:
  - Team logos (or initials fallback)
  - Score (if live/completed) or match time (if scheduled)
  - Live badge with animated pulse dot
  - League name, venue, matchday number
  - Click → `MatchPage`
- Skeleton loading state (6 cards) while fetching
- Real-time: Socket.IO `liveUpdate` updates scores in place without re-render

#### `ResultsPage.jsx`
- Same filter chips as Fixtures
- Shows completed matches, grouped by date DESC
- Each card shows final score prominently
- Highlight winner side (bold team name)

#### `LeaguesPage.jsx`
- Filter bar: by sport + by gender (dual filter bars)
- `LeagueCard` with left red accent animation on hover
- Status badges: Active (green), Upcoming (blue), Completed (grey)

#### `LeagueDetailPage.jsx`
- Tabs (Framer Motion `AnimatePresence`): Standings | Fixtures | Results | Teams | Top Scorers
- **Standings tab**: full table with form pills (W/D/L colored circles), goal difference
- **Fixtures tab**: upcoming fixtures for this league
- **Results tab**: completed fixtures
- **Teams tab**: team cards with logos
- **Top Scorers tab**: ranked list with player photos, goals count, assists

#### `MatchPage.jsx`
- Full match board: two team logos, big score, status badge, venue/date
- Live minute counter (from Socket.IO)
- Match events timeline: chronological goal/card/sub events with icons
- Starting lineups (home vs away formation visual if possible, else list)
- If live: real-time event updates via Socket.IO `matchEvent`
- If stream_url set: embedded video player / watch live button

#### `SportsPage.jsx`
- All sports grid (2→3→5 columns responsive)
- Click → filtered leagues list

#### `NewsPage.jsx`
- Featured article (large card on top)
- News grid below
- Category filter: News | Announcements | Results | Transfers

#### `ContactPage.jsx`
- Contact form with React Hook Form + Zod validation
- Contact info cards (email, phone, address)
- Submit sends POST `/api/v1/contacts`

---

### AUTH PAGES

#### `LoginPage.jsx` (shared — detects redirect to admin vs team portal)
- Two tabs: Admin Login | Team Portal Login
- JWT stored in memory (Zustand `authStore`), refresh token in httpOnly cookie
- On success: redirect to `/admin/dashboard` or `/team/dashboard`

#### `TeamRegisterPage.jsx`
- Multi-step form (3 steps with progress bar):
  - Step 1: Account info (username, password, full name, email, phone)
  - Step 2: Team info (team name, sport, city, province, home venue)
  - Step 3: Review + submit
- On submit: POST `/api/v1/auth/team/register`
- Shows success message with "pending approval" notice

---

### ADMIN PANEL (protected, role-based)

All admin pages use `<AdminLayout>` with collapsible sidebar (mobile: overlay drawer).

#### Sidebar nav groups:
```
// Main
Dashboard

// Competitions
Sports | Leagues | Fixtures | Enter Results | Live Match | Lineups | Standings

// Teams & Players
Teams | Players | Documents | Registrations | Transfers

// Content
News | Messages | Pages

// System (SUPERADMIN only)
Users | Federations | Venues | Settings | Activity Log

// Kagame Cup
AKC3 Kagame Cup (link to AKC3 dashboard)
```

#### `DashboardPage.jsx`
- 4-col stat grid: Pending Teams, Pending Docs, Live Fixtures, Messages
- Recent Activity feed (last 10 actions)
- Upcoming Fixtures list (next 5)
- Quick action buttons: + Add Fixture, Review Documents, Go Live

#### `FixturesPage.jsx` (Admin)
- Table: league, home vs away, date, venue, status, score
- Filters: status tabs (All | Live | Scheduled | Completed | Postponed)
- League dropdown filter
- Actions per row: ⚽ Enter Result | 🔴 Live Mode | Edit | Go Live/End Live | Delete
- `+ Add Fixture` button → modal form or drawer

#### `EnterResultPage.jsx`
- Match scoreboard at top (live updating if match is live)
- Form: home score, away score, half-time scores, attendance, final status
- Match Events section:
  - Timeline of existing events (delete button per event)
  - Add Event form: type (goal/card/sub/etc), minute, team selector, player selector
  - Goal events auto-increment the score display instantly
- Save Result button → calls POST API → auto-recalculates standings
- Toast notification: "Standings recalculated!"
