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