# Deploying to Vercel

Two Vercel projects from one repository: the frontend as a static build, the API
as a serverless function. They are separate projects because they have separate
build outputs and separate environment variables, not because they are separate
codebases.

| Project | Root directory | Output |
|---|---|---|
| `rwasport-web` | `apps/frontend` | static site |
| `rwasport-api` | `apps/backend` | serverless function at `/api/*` |

Set **Root Directory** in each Vercel project's settings — `apps/backend` and
`apps/frontend`, not `api`. The serverless entry lives at `apps/backend/api/index.ts`;
there is no `api/` at the repository root, and pointing Root Directory there gives
*"The specified Root Directory 'api' does not exist"*.

Leave **Include source files outside of the Root Directory** enabled. This is an
npm workspace: dependencies install to the repository root, and the Prisma client
is generated into the root `node_modules`, so a build confined to `apps/backend`
would not find them.

---

## Read this first: the deployment may refuse to serve

The API checks where personal data is stored before it answers anything. In
production, a database outside Rwanda with no declared NCSA certificate returns
**503 to every request**, naming the region it found.

That is deliberate. The platform holds schoolchildren's dates of birth, guardian
phone numbers and identity references, and Law N° 058/2021 arts. 48–50 does not
permit storing them offshore without a certificate. A deployment that served
anyway would be unlawful and silent about it.

Vercel's own regions are outside Rwanda, and so is a Supabase `eu-central-1`
database. To deploy you must either:

- host the database in Rwanda and set `DATA_RESIDENCY=rwanda`; or
- obtain the NCSA certificate, set `DATA_RESIDENCY=offshore` and
  `NCSA_REGISTRATION_NUMBER=<the number>`, and execute the processor contracts in
  `privacy/PROCESSORS.md`.

`DATA_RESIDENCY=rwanda` with an obviously offshore database is refused too — the
check compares the declaration against the connection string rather than taking
the declaration on trust. See `DATA_PROTECTION.md` §6.1.

---

## Check before you deploy

```
vercel env pull .env.production --environment=production
npm run preflight -- .env.production
```

It reports what would stop the deployment serving and exits non-zero if anything
would. Most of what goes wrong here is one wrong variable, and each of those
failures looks like something else once it is live: an offshore database returns
503 on every route, a macOS Prisma client fails on its first query as though the
database were down, and `STORAGE_DRIVER=local` loses every upload without erroring
once.

---

## Environment variables

Every key is validated at boot by `src/config/env.ts`; a missing or malformed
required one stops the deployment rather than failing later on a request.

**Required**

| Key | Notes |
|---|---|
| `DATABASE_URL` | Pooled connection (Supabase Supavisor port 6543, `pgbouncer=true`) |
| `DIRECT_DATABASE_URL` | Direct connection, port 5432. `prisma migrate` cannot run through a transaction pooler |
| `JWT_SECRET` | 32 characters or more |
| `DATA_RESIDENCY` | `rwanda` or `offshore` — see above |
| `NCSA_REGISTRATION_NUMBER` | Required when `DATA_RESIDENCY=offshore` |

**Strongly recommended on Vercel**

| Key | Why |
|---|---|
| `STORAGE_DRIVER=cloudinary` | The `local` driver writes to disk. Serverless disks are ephemeral, so **every upload is lost** when the instance recycles — logos, player photos and verification documents alike |
| `PUSHER_*` | Live updates fall back to Server-Sent Events, which hold a connection open. Serverless functions cannot; without Pusher the live match page stops updating on its own |
| `CRON_SECRET` | Gates the scheduled endpoints. Unset, they refuse everything |
| `FRONTEND_URL` | The deployed web origin, for CORS |

`AUTO_END_STALLED_MATCHES=true` enables closing matches a reporter left live.
Check first with `npm run matches:end-stalled`, which reports and changes nothing.

---

## What serverless changes

`server.ts` never runs on Vercel — the platform imports `api/index.ts` and calls
it per request. Three things moved:

- **The residency check** runs in `api/index.ts` instead, and holds its verdict
  rather than exiting. `process.exit(1)` in a serverless function kills one
  invocation and the next request starts fresh, so the deployment would keep
  serving while appearing to crash at random.
- **Competition rule seeding** runs once per cold start, fire-and-forget. A
  function that awaits it before its first reply is a function that times out.
- **The stalled-match sweep** was an in-process timer. There is no process to hold
  one, so `vercel.json` schedules `/api/v1/internal/cron/end-stalled-matches`. It
  is gated on `CRON_SECRET` and still honours `AUTO_END_STALLED_MATCHES`, so
  adding the schedule cannot by itself start ending matches on a deployment that
  never opted in.

  It runs **once a day at 03:00**, because a Hobby plan permits no more than that
  — a deployment on Hobby will refuse to build with a finer schedule. Daily is
  coarse for this job: a match a reporter leaves live can stay live for most of a
  day before anything closes it. On a Pro plan change the schedule to
  `*/10 * * * *`. Anywhere else, run `npm run matches:end-stalled:apply` from
  your own scheduler as often as you like.

Two limits remain, and neither has a workaround inside the function:

- **Server-Sent Events** (`/fixtures/:id/stream`) need a connection held open.
  Configure Pusher; the client already prefers it and falls back to SSE only when
  it is absent.
- **Rate limiting** counts in memory, so each instance counts separately and the
  limit is effectively multiplied by the number of running instances. A shared
  store is needed for it to mean anything under load.

---

## Migrations

`vercel.json` runs `prisma generate && prisma migrate deploy` at build time,
against `DIRECT_DATABASE_URL`.

The migration chain was repaired: eleven models had no `CREATE TABLE` anywhere,
so `migrate deploy` failed on any fresh database while local development carried
on working, because it had been built with `db push`. All migrations now replay
cleanly and the result matches `schema.prisma` exactly.

Seed a fresh database with `npm run seed:all`, which ends with
`seed-showcases.ts` so every sport has a fixture to look at.
