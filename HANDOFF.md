# HANDOFF

## Current Task
Depth in the football data: recent form and head-to-head.

## Status
Solved — but the feature exposed that the dataset had no history to draw on, so
most of the work was making the demo's numbers real.

- **Head-to-head on the match page.** Previous meetings between the two clubs,
  the aggregate record as a three-segment bar, and each side's last-five form.
  Placed above the timeline, because a timeline is what happened and this is why
  you would watch — and on a fixture that has not kicked off it is the only
  content there.
- **Form in the league table**, as a column rather than behind the expander.
  `showForm` is a PROP, not a breakpoint: StandingsTable renders both full width
  on a standings page and inside a 320px rail on /fixtures, and both are desktop,
  so a `lg:` variant would have broken the no-horizontal-scroll rule the table was
  written to protect. Verified: 12 strips on the standings tab, 0 in the rail.
- **The dataset had no history.** 18 fixtures, 6 completed, exactly one repeated
  pairing and neither leg played — so head-to-head said "these two have not met"
  on every match in the app. `historyFixtures` now generates the matchweeks before
  this one by round-robin rotation, dated backwards: 115 results instead of 6.
- **The league table is computed from those results.** It used to be invented —
  `played: 18` for everyone, a won/drawn curve from the row index, and a hard-coded
  `forms[]` array dealt out round-robin. The table disagreed with the fixture list
  beside it, the form strip disagreed with both, and a demo whose numbers do not
  add up is one arithmetic question away from being caught. Table, form strips,
  head-to-head and /results now all fold over the same games.
- **Two corrections the derivation forced.** A flat random season put Marines FC
  top of the Premier League, which nobody following Rwandan football would read
  past; `STRENGTH` tilts the generator so APR and Rayon lead. And basketball was
  being ranked on football's 3-1-0, awarding draws in a sport that cannot draw and
  putting a -26 differential above a +36; `SCORING` gives each league its own
  system (FIBA 2-1-0 and wins-first for basketball).

Football now reads APR, Rayon, Police, Mukura, AS Kigali — a table a Rwandan
recognises.

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
