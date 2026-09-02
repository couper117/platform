# RwaSport — Rwanda National Sports Platform (RNSP)

A mobile-first platform to digitize Rwandan sport end-to-end: professional
leagues, 20+ federations, a live Match Center, a school-competitions module
(Amashuri / AKC3), and racing (cycling, athletics) — with team verification,
news, ads and subscriptions.

- **Frontend:** React 18 + Vite + Tailwind + TanStack Query + Zustand (PWA, Capacitor for mobile), i18n in English / Kinyarwanda / French.
- **Backend:** Express + Prisma + PostgreSQL, JWT auth, Zod validation, Cloudinary media, Pusher + SSE realtime, Flutterwave payments (env-gated).

## Monorepo layout

```
apps/frontend   React PWA — the real app
apps/backend    Express + Prisma API (TypeScript, CommonJS via tsx)
demo/app        Standalone, offline, mock-data pitch demo
docs/           Architecture, business model, admin manual, build spec (PROMPT.md)
scripts/        Repo tooling (e.g. demo↔real drift check)
DESIGN.md       The design-system reference (tokens, type, spacing)
```

## Prerequisites

- Node.js **>= 18** (CI uses 22)
- A PostgreSQL instance for the backend

## Setup

```bash
npm install                      # installs all workspaces
cp apps/backend/.env.example apps/backend/.env   # then fill in DATABASE_URL, JWT_SECRET
npm run seed:all                 # seed sports, federations, teams, fixtures, users…
```

`apps/frontend/.env` defaults to `VITE_API_URL=http://localhost:5000/api/v1` and
needs no changes for local dev.

## Run

```bash
npm run dev            # backend (:5000) + frontend (:5173) together
npm run dev:backend    # API only
npm run dev:frontend   # React app only
npm run demo:dev       # the offline pitch demo
```

Open **http://localhost:5173**. The API is at **http://localhost:5000/api/v1**
(the bare root has no page — try `/api/v1/health`).

## Seeded logins

All use the password `Manager@123` (log in with the email **or** username):

| Email | Role |
|---|---|
| `admin@rwasport.rw` | SUPERADMIN |
| `league@rwasport.rw` | LEAGUE_ADMIN |
| `reporter@rwasport.rw` | AMASHURI_ADMIN |
| `match.reporter@rwasport.rw` | MATCH_REPORTER |
| `school.coordinator` (username) | SCHOOL_COORDINATOR — school portal, scoped to one school |

## Quality gates

```bash
npm run typecheck      # tsc across frontend + backend
npm run lint           # ESLint (frontend)
npm test               # unit tests (backend + frontend)
npm run test:smoke     # API integration smoke tests (needs the server running)
npm run check:drift    # fail if shared demo↔real files diverge
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, drift and unit tests on
every push/PR, plus a Postgres-backed job that runs the smoke suite. A husky
pre-commit hook runs typecheck + lint locally.

## Payments

The Flutterwave integration is **env-gated**: with no `FLW_*` keys set it runs
in a safe sandbox mode (no live charges, webhook fails closed). Set
`FLW_SECRET_KEY`, `FLW_PUBLIC_KEY` and `FLW_WEBHOOK_HASH` to go live — no code
change needed. See `apps/backend/.env.example`.

## Documentation

- [`docs/DATA_PROTECTION.md`](docs/DATA_PROTECTION.md) — Law N° 058/2021 compliance: record of processing, retention, data-subject rights, breach procedure, and what remains outstanding
  - [`docs/privacy/DPIA.md`](docs/privacy/DPIA.md) — impact assessment (art. 15)
  - [`docs/privacy/PROCESSORS.md`](docs/privacy/PROCESSORS.md) — processor register and required contract terms (art. 49)
  - [`docs/privacy/DPO-AND-REGISTRATION.md`](docs/privacy/DPO-AND-REGISTRATION.md) — DPO terms of reference (art. 40) and the NCSA registration pack (art. 29)
- [`SECURITY.md`](SECURITY.md) — secret handling (rotate + move off OneDrive) and what's already in place
- [`docs/RESILIENCE.md`](docs/RESILIENCE.md) — vendor dependencies, failover, backups (`npm run db:backup`), recovery runbook
- [`DESIGN.md`](DESIGN.md) — design system (the `/design-system` route is the living reference)
- [`docs/1_System_Architecture.md`](docs/1_System_Architecture.md)
- [`docs/2_Business_Model.md`](docs/2_Business_Model.md)
- [`docs/3_Admin_User_Manual.md`](docs/3_Admin_User_Manual.md)
- [`docs/PROMPT.md`](docs/PROMPT.md) — the original full build specification (historical reference)
