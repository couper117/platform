# HANDOFF

## Current Task
Polishing the public pages against the real API. Admin is NEXT and untouched.

## Status
Solved. 18 routes clean at 1440px and 390px, zero broken images, no JS errors.

- **/fixtures all sports.** Three attempts to get right, and the lesson was that
  the GROUPING was the problem, not the card. By competition: twenty headings for
  forty-two matches, 5,074px. By day: worse, 7,255px — the schedule is forty-two
  fixtures across THIRTY-THREE days, so that axis is just as sparse. Plain rows:
  3,799px but forty-two identical grey stripes, flat and off-language. Now an
  ungrouped three-across grid of MatchTile, which already prints its own
  competition so it needs no heading: **3,113px**, and it looks like the app.
- **One card everywhere.** /fixtures scoped rendered MatchCard in two columns
  while the sport hub rendered MatchTile in three — two different cards for the
  same fixture, one click apart. Everything is MatchTile at three across now.
- **Every kickoff read 21:34.** `Date.now() + n days` stamped each showcase
  fixture with the moment the seed ran, so the schedule was a column of identical
  numbers. Real hours now — weekday evenings, weekend afternoons — in the seed
  and backfilled onto all 82 existing rows.
- **News images.** All six articles shared ONE remote Unsplash URL, and it did not
  load here at all: six broken-image icons. `seed:news-images` points them at the
  local photography the app already ships, matched by keyword to the story.
- **/calendar.** Gutter skyscrapers removed — a month grid is already a dense
  field of boxes and flanking it with two more vertical panels turns the screen
  into columns. Days with sport are tinted so the shape of the month reads, and
  the bare corner digit is a count pill rather than a second date.
- **"1 matches"** on the sport cards is pluralised.

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
