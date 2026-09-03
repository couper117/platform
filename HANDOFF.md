# HANDOFF

## Current Task
Two streams, merged here because they landed on `main` within a day of each
other and neither is finished business for the other reader.

- **AI assistant** — built and verified end to end. Nothing outstanding.
- **Admin portal UI revamp** — in progress; the shell and template dashboard
  are committed, the fan-out across the remaining pages is not.

---

# AI assistant (done)

Building the in-app AI assistant: a floating chatbot grounded in the platform's
own data, and an admin section to configure which AI provider answers it.

## Status

Built, run and verified in the browser at both breakpoints.

- **It answers from the database, not from the model's memory.** Every question
  is answered against rows read seconds earlier: a cached one-minute snapshot of
  the platform (counts, sports, active leagues, live matches, the next 21 days of
  fixtures, recent results, top of each table, venues, school competitions, news)
  plus targeted lookups driven by the names in the question. Verified live — it
  reported Rayon Sports top on 13 points from 7 played, which is the seeded row.
- **The scope holds.** Crypto advice and "what is the capital of France" are
  declined warmly and redirected; a player who is not registered is answered as
  not on record. Greetings still work — an assistant that refuses to say hello is
  the other failure mode.
- **Seven providers, one shape.** Gemini (default), OpenAI, Anthropic,
  OpenRouter, Groq, Mistral, DeepSeek, and self-hosted Ollama for the case where
  nothing may leave the country. No SDKs — `fetch` and one adapter each.
- **The model is fetched, never typed.** 26 models listed from the live key in
  the console. Not decoration: Google's list endpoint advertises IDs it no longer
  serves, so a configuration assembled entirely from what the provider advertised
  can still 404 on first use.
- **Six real bugs, every one found by running it, none by reading it:**
  `gemini-2.0-flash` (the obvious default) does not exist on this key; a bad key
  returns HTTP **400**, not 401; a 16-token connection-test budget returns
  *nothing*, because reasoning is charged to the same allowance; the first real
  answer was cut off mid-Markdown-link and printed `([/leagues/2](/le` into the
  chat window; the model wrote paths as link text (`[/sports/football](...)`);
  and the console clipped a long provider error mid-word.
- **The truncation had a cause worth measuring.** On gemini-3.5-flash with a
  1400-token budget, reasoning consumed **1082** and the answer got 314 before it
  was cut off. Raising the budget does not help — the model simply thinks longer.
  Capping `thinkingConfig.thinkingBudget` at 128 fixed it and halved the latency
  (10.6s to 4.7s). Sent for Gemini only, with one retry without the field for
  models that reject it. A reply that is still cut short is now repaired before
  it renders, so half a link never reaches the screen.
- **Free-tier quota is per model, and that is load-bearing.** 20 req/min for
  gemini-3.6-flash, a separate 20 for gemini-3.5-flash. A 429 falls over to the
  next-best model and answers; only a model that is *gone* is written back to the
  configuration, so one busy minute cannot permanently overrule the
  administrator's choice. The public message is rewritten — visitors never see
  Google's billing and usage-dashboard links; administrators still get the full
  text, which is what they need.

## Progress

- [x] `services/ai/`: secrets (AES-256-GCM), providers, config, knowledge, chat
- [x] `GET /ai/status` + `POST /ai/chat` public; config/providers/models/test admin
- [x] New `ai.configure` capability — Super Admin only, deliberately not settings.write
- [x] `AssistantWidget` + a 4kB Markdown renderer (no react-markdown, no innerHTML)
- [x] `AdminAiPage` at `/admin/ai`, in the nav, translated EN/FR/RW
- [x] 32 new unit tests; 211 pass, typecheck + lint + build + drift green
- [x] README, SECURITY.md and the Admin Manual updated
- [x] Run end to end: both servers up, database migrated and seeded, widget
      driven at 1440px and 360px, admin page driven through fetch-models and
      test-connection ("Connection working", gemini-3.6-flash, 25 models, 7.6s)
- [ ] Nothing outstanding the user has named

## Working Notes

THE LOCAL DATABASE IS A PRIVATE CLUSTER ON PORT 5433, created for this work, at
`AppData/Local/rwasport-pg`. Start it before `npm run dev`:

    "C:/Program Files/PostgreSQL/18/bin/pg_ctl" -D C:/Users/DELL/AppData/Local/rwasport-pg -o "-p 5433" -l C:/Users/DELL/AppData/Local/rwasport-pg/server.log start

It is NOT a Windows service, so it does not survive a reboot. Why it exists: the
machine's only PostgreSQL is the `postgresql-x64-18` service on **5432**, whose
superuser password is not `postgres` and is not in the tree, while `.env` asks
for 5433, where nothing was listening. `initdb` needs no elevation, so a private
cluster was cheaper and far less invasive than resetting the password on the
shared server — which would have meant briefly setting `pg_hba.conf` to `trust`,
and which this shell cannot do anyway (not elevated: `Restart-Service` fails with
"Cannot open postgresql-x64-18 service"). A script that does that reset properly,
should the 5432 server ever be the one wanted, is in the session scratchpad as
`reset-local-pg-password.ps1`; it is not in the repo because `.gitignore` says a
script like that should not be tracked.

THE SEED SCRIPTS DO NOT LOAD dotenv. `npm run seed:all` fails with "Environment
variable not found: DATABASE_URL" unless it is exported into the shell first.
`prisma migrate deploy` is fine — the Prisma CLI reads `.env` itself.

The frontend dev server binds **5174**, not 5173. Both are on the CORS allowlist.

The provided Gemini key is a **free-tier** key and works. It is `AQ.`-prefixed
rather than the usual `AIza`, which is unusual but accepted by
generativelanguage.googleapis.com. Verification runs exhaust its per-minute quota
quickly, so the browser driver retries past a rate-limit reply rather than
screenshotting it and calling that a result.

Puppeteer is not installed and Playwright's browsers were never downloaded, but
Playwright itself is a dev dependency and Chrome is installed: drive it with
`chromium.launch({ channel: 'chrome' })`. Use `MSYS_NO_PATHCONV=1`, or git-bash
turns a `/` argument into `C:/Program Files/Git/`.

WATCH THE LINE ENDINGS. The working tree is CRLF. Writing files from Python with
`newline=''` silently converts them to LF, which git normalises away but the
demo-to-real drift check compares byte-for-byte. Everything touched here was
converted back.

Long heredocs fail in this shell with "unexpected EOF" — write Python to a file
and run it. Backslash escapes inside a heredoc'd Python string also get eaten:
`\b` arrived as a literal backspace byte in `providers.ts`, and `\n` inside a
regex arrived as a real newline. Write the snippet to its own file and splice it
in instead. A Windows path in a Python literal needs a raw string, or `\U` in
`C:\Users` is a syntax error. `cat -A` after any scripted edit.

rw/fr strings written here are demo-quality and have not been read by a speaker
— `portal.nav_ai` included.

---

# Admin portal UI revamp (in progress)

Admin portal UI revamp. The client's brief: "this admin pages look like SHIT — start
with the dashboard for ministry of sport, we need it looking like a admin portal,
fix its header, we don't need those nav links, nice icons with a nice search bar —
we will copy every other admin page based on this one."

## Status

In progress. The shell and the template dashboard are **done and committed**
(`6095aa1`). Six agents are fanning the template out across the remaining 43 admin
pages.

## Progress

- [x] `components/admin/AdminUI.tsx` — the shared kit: `PageHeader`, `StatCard`
      (+`.Skeleton`), `Panel`, `TableWrap`, `Th`, `Td`. Its header comment is the
      style contract every admin page is held to.
- [x] `components/admin/AdminTopBar.tsx` — the portal's own header, replacing the
      PUBLIC `Navbar` the admin shell was rendering. ⌘K search over
      `ADMIN_PAGES ∩ isAdminPathAllowed`, notifications, theme, account menu.
- [x] `Sidebar.tsx` + `AdminLayout.tsx` onto tokens (the black slab was the only
      dark panel left in a light product and did not follow the theme).
- [x] `AdminDashboard.tsx` rebuilt on the kit — **this is the template**.
- [x] Backend `GET /admin/activity-trend` (real daily counts, Kigali days) and
      `/activity?excludeModule=` (audit trail, not the visitor tracker's own noise).
- [ ] 43 remaining admin pages — agents in flight, see below.
- [ ] Visual pass over the fanned-out pages, then typecheck + build + commit.

## Working Notes

**Two fabricated statistics were removed from the dashboard.** The activity chart
drew a hard-coded `[30,38,45,52,…]` relabelled with today's dates; the health panel
listed five services permanently "Operational", including an email service the
platform does not run. On a ministry oversight screen a number that looks measured
and isn't is worse than no number. Both are now API-backed.

**A real timezone bug was fixed while wiring the chart.** Prisma stores `createdAt`
as UTC; the series keys were built from a *local* midnight via `toISOString()`, which
came out one date behind the SQL buckets — so today's activity matched no bucket and
the chart drew a flat zero line on a platform that was plainly in use. Both sides now
group by Africa/Kigali days.

**Known, reported, not fixed:** `middleware/visitorTracker.ts` writes one
`ActivityLog` row per API GET, because the frontend never sends the `X-Page-Path`
header the tracker was designed around. That is ~8k rows/day of write amplification
and it makes "platform activity" really mean "API calls". The dashboard now filters
it out of the audit feed, but the tracker itself still needs either a page-view
beacon or an API-path skip.

**Agent brief (all six share it):** presentation only — no changes to data fetching,
query keys, mutations, permissions or business logic; no new i18n keys and no edits
under `src/i18n/`; hands off `AdminUI/AdminTopBar/Sidebar/AdminLayout/AdminDashboard`,
`components/ui/`, and `demo/`; tables scroll inside `TableWrap` so the page never
scrolls sideways; `npx tsc -p apps/frontend --noEmit` clean at the end (the only
acceptable errors are the pre-existing `vitest` / `@testing-library` ones).

**Next step on resume:** collect the six agent reports, run the typecheck and the
frontend build once across the whole tree, screenshot a sample of the fanned-out
pages against the user's dev server on `localhost:5174` (Vite binds `[::1]`, so use
`localhost`, never `127.0.0.1`; log in as `admin` / `Manager@123`), then commit.

---

# Standing constraints

- **Never start a dev server.** The user is the only one who runs it.
- "Improve the UI, don't completely change it" — except the admin portal, where a
  revamp was explicitly asked for. Even there: same sections, same order, same
  controls; the visual language is what changes.
- The client rejected a desktop sidebar on the PUBLIC app; that treatment is
  mobile-only. The sidebar here is the ADMIN portal's and is wanted.
- Push over SSH port 443 (`ssh -p 443 -o Hostname=ssh.github.com`) — port 22 is
  blocked on this network.

# Recently Completed

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
