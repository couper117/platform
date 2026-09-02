# HANDOFF

## Current Task
The header overflowing in French and Kinyarwanda. ADMIN IS NEXT — untouched.

## Status
Solved. Zero clipping in all three languages at 1024 / 1280 / 1440 / 1920.

The header bar is capped at `max-w-6xl` (1152px) at EVERY viewport, so the
wordmark, seven nav links and the control cluster compete for a fixed budget that
does not grow with the window. The same seven links measure 477px in English and
621px in French — and the nav is `min-w-0 flex-1`, so the surplus was silently
clipped rather than overflowing visibly. Measured: 116px cut off in French, 74px
in Kinyarwanda, at 1280 and above. English fitted, which is why it went unseen.

Fixed structurally, so it does not depend on how long a word is in one language:
  · nav gap 20/24px -> a uniform 12px, and the left margin 16/32px -> 12/20px
  · nav labels 13px below `xl`, 14px above (the Sports dropdown trigger too)

Two labels were also wrong, not merely long: French `nav.leagues` was
"Championnats" (championships) and Kinyarwanda "Amarushanwa" (competitions), for
a destination that lists LEAGUES. Now "Ligues" and "Amaligi" — the borrowing
already used elsewhere in these files.

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
