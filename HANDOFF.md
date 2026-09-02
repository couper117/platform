# HANDOFF

## Current Task
Standings pages, the all-sports fixture list, and the sport picker.

## Status
Solved. 16 routes clean at 1440px and 390px, no console errors.

- **The standings table gets the whole column.** It sat in a two-column grid with
  the scorers and an advert beside it, so a table ran ~600px of a 1100px page —
  and a four-team basketball league read as a fragment. Full width now, with the
  full column set (Form, P, W, D, L, GF, GA, GD, Pts) via a new `wide` prop; the
  scorers follow underneath. `wide` is a prop, not a breakpoint, for the same
  reason `showForm` is: the same component also renders in a 320px rail, and a
  `lg:` variant would put nine columns in it. The extra columns hide below `md`.
  The rail advert is gone with the rail; the page keeps its footer banner.
- **No table on "All sports".** A league table describes one competition; on a
  list that is deliberately every sport at once there is no league it belongs to,
  so whichever it showed was arbitrary. It returns as soon as the list is narrowed
  to a sport or a competition.
- **The sport picker.** Twenty sports, not the demo's twelve. Each chip carries
  its own icon so the rail is scanned rather than read; the sport you follow leads
  the list; and a fade at the right edge carries the "there is more" message the
  hidden scrollbar used to.
- **Found on the way: the wrong default competition.** Football's standings opened
  on "Kagame Cup Schools" — first in the API's order, no table — and told the
  reader "No table yet" while the Premier League sat one chip away. `primaryLeague`
  now prefers a competition that HAS a table, and among those the senior national
  one.

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
