# HANDOFF

## Current Task
Header language switcher, and the Amashuri overview against real data.
ADMIN IS NEXT — still untouched, a colleague is on it.

## Status
Solved. 14 routes clean at 1440px and 390px.

- **Language switcher in the header.** It only ever existed in the mobile drawer,
  so a desktop visitor could not read a NATIONAL platform with three official
  working languages in anything but English. Globe + the two-letter code, on the
  same hover panel as the Sports menu. Verified end to end: switching to
  Kinyarwanda re-renders the page and sets `<html lang="rw">`.
- **The Amashuri overview was built for demo-shaped data.** Seven sports, four
  competitions, five live matches. The real programme has ONE sport, ONE
  competition and nothing live, so: a lone tile at the left of an eight-column
  row, one competition card at quarter width, and — because the live section
  simply vanished when nothing was in play — no fixtures on the page at all.
  - The live section is now "Next up" when nothing is live, showing the next
    fixtures. A school sports page with no matches on it is not a page.
  - Grids use `auto-fill` with a minimum width. Capping the column COUNT was my
    first attempt and it was worse — a grid told to lay one item across two
    columns stretches it, so a single sport tile became a 550px square.
  - `LiveSchoolCard` hard-coded status ONGOING, so the new upcoming fixtures each
    wore a red "Live" pill. It reads the fixture now.
- **Plurals.** "1 Sports", "1 Competitions", "1 matches", "1 competitions" —
  across the Amashuri hero, the homepage sport tiles and the /sports index.

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
