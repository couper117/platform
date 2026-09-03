# HANDOFF

## Current Task
Host the backend Postgres on Neon: move the database off local Postgres onto the
Neon project `plain-hill-97449501` ("Rwasport"), branch `production`.

## Status
**Solved for the database.** Schema and data are live on Neon, the backend is
pointed at it, 171/171 backend tests and `tsc --noEmit` pass. Two things are
deliberately NOT done and need a human decision — see Working Notes:
the DATA_RESIDENCY compliance gate, and a stale Neon API key.

## Progress
- [x] `neon skills -y`, `neon mcp -y` (see the key caveat below).
- [x] `neon link --project-id plain-hill-97449501 --branch production` — wrote
      `.neon/` and a root `.env.local`, and appended `.env*` + `.neon` to
      `.gitignore` itself. Both are ignored; no credential is committable.
- [x] `neon config init`, `neon.ts` reduced to `defineConfig({})`, `neon deploy`.
      `neon config plan` first: "No changes — branch already matches the policy",
      so the empty policy is a no-op, not a teardown.
- [x] `apps/backend/.env` → Neon. POOLED endpoint (`-pooler`) for `DATABASE_URL`,
      DIRECT (no `-pooler`) for `DIRECT_DATABASE_URL`, because a transaction
      pooler cannot run migrations. Local Postgres kept as commented lines.
      Previous file saved as `apps/backend/.env.bak.local`.
- [x] All 15 migrations applied (`prisma migrate deploy`) — the DB was empty.
- [x] `npm run seed:all` — 66 teams, 417 players, 82 fixtures, 41 ads, 6 news,
      7 users, 9 settings. Seeds confirmed idempotent on the re-run.
- [ ] **Decide DATA_RESIDENCY** — blocks any production deploy.
- [ ] **Rotate the Neon MCP API key** — currently the wrong account's.

## Working Notes

**The account switch.** `plain-hill-97449501` is NOT visible from the Neon account
the CLI was first logged into (`getmorelev@gmail.com`, org "Levi", one project
"Tembera" / `soft-butterfly-15369979`, proxy `c-5`). It belongs to
`ikennykelvin75@gmail.com`, org "KELVIN" (`org-jolly-unit-85582526`), proxy `c-2`.
There is no `neon logout`; re-running `neon auth` overwrites the DEFAULT profile.
The browser session decides which account you get, so sign out of the Neon console
*first* — the OAuth flow times out after 60s, too short to also switch accounts.

**DATA_RESIDENCY is a real production blocker, not a nit.**
`services/dataResidency.service.ts` lists `.neon.tech` in `KNOWN_OFFSHORE`, and the
DB is `us-east-2` (Ohio). Verified by running the assessor against the live env:

    NODE_ENV=development -> level=warn  ok=true   (boots, logs a warning)
    NODE_ENV=production  -> level=block ok=false  (process.exit(1))

So the API will refuse to start in production until `DATA_RESIDENCY` is set. Under
Law N° 058/2021 art. 50 the honest value is `offshore`, which then requires a real
`NCSA_REGISTRATION_NUMBER`. **Left unset on purpose:** asserting a residency or
inventing a certificate number is a legal claim about schoolchildren's data and is
the operator's call, not the agent's. Options: obtain the NCSA certificate, host in
Rwanda, or accept a dev-only deployment. See `docs/DATA_PROTECTION.md` §6.1.

**The stale MCP API key.** `neon mcp -y` ran while logged in as the WRONG account
and minted account-wide key `3308124` (`napi_3fgpcg…`), writing it in plaintext
into eight agent configs (`~/.claude.json`, `~/.cursor/mcp.json`,
`~/.codex/config.toml`, `~/.gemini/` ×2, `~/.copilot/`, `~/.config/opencode/`,
VS Code). Re-running `neon mcp -y` after the switch said "Reusing the API key
already configured" and did NOT re-mint — the KELVIN account has no API keys at
all, so the MCP server is still authenticated as `getmorelev`. Two fixes:
`neon mcp --oauth` (writes the URL only, no key minted — preferred), or revoke and
re-mint. Key `3308124` can no longer be revoked from the CLI now that the account
has changed; it needs the Neon console signed in as `getmorelev`.

**Credentials in a synced folder.** `apps/backend/.env` and the new root
`.env.local` both hold the live Neon password, and the repo sits under OneDrive —
exactly what `apps/backend/.env.example` warns against in its opening comment. Two
files now hold the same secret; `.env.local` is unread by the backend (its
`dotenv.config()` has no path, so it loads `apps/backend/.env` from the workspace
cwd). Rotating the DB password in the Neon console is cheap if that matters.

**Not verified:** the API has not been booted against Neon — per standing
instruction the user is the only one who starts a dev server. Evidence used
instead: a Prisma client query through the app's own `.env` returning the row
counts above, plus the full unit suite and typecheck.

**Open follow-ups carried over, none blocking:**
  - `GET /akc3/schools` hard-filters `active: true`, so hiding a school removes it
    from the only list that could un-hide it — the Show toggle is unreachable.
  - `middleware/visitorTracker.ts` writes one `ActivityLog` row per API GET, because
    the frontend never sends the `X-Page-Path` header it was designed around
    (~8k rows/day). Needs a page-view beacon or an API-path skip.
  - `ReporterProfilePage`'s error branch is unreachable: the `isLoading || !form`
    guard runs first and `form` stays null forever on a failed fetch.
  - `AdminFixturesPage`, `LiveReportingPage`, `AdminNewsPage`, `AdminAdsPage` and
    `AdminSettingsPage` have no `t()` at all — hardcoded English, needs an i18n pass.
  - Several list pages show the empty state on a failed request rather than an
    error state.
  - `/admin/players` renders ~20,000px of unpaginated rows.
**To verify visually on resume:** the user's dev server on `localhost:5174` (Vite
binds `[::1]`, so use `localhost`, never `127.0.0.1`; log in as `admin` /
`Manager@123`).

---

## Standing constraints

- **Never start a dev server.** The user is the only one who runs it.
- "Improve the UI, don't completely change it" — except the admin portal, where a
  revamp was explicitly asked for. Even there: same sections, same order, same
  controls; the visual language is what changes.
- The client rejected a desktop sidebar on the PUBLIC app; that treatment is
  mobile-only. The sidebar here is the ADMIN portal's and is wanted.
- Push over SSH port 443 (`ssh -p 443 -o Hostname=ssh.github.com`) — port 22 is
  blocked on this network.


## Recently Completed
- In-app AI assistant grounded in the platform's own rows, with an admin
  section to pick the provider (`/api/v1/ai`, `AdminAiPage`, `AssistantWidget`).
- Admin staff-account creation, with a basketball reporter to prove it.
- Registering a player moved out of a dialog onto its own page at
  `/admin/players/create`; typechecks and builds, still owed a browser pass and
  one end-to-end registration.
- FRVB Serie A volleyball clubs, real crests for the eleven RPL clubs, and the
  Rwanda Basketball League with its clubs and squads.
- The whole admin portal onto one design vocabulary (`AdminUI` kit, `AdminTopBar`,
  46 pages), plus six fabricated statistics found and replaced with real data.
- Writing an article gets a page of its own: `/admin/news/new`, `/admin/news/:id/edit`.
- Header language switcher + i18n overflow fix (116px FR / 74px RW clipping).
- Amashuri main page: pluralised hero stats, grids that fit a sparse dataset,
  next-up fixtures when nothing is live.
- `/fixtures` all-sports desktop: ungrouped 3-col MatchTile grid, 3,113px (from
  7,255px at the worst attempt).
- `/calendar`, `/news` images, `/sports` match cards, standings table width.
- The Amashuri match page rebuilt on the shared MatchScoreboard/EventTimeline,
  and the gutter rails made opt-in per route (`RAIL_ROUTES`).
- School -> team -> athlete: `/amashuri/teams/:id` and `/amashuri/athletes/:id`,
  with `PlayerProfile` shared between club players and school athletes.
- Amashuri restructured into a section with a photo hero and category tabs.
- One navigation list across desktop bar, mobile drawer and bottom tab bar.
- Login side panel cross-fades the hero photography (`useHeroRotation`).
- Player pages with per-sport season stats and recent form.
