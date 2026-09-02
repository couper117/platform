# HANDOFF

## Current Task
Redesign `/teams`. Client complaint (verbatim): "please redo /teams UI".
Three defects confirmed at 1280 and 390: search box crushed to a ~40px circle
(shared a flex row with 13 sport chips), no club showed its sport (so
same-name-different-sport clubs like "APR FC"/"APR BBC"/"APR VC"/"APR
Handball" were indistinguishable), and a flat 9-row grid of near-identical
low cards.

## Status
Solved. New `TeamCard` (crest/name/meta + footer, LeagueCard's card shell)
with a mandatory sport badge, search moved to its own capped row, and
sport-sorted grid on `/teams`. `tsc --noEmit` and `vite build` both pass
clean from `apps/frontend` (only pre-existing `*.test.ts(x)` errors,
unrelated). Not committed — commits are the user's call.

## Progress
- [x] `src/components/team/TeamCard.tsx` (new) — `ClubCrest` at 56px (size
      `lg` + a className override; safe because every club logo here is a
      generated SVG, so nothing rasterizes at the wrong size), a sport badge
      beside it (icon + name, always shown — `team.sport` is `{ name, slug }`
      per `src/api/demo/mockData.ts`'s `sportRef()`), the club name as the
      strongest element, a `sport · city · founded year` meta line, and a
      footer strip ("View club" + chevron) — same three-zone shell as
      `LeagueCard`. Ships `TeamCard.Skeleton` next to it.
- [x] `src/pages/public/TeamsIndexPage.tsx` — search is now its own row
      (`min-h-tap`, `max-w-sm`, its own `<label>`) above the sport chip row,
      so the 13-chip scroll row can never share flex space with it again;
      chips match `FixtureFilters`' spec exactly. Grid `1 → sm:2 → lg:3`
      (was `2 → 3 → 4`, too dense to give a card room to breathe). While "All
      sports" is active, clubs are sorted (not grouped under headings — that
      pattern was already tried and reverted on `/leagues` for leaving
      near-empty rows) so each sport's clubs sit together; every card's own
      badge carries the identity regardless of filter state. Empty state
      gained a "Clear filters" action when search/sport narrowed the list to
      nothing (mirrors `/leagues`).
- [x] i18n: two new keys inside the existing `teams` object — `filter_sport`
      ("Filter by sport" — aria-label on the chip row) and `view_club`
      ("View club" — card footer). `TeamCard` also reuses the existing
      `team.founded_year` key (`src/pages/public/club/ClubLayout.tsx`
      already uses it) rather than adding a duplicate. Verified all three
      locales parse and have exactly one top-level `teams` (11 keys) and one
      top-level `team` (69 keys, untouched) object.

## Working Notes
Nothing outstanding on this task. Touched only the files the brief allowed:
`TeamsIndexPage.tsx`, the new `TeamCard.tsx`, and the three locale JSONs
(`teams` object only). `src/components/ui/`, `src/components/match/`,
`src/pages/public/club/`, `src/pages/public/sport/`, `App.tsx`,
`src/api/demo/mockData.ts`, `tokens.css`, `tailwind.config.js` were read for
reference (`LeagueCard`'s card shell, `ClubLayout`'s location/founded-year
formatting, `ClubCrest`'s size/className contract) but never edited. Note:
this working tree has substantial *other* uncommitted changes from
concurrent/prior sessions (visible in `git status` — App.tsx, akc3/,
amashuri/, sport/, club/, news/, etc.) that predate and are unrelated to this
task; left untouched.

## Other open work in this tree (unrelated — not touched, do not act on without asking)
A separate, uncommitted hero/landing-page rebuild is also sitting in this
working tree (real Rwandan photos in `apps/frontend/public/hero/`, credits in
that folder's `CREDITS.md`). Its header sub-task is unresolved: **two attempts
were already rejected and the header was reverted to byte-identical-with-main
— do not guess at it again.** Get explicit sign-off on which defect to fix
first: (1) the header overflows at 1280px — the "Register Team" pill clips and
"Amashuri Games" wraps to two lines; (2) eight icon+label pairs in one row
reads as a dashboard toolbar. Other known pre-existing issues noted from that
thread: `Footer.tsx`'s newsletter button clips at 1280px; `FixtureFilters.jsx`
pins under the header; `ReactQueryDevtools` ships unconditionally in
`App.tsx`; several sport tiles still use Unsplash stock instead of real photos.

## Recently Completed
- Redesigned `/teams` (own-row search, per-card sport badge, sport-sorted
  grid) (this session).
- Redesigned `/leagues` (photo-led cards, sport chips + grouping) and
  `/leagues/:id` (photo-band identity header) (prior session).
- Rebuilt `/matches/:id` to the new design system: lineups, better live mode,
  local comments (prior session).
- Hero + "Pick your sport" grid rebuilt with real Rwandan photography (prior
  session, uncommitted; header sub-task still open — see above).
- Structural UI audit of all 71 pages:
  https://claude.ai/code/artifact/907052ba-5793-413f-af55-aa2a751bd2dd
