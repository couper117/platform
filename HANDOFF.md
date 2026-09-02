# HANDOFF

## Current Task
Making the app work against the REAL API rather than the demo adapter.

## Status
Solved. All 19 public routes render clean at 1440px and 390px with no JS errors.

RUNNING IT
  npm run dev        backend + frontend (needs Postgres)
  npm run dev:demo    frontend only, mock data, no backend — port 5174
Local Postgres is `postgresql-x64-18` on port **5432**, not the 5433 the shared
.env assumed. apps/backend/.env is machine-specific and gitignored; both URLs
point at 5432 here. Database `rnsp` created, all migrations applied, seeded.

WHAT WAS ACTUALLY BROKEN — none of it was the UI, which is the same code in both
modes. Every difference was the data or the API:

- Prisma client had never been generated, so the backend crashed on import.
- The side rail attached itself to whichever league the SOONEST fixture belonged
  to. In demo that was always football, which has a table; against real data it
  was a volleyball tie whose league has no standings, so the rail fetched an
  empty league and left a dead 320px column. It now prefers a league that has a
  table (`_count.standings`, added to the leagues list) and the grid drops to one
  column when there is nothing to put in the second.
- `scroll-contain` never hid the scrollbar — it only set overscroll behaviour. On
  a phone the bar is a fading overlay so nobody noticed; on Windows it is a
  permanent grey trough, and it only appeared once the real API returned twenty
  sports instead of twelve and the chip row began to overflow.
- MatchCard truncated club names. Fine for "APR FC", useless for "Rwanda Revenue
  Authority VC" — half-width cards read "Rwanda Re… VS Kigali Volle…". Two lines
  now, then clip.
- No ad inventory: the seed had four rows under the old HOME_BANNER names while
  the app asks for 37 placements. `npm run seed:ads` books the lot.
- `/akc3/teams/:id` and `/akc3/athletes/:id` did not exist, so both Amashuri
  pages 404'd. Added, public, with a deliberate allowlist projection — AkcPlayer
  holds guardian names and phones, ID numbers, consent records and a disability
  flag for MINORS, none of which a spectator needs.
- `/teams/:id` was `protect`ed while the public directory links straight to it,
  so every visitor clicking a club got 401. Now `attachUser` + projection: it was
  returning the manager's email and phone and every player WITH their
  verification documents.
- The dev rate limit (300 / 15 min) is now 5000 outside production. A single page
  makes a dozen calls, so a few minutes of clicking exhausted it and every screen
  rendered its error state — which looks exactly like a broken backend.

## Progress
- [x] `scripts/make-ad-creatives.mjs` rebuilt: 6 sponsors x 3 shapes (-lg/-mb/-mr)
- [x] `PageAd` component; 15 page placements; 3 rail units
- [x] FixturesPage moved off the old `-leaderboard`/`-sidebar` position names
- [x] Ad book rewritten in mockData, generated from one PLACEMENTS table
- [x] Client photos installed, resized, ad creatives regenerated from them
- [x] Provenance recorded in both CREDITS.md files — these are NOT freely licensed
- [x] tsc clean, demo build green, 14 routes x 2 breakpoints audited in Chrome
- [ ] Commit and push to `Levi` (nothing pushed since the last batch)

## Working Notes
Verification runs against **the user's** dev server on `localhost:5174` — never
start one. Puppeteer-core + installed Chrome; `localhost`, not `127.0.0.1`.
`MSYS_NO_PATHCONV=1` for git-bash path mangling. A script that imports `sharp`
must live in (or be copied to) the repo root — node will not resolve it from the
scratchpad.

LICENCE WATCH: `hero/football.jpg`, `hero/basketball.jpg`,
`hero/basketball-finals.jpg`, `hero/basketball-women.jpg` and
`amashuri/youth-basketball.jpg` are client-supplied PRESS photographs, not
Commons. They carry `credit: null` so no false attribution is printed. The
originals they replaced are in git history. Both CREDITS.md files say so.

BEFORE COPYING A FILE INTO demo/app, check it was identical at HEAD. The demo's
LoginPage carries one-tap role buttons, its BottomNav had hardcoded labels, its
`api/endpoints/amashuri.ts` was a 12-export subset, and it has no CalendarPage at
all. Five near-misses so far; the placement script now checks before copying.

Long heredocs fail in this shell with "unexpected EOF" — write Python to a file
and run it.

rw/fr strings written here are demo-quality and have not been read by a speaker.

`scripts/check-demo-drift.mjs` reports two pre-existing drifts
(`src/styles/tokens.css`, `src/config/clubColors.js`) unrelated to this work.

Next step: nothing outstanding the user has named.

## Recently Completed
- School -> team -> athlete: `/amashuri/teams/:id` and `/amashuri/athletes/:id`,
  with `PlayerProfile` shared between club players and school athletes.
- Amashuri restructured into a section with a photo hero and category tabs;
  five verified Commons school photographs installed and credited.
- One navigation list across desktop bar, mobile drawer and bottom tab bar.
- All fourteen sport slugs have their own icon.
- Login side panel cross-fades the hero photography (`useHeroRotation`).
- Player pages with per-sport season stats and recent form.
- `mockAdapter` reads URL query strings and rejects on 4xx.
- Mobile fixtures density: first fixture 281px -> 237px, cards 148px -> 122px.
