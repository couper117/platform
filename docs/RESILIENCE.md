# Resilience & disaster recovery

The platform runs on managed services (Supabase, Cloudinary, Pusher, Vercel).
Each is a potential single point of failure. This document is the honest state of
each dependency, how coupled we actually are, and the recovery playbook — so the
"no documented DR" gap is closed and the real risks are visible.

The guiding principle: **stay portable.** Nothing here is locked to a proprietary
API — every vendor can be swapped for an open equivalent.

## Dependency map

| Layer | Vendor | Real lock-in | Failure impact | Mitigation |
|---|---|---|---|---|
| Data | Supabase (Postgres) | **Low** — plain Postgres via Prisma | Total outage | Portable to any Postgres; logical backups (below) |
| Realtime | Pusher | **None** — optional | Live scores stale | **Dual transport: SSE fallback is always on** (below) |
| Media | Cloudinary | **Medium** | New uploads fail; existing served from CDN | Opt-in local/S3 driver; existing URLs unaffected |
| Deploy | Vercel | **Low** — standard Node/Express | Can't ship | Runs on any Node host; `vercel-build` runs migrations |

## Data — the database

**We are not locked to Supabase.** The app speaks to Postgres through Prisma;
`DATABASE_URL` can point at Supabase, RDS, Cloud SQL, or a self-hosted cluster
with no code change. That also answers the *data-sovereignty* adoption concern:
a federation that requires on-prem data can self-host Postgres.

**Backups.** `npm run db:backup` writes a compressed, portable dump:

```bash
npm run db:backup                 # → ./backups/rnsp-<timestamp>.dump
# restore anywhere:
pg_restore --clean --no-owner -d "$DATABASE_URL" backups/rnsp-<timestamp>.dump
```

Recommended: a nightly scheduled backup (cron / GitHub Action) to off-site
storage, plus Supabase's own PITR on a paid tier. **Do this before go-live** —
it is the single most important DR control.

## Realtime — already failover-safe

Pusher is **not** a single point of failure. Every live update fans out to *two*
transports (`services/realtime.service.ts`):

1. **Pusher** — used in production when the four `PUSHER_*` vars are set; a safe
   no-op otherwise (never throws, never crashes a request).
2. **Server-Sent Events** — an in-process hub (`services/sse.service.ts`) that
   works with **zero configuration** and **no per-message cost**.

So if Pusher is down, misconfigured, or simply unfunded, **live scores keep
flowing over SSE**. This also caps the **real-time cost exposure**: a popular
match with thousands of fans costs nothing extra on SSE, whereas Pusher bills
per message — treat Pusher as optional scale-out, not a dependency. (SSE holds
an open connection per viewer, so scale it behind the standard reverse-proxy /
worker setup rather than a single node when concurrency gets high.)

## Media — Cloudinary

Uploads (team crests, player photos, **verification documents**) go to Cloudinary
by default. This is the sharpest remaining dependency: if Cloudinary is
unreachable, *new* uploads fail (already-stored URLs keep serving from its CDN).

Mitigations in place:
- `STORAGE_DRIVER=local` switches uploads to the served `/uploads` directory —
  no third-party account (self-hosting / air-gapped / data-sovereignty). Delete
  routing keys off the URL shape, so switching drivers never orphans old files.
- **Caution:** local disk is *ephemeral* on serverless hosts (Vercel) — use the
  local driver only on a host with persistent storage, or point it at a mounted
  volume / object store. For managed hosting, keep Cloudinary or add an S3 driver
  alongside the existing two.

## Deploy — Vercel

The backend is a standard Express app run by `tsx`; the frontend is a static Vite
build. Neither needs Vercel — any Node host (Fly, Render, a VPS, a container
platform) works. `vercel-build` runs `prisma generate && prisma migrate deploy`,
so a fresh environment self-migrates. Containerising (a small Dockerfile) removes
the last of the deploy lock-in when needed.

## Rwandan connectivity

Low-bandwidth / intermittent networks are designed for, not patched around:
- **PWA**: the app shell is cached and installable; navigation works offline.
- **Live data is never cached** (`/api` is excluded from the service worker) so
  scores and standings are never stale.
- Self-hosted fonts and responsive images keep payloads small on mobile.

## Recovery runbook (quick reference)

| Incident | Action |
|---|---|
| Database down / corrupt | Restore latest dump to a new Postgres; update `DATABASE_URL`; redeploy |
| Pusher outage | None required — SSE already serves live updates |
| Cloudinary outage | Existing media still served; set `STORAGE_DRIVER=local` (persistent host) to keep accepting uploads |
| Vercel outage | Deploy the same repo to any Node host; run `prisma migrate deploy` |
| Secret leak | Rotate DB password + `JWT_SECRET` (invalidates sessions); see [`/SECURITY.md`](../SECURITY.md) |

## Key-person / bus-factor

Reduced by the hardening already in place: a working typecheck/lint/CI gate, a
unit + e2e + smoke test suite, a documented README, and the trust-critical logic
(standings, eligibility, document verification) extracted into small, **unit-tested**
pure modules so it is readable and regression-guarded rather than living in one
maintainer's head.
