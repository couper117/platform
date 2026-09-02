# HANDOFF

## Current Task
Rebuilding the Amashuri match page, and taking the gutter rails off pages they
did not suit.

## Status
Solved.

- **`/amashuri/matches/:id` was the last pre-redesign screen in the public app.**
  Full-bleed saturated green-to-teal gradient, both school names in ALL-CAPS
  display type wrapping to three lines, an empty "MATCH SUMMARY" card and a
  four-row table floating in half a screen of green — plus its own private
  `SchoolBadge` / `ScoreDigit` / `initials()`, a third implementation of a
  scoreboard the app already had twice. It is the national match page now: same
  MatchScoreboard, MatchEventTimeline, MatchComments, same tokens.
- **`asFixture` is the whole trick.** The schools endpoint returns `competition`
  where the league one returns `league`, and its `homeTeam` is
  `{ id, school, ageCategory, gender }` with the name a level down. One adapter
  maps it into the shape the shared components already read — nothing forked.
- **Found on the way: `ONGOING` vs `LIVE`.** `matchState` only knows the league
  feed's word, so a schools match in progress fell through to "upcoming" and the
  scoreboard printed VS on a game being played. Now shows the live pill and 1-1.
  Checked against all three states — live, completed, scheduled.
- **The teams are destinations.** The old page's only outbound link was a "view
  school" line; both squads are one tap away now.
- **The gutter rails are opt-in per route.** Run-of-site looked wrong on half the
  app. `RAIL_ROUTES` allows the browsing pages — fixtures, live, results, calendar,
  leagues, teams, sports, news index, and the Amashuri list tabs. Everything else
  gets none: a single match, a player, an athlete, an article, a school profile,
  contact and the legal pages, where a column of advertising is the loudest thing
  on a screen the reader opened for one thing. Verified across 16 routes.

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
