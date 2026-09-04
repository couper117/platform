# HANDOFF

## READ THIS FIRST — the deployment at rwasport.vercel.app

Everything below was pushed. `main`, `origin/main` and `origin/Levi` all point at
`40ca1ed`. If the site still shows old content, the cause is a **Vercel project
setting**, not the repository — and there is now a way to prove which in seconds.

**Open `view-source:https://rwasport.vercel.app` and find:**

    <meta name="app-build" content="40ca1ed ...">

  · Says `40ca1ed` → Vercel IS serving the latest push. Anything still looking
    old is a stale service worker in that browser: hard-reload
    (Ctrl+Shift+R), or DevTools → Application → Service Workers → Unregister.
    The console also prints `RwaSport build <sha>` on load; if the meta tag and
    the console disagree, it is definitely the service worker.
  · Says an OLDER sha → Vercel is deploying something else. Check, in order:
      1. **Settings → Git → Production Branch.** If it is not `main`, pushes to
         main only ever make Preview deployments and the production URL never
         moves. `Levi` has been fast-forwarded to the same commit, so if the
         project tracks that branch it is now current too.
      2. **Settings → General → Root Directory.** Must be `apps/frontend`, OR
         left at the repo root — a root `vercel.json` was added in `369a30c` so
         both now work. Before that commit, a repo-root setting meant the SPA
         rewrite was never read, which 404s every deep link (/teams/:id,
         /players/:id) while the home page works. That matches the reported
         "the team individual page ain't there".
      3. **Deployments tab** — is the latest build FAILING? A failed build keeps
         serving the previous one, which looks exactly like "nothing changed".
  · No meta tag at all → the deployment predates `40ca1ed` entirely.

**Not the cause, each checked and ruled out:** the SPA rewrite exists in
`apps/frontend/vercel.json`; the generated service worker already calls
`skipWaiting()` and `clientsClaim()`; no `.env` and no `dist/` is committed; the
root `npm run build` really does produce `apps/frontend/dist`; and every commit
from the `Levi` line (`8becad2`, `485f8be`, `16f0b5f`, `b6d3918`, `5cb9b35`,
`3e58878`) was verified to be an ancestor of `main` — no work was ever missing
from main. `origin/Levi` on GitHub was merely stale, which is what made it look
that way.

**If the app loads but pages are empty**, that is a different fault: `VITE_API_URL`
is unset on Vercel, so `api/client.ts` and `authStore.ts` both fall back to
`http://localhost:5000/api/v1` and every request fails. Set it to the deployed
API, or set `VITE_DEMO=true` to run off the mock data.

**I could not verify any of this from here** — this sandbox reaches `vercel.com`
but not the deployment's IPs, so the live site was never fetched. The above is
diagnosis from the repository plus the build output, not a confirmed fix.

## Current Task
Put the admin portal's UI on the **match reporter portal**, and think each of a
reporter's features through properly rather than porting the two screens that
were there. Then: let a reporter upload their photograph, and fix the team-sheet
screen, which was letting them make the coach's decisions. Then the same for the
**club portal** — the coach's side — and link the two together.

## Status
**Solved.** The reporter portal is seven screens on the admin shell, typecheck is
clean, `vite build` succeeds and the 17 frontend tests pass. Nothing was verified
in a browser — per standing instruction the user is the only one who runs a dev
server. One backend defect was found and deliberately NOT fixed; see below.

## Progress
- [x] **Shell.** `ReporterLayout` was still stacking the PUBLIC `Navbar` + a grey
      "Reporter Menu" strip + the sidebar — the exact three-band arrangement
      `AdminLayout` was rebuilt away from. It is now the same shell: full-height
      `Sidebar type="reporter"`, `AdminTopBar` spanning the working area, and
      `main p-4 sm:p-6` on `bg-surface-2`.
- [x] `AdminTopBar` generalised with three optional props — `pages`, `badge`,
      `menuLabel`. Omitted, it behaves exactly as before. The reporter passes its
      own six routes, because every entry in `ADMIN_PAGES` would refuse them.
- [x] **Nav grew from 2 items to 6**, grouped Main / Match day / You, with a
      footer panel answering a reporter's two standing questions (am I marked
      free, where am I next) — `components/reporter/ReporterSidebarFooter.tsx`.
- [x] **The console is a route**, `/reporter/match/:id`, not component state.
      Refreshing at the 70th minute used to dump the reporter back to a picker.
- [x] Seven pages under `src/pages/reporter/`: Today (`/reporter/dashboard`, kept
      because `roleHome()` points there), My matches, the match console, Team
      sheets, Results & sign-off, Reporting guide, My profile (moved out of
      `pages/admin/`).
- [x] Shared foundation: `api/endpoints/reporter.ts`, `lib/reporterMatch.ts`
      (readiness/closeout/time helpers), `hooks/useReporterFixtures.ts` (one
      query, six derived buckets), `components/reporter/ReporterUI.tsx`.
- [x] `pages/admin/LiveReportingPage.tsx` **deleted** — the console supersedes it
      and nothing referenced it. `git show HEAD:...` restores it if needed.
- [x] Demo mode covered: `reporterId` needs no filter (the demo reporter covers
      the whole schedule), `GET /reporters/me` added to the mock adapter, and
      `buildFixtureDetail` now emits a `clock` so a demo live match ticks.
- [x] i18n: 10 keys added to `portal` in en/fr/rw. Purely additive.
- [x] **Live console reworked** after the user said the bottom bar was wrong.
- [x] **Reporter photo upload.** `PUT/DELETE /reporters/me/avatar`, a `PhotoPanel`
      on the profile page, browser-side downscaling, demo-mode support.
- [x] **Team sheets reframed** around the coach owning the decision.
- [x] **The console speaks each sport's language.** `EventType` extended, the
      score weighted, `config/sportEvents.ts` drives the actions, the capture
      sheet, the feed labels and the statistics fields.
- [x] Migration `20260903160000_sport_specific_event_types` **applied to Neon
      production** (the user chose "run it now"), and verified against live data.
- [x] **Club portal rebuilt on the same shell**, nine screens (1,026 → 4,472
      lines), and cross-linked with the reporter portal.
- [ ] Nothing outstanding. Two known limits, both deliberate and both written up
      below: the match CLOCK is still halves-only for every sport, and document
      upload shows a busy state rather than a true percentage.

## Working Notes

**Two capabilities had no UI at all.** A `MATCH_REPORTER` holds exactly three
server capabilities (`capabilities.rules.ts`): `fixtures.report`,
`fixtures.lineups`, `reporters.profile`. Only the first and third had screens.
That is why a reporter's player dropdown said "No line-up published for this
team" and offered no way out — every goal that match was credited to nobody and
never reached a scorer's tally. `/reporter/lineups` is that way out, and
`saveStats` got a form for the first time.

**Why the "End live reporting" bar is gone.** `fulltime` goes through the *same*
clock endpoint as `halftime` and `resume` — it is the third of three transitions,
not an exit from the software. It now lives in `NEXT_STEP` inside `ClockStrip`,
which shows exactly one button, whichever transition is next. A side effect worth
keeping: full time is now *unreachable* before the second half, which no
confirm-dialog wording achieves as reliably. The thumb zone it vacated went to
`ActionDock` — the four things a reporter does twenty times a match.

**Event capture is taps, not a form.** `EventSheet` is a bottom sheet whose LAST
tap is the publish. Goal = 2 taps (team, scorer); card = 3 (colour, team,
player); sub = 3 (team, off, on). Goal/Penalty/Own goal are three real event
types, offered as chips. "Player unknown" publishes unattributed, which the
server has always allowed. Undo in the feed still restores score, tally and
suspension server-side, so speed costs nothing in correctness.

**The dock is a phone idiom, and it stays one.** The user liked the docked action
bar on a phone and not on a desktop, which is right: above `lg` there is no thumb
zone, the viewport holds the clock, the actions and the feed at once, and a bar
stretched across the foot of a 1440px window is a borrowed gesture. `ActionDock`
is `lg:hidden`; the same `ActionButtons` render inline under the clock at `lg`.
The capture sheet follows the same rule — bottom-anchored on touch, a centred
dialog above `lg`, centred with FLEX rather than `translate` because `animate-in`
animates transform back to none and would drop it into a corner after 200ms.

**The photograph: `User.avatar` was read in three places and written in none.**
The reporter directory a league admin picks from, the "reported by" credit on the
public match page, and the portal's own account menu all read it; nothing ever
set it, so every reporter was permanently a set of initials. It is its own
endpoint rather than a field on `PUT /reporters/me` because it writes `User`, not
the `ReporterProfile` row, and because a photo applies on selection where the
rest of that form is typed and then saved. `syncUser()` runs after a successful
upload so the account menu updates without a reload.

**Photos are shrunk in the browser first** (`utils/downscaleImage.ts`). A phone
camera produces 3–12MB for an avatar rendered at 40px; on a district ground's
connection that is a minute of upload, and anything over 8MB failed outright
after the wait. It becomes ~40KB of WebP. Every failure path returns the original
file — this makes the common path fast, it is not a validation layer, and the
server still resizes and enforces its own limit. `fitWithin` is unit-tested; the
canvas half is not, because jsdom has no canvas and mocking it would test mocks.

**Multer errors were 500s.** `LIMIT_FILE_SIZE` carries a `code` but no
`statusCode`, so an oversized upload surfaced as "Internal Server Error" in
production — for the single most likely upload failure in the product. Mapped to
413 in `errorHandler.ts`, which fixes it for documents, players, teams and news
uploads too.

**Team sheets: the coach decides, the reporter transcribes.** The first version
of `/reporter/lineups` opened straight into an editable squad with a formation
picker, which invited a reporter to choose a shape and an eleven on the coach's
behalf — the user's words: "REPORTER AINT THE ONE SUPPOST TO SET THE TEAM
STARTERS AND BENCH ITS THE COACH". The page now has two states per team and
reading is the default: `SheetOnFile` renders what was filed, read-only, with a
quiet "Doesn't match the paper sheet? Correct it"; `NoSheetYet` says whose job it
was before handing over the pen. Editing is opt-in per team and exits on save.
Field labels are transcription ("Formation as written", "leave blank if the coach
did not give one"), never selection.

**What that screen still cannot say.** `MatchTeamSheet` records no author, so
"sheet on file" is as far as honesty goes — it cannot claim the coach filed it
rather than a reporter last week. A `submittedById` column would let it say
which, and is worth adding when the club portal is next touched. Deliberately not
done here: it is a migration against the Neon production branch, and the ask was
the reporter side.

**The console spoke only football, and the data layer was why.** Its four
buttons were Goal, Card, Sub, Note, and the goal sheet offered Goal / Penalty /
Own goal. A basketball reporter had a yellow card and a one-point "goal" — neither
exists in the game they were watching — and no way to say three-pointer or foul.
Worse, the public timeline (`components/shared/matchEventMeta`) had ALREADY been
written to display three-pointers, fouls and timeouts, and nothing in the product
could create one.

  · `EventType` gained 13 values (migration above, additive only): TWO_POINTER,
    THREE_POINTER, FREE_THROW, DUNK, FOUL, TIMEOUT, SUSPENSION, SEVEN_METRE,
    SET_WON, TRY, CONVERSION, PENALTY_KICK, DROP_GOAL.
  · **The score was a COUNT of events**, correct only where every score is worth
    one. `EVENT_POINTS` in `matchEvents.service.ts` weights it, so a basketball
    game that really finished 58-61 no longer comes out 24-27. `GOAL_TYPES` is
    now derived from that table, so a type can never be scoring-but-weightless.
    `recomputeTopScorer` counts points for the same reason.
  · `config/sportEvents.ts` is the single vocabulary: it drives the action bar,
    the capture sheet's steps, the feed labels and which `MatchStat` columns a
    sport is asked for (a basketball reporter is no longer asked for corners,
    offsides and goalkeeper saves). An undescribed sport falls back to a GENERIC
    set, deliberately not football's — football's is the one most likely to be
    actively wrong.
  · Basketball is the only sport with five actions; the dock's column count
    follows the sport.
  · Discipline was already gated to RED_CARD/YELLOW_CARD, so a basketball foul
    and a handball two-minute suspension correctly build no match ban.

**Volleyball is scored by the SET here, not by rally points.** A fixture's
`homeScore` is sets won — that is what the seeded data holds — so `SET_WON` is
the scoring event and a point is deliberately not one. Logging points would
produce a number that is neither the set score nor the point score.

**THE CLOCK IS STILL FOOTBALL.** `matchClock.logic.ts` is two 45-minute halves
for every sport: basketball's quarters and volleyball's sets do not exist in it,
and the frontend `utils/matchClock.ts` and the public match page read the same
model. Labelling a basketball period "Q1" in the UI would print something the
stored data does not contain, so nothing pretends otherwise. This is the next
piece of sport-adaptivity and it is a real one — it touches the shared clock, its
unit tests, `LiveMatchState` and the public side.

**The 22P02 that broke scoring, and the lesson.** Shipping the weighted
`GOAL_TYPES` while the migration was unapplied made `recomputeScore` send enum
values Postgres did not have, so EVERY goal in EVERY sport 500'd at the recount —
`invalid input value for enum "EventType": "SEVEN_METRE"`. The event row is
written before the recount, so nothing was lost and the next recount self-heals.
Verified after deploying: the failing query matched 98 scoring events and
`recomputeScore(fixture 4)` returned `{ home: 2, away: 1 }`. Generating a Prisma
client against a schema whose migration has not been deployed is the trap.

## The club portal, and the seam between the two

**It was the last portal on the old shell** — the public `Navbar`, a grey strip
with a menu button, then the sidebar; and every page still in the pre-redesign
dialect. It is now the same `Sidebar` + `AdminTopBar` as admin and reporter, and
the nav is grouped the way a season is: Main (Today · Matches · Team sheets),
Squad (Squad · Documents · Staff), Club, You. The club profile used to sit second
in a flat list of six — the thing a coach edits once a year, above the two they
touch every week.

**New screens:** `/team/match/:id` (the coach's counterpart to the reporter
console — our sheet and who filed it, who is covering us, the read-only feed in
the sport's own words, "Follow it live" out to `/matches/:id`), `/team/staff`,
`/team/account`.

**`MatchTeamSheet.submittedById`** (migration written AND deployed) closes the
gap flagged in the previous pass. A sheet can be written by a coach from the club
portal or a reporter from the touchline, and the two were indistinguishable. Now
the reporter reads "The coach filed this — nothing to do here" vs "Recorded at
the ground by X — worth a check against the paper sheet", and the coach reads the
mirror image. `lib/teamSheet.ts` holds that helper because it is the seam BETWEEN
the portals, not a fact belonging to either — putting it in one would have meant
the other importing a module written for a role it does not hold.

**The photograph moved to `/auth/me/avatar`** with plain `protect`. Gating it on
`reporters.profile` said only a match reporter may have a face; the coach needs
the identical control, so the endpoint moved to the account rather than being
copied. It is what makes "who is covering us" show a person instead of initials.

**Two defects found while wiring it up, both mine, both fixed:**
  · `GET /fixtures` returned no line-up information, so every club fixture row
    warned "No team sheet" — including for matches already filed. A warning that
    is always on is one nobody reads. The list now carries a compact
    `teamSheets` (two integers per fixture, not thousands of player rows), and
    `sheetFor` distinguishes *unfiled* from *cannot say*: a response with neither
    renders no chip at all rather than guessing.
  · `MatchDetailsPage` keyed its query on the raw string route param while every
    other screen keys on a number. react-query matches by value, so a coach
    filing a sheet invalidated a key the public match page did not hold, and a
    tab left open kept showing the old side.

**Two demo bugs found on the way.** `/documents/requirements` returned a bare
array where the API returns `{ requiredDocTypes }`, so every caller read
`undefined` and the club portal reported no player missing any paperwork — a
clean bill of health, in the build used for pitching, computed from a shape
mismatch. And `/officials` ignored `teamId`, which would have shown a coach every
official on the platform.

**The one real asymmetry between the portals**, and both sides now explain it: a
coach's team sheet LOCKS at kick-off (the server returns 423 to a TEAM_MANAGER)
while a reporter may still fix one mid-match, because a late announced change has
to be recordable from the touchline. Neither screen shows a disabled form — they
say where the change goes.

**Fields the club profile CANNOT save, and why they are absent.** `district`,
`primaryColor`, `secondaryColor` and `registrationNo` are real columns on `Team`,
but `updateTeam` never destructures them off the request body — an input for any
of them would silently discard whatever a coach typed. They are therefore not on
the page. This is pre-existing (the old profile page did not offer them either),
not a regression, and NOT fixed here because the ask was the coach portal, not
new club fields. The fix is three names added to the destructure at
`teams.controller.ts:208` plus the matching keys in the `data` block — colours
are worth it, since the platform already seeds them (`npm run seed:colors`).
`registrationNo` probably should stay admin-only: a federation assigns it.

Two smaller ones in the same controller: there is no path that CLEARS a crest
(`logo` is only replaced when a file is on the request), and `foundedYear` cannot
be cleared once set (`foundedYear ? parseInt(…) : undefined`).

**`OfficialRole` is a hard Prisma enum** — PRESIDENT, VICE_PRESIDENT, SECRETARY,
TREASURER, MANAGER, HEAD_COACH, ASSISTANT_COACH, TEAM_DOCTOR, OTHER. The Staff
page ships a closed Select of the nine; a free-text "other" box would 500 on
Prisma validation, and OTHER is the schema's own escape hatch.

**The team sheet's `coachName` is free text, not a link to `TeamOfficial`.** The
Staff page's copy says "the head coach you put on a team sheet" rather than
implying the two are connected, because they are not.

**The dashboard was rebuilt a second time, and the first one deserved it.** It
was the reporter's "Today" with club data poured in — a live slot, a next match,
four counting tiles — which is the right shape for "what am I covering" and the
wrong one for running a club. A coach on a Tuesday saw an empty live card and
four admin figures. The user picked the shape from three sketches before any code
was written; it is now:

  1. `SeasonStrip` — crest, club, competition, POSITION, points, W/D/L, goals,
     form. `/teams/my` had been returning the full league table all along and no
     version of this page had ever touched it.
  2. The next match with its readiness, the team-sheet action, and who is
     covering it.
  3. Squad and documents, counted as PLAYERS not as document rows — a coach
     counts people. "Players not cleared", not "5 outstanding".
  4. "Around us" — the club's row plus the one above and below, which is the only
     part of a table that changes what a coach does this week — and the last five
     results as W/D/L.

**Position comes from `GET /leagues/:id`, not from arithmetic on this page.**
`/teams/my` includes standings but unordered and without the other clubs' names,
so ranking them here would mean re-implementing the server's comparator
(points → goal difference → goals for, `leagues.controller.ts:70`) and the first
time the two drifted a coach would read 3rd here and 4th on the public table. The
league endpoint already sorts and attaches `rank`. `FormStrip` is reused from the
public standings table for the same reason.

**A demo gap this exposed:** `buildLeagueDetail` never attached `rank` (the
dedicated `/standings` route did, the detail route did not), so in demo mode the
position would silently vanish and the mini-table would render blank numbers.

## Documents: rebuilt, and two defects behind it fixed

**The page was correct and unusable, which is worse than wrong.** One expanded
card per player with a row per requirement: 24 players x 4 documents is 96
stacked rows, in which the three players actually blocking the team sheet look
exactly like the twenty-one who are fine. No filter, no search, and every upload
went through a modal — pick player, pick type, pick file, confirm — four
interactions, ninety-six times, to onboard a squad.

It is a REAL grid now, above `lg`: a table with one aligned column per
requirement, and each column's own completion in its header ("Medical 14/24").
That header count is what a grid buys over a card list — it turns "everyone is
missing something" into "the medicals are the bottleneck", which is one call to a
doctor rather than fourteen conversations. Below `lg` it stays cards, because a
four-column table on a 360px screen is a horizontal scroll. The player column is
`sticky left-0` so a name never scrolls away from its row.

A middle version stacked cards with chips wrapping under the name — it fixed the
workload but nothing lined up, so a column could not be scanned. That was the
"not professional" complaint and it was correct.

The summary band leads with players, not paperwork: a large `18 / 24`, the
percentage, the bar, and four tallies (approved / in review / rejected / not
uploaded) saying where the work is. **"Needs attention" is the tab that opens**. Tapping a chip opens the file picker
with the player and type already known and uploads on selection — nothing is left
to confirm once you have chosen a file for a named slot. Chips carry their own
spinner so several upload at once. The headline is "18 of 24 players cleared",
not a count of outstanding document rows: a coach counts players.

**TWO DEFECTS THAT MADE IT UNUSABLE WERE NOT IN THE PAGE AT ALL.** Both in
`storage.service.ts`, both verified by running them before and after:

  · **A PDF 500'd.** `middleware/upload.ts` has always admitted
    `application/pdf` — a scanned certificate is usually one — and every upload
    then went through sharp, which answers a PDF with "Input buffer contains
    unsupported image format". New `uploadDocumentFile` stores a PDF as it came:
    no resize, no re-encode, nothing sharp can fail on. Cloudinary gets
    `resource_type: 'raw'` so it stays a PDF rather than being rasterised.
  · **Images were cropped to a square.** `uploadImage(file, 'documents', 800,
    800)` uses `fit: 'cover'`, so a photograph of an A4 page lost its top and
    bottom — the header, the stamp and the signature. The reviewer then rejected
    it as unreadable and the club uploaded the same page again. That is the
    reject-and-reupload loop, and it was arithmetic. Documents now use
    `fit: 'inside'` at 1600 with `withoutEnlargement` and `.rotate()` for EXIF.
    Verified: a 1240x1754 page stores as 1131x1600, aspect 0.707 preserved
    exactly, where it used to become 800x800.

**Known limit, deliberate:** document upload shows a busy state per chip, not a
percentage. `uploadDocument` takes only a `FormData`, so there is no
`onUploadProgress` to draw a real figure from, and a fake bar would be a lie on a
slow link. One-line fix if wanted: add an `onProgress` callback to that endpoint.

**SUSPENSIONS — an earlier note in this file was WRONG and is corrected here.**
It said a coach cannot see them at all. That is true only of the LIST endpoint:
`GET /suspensions` is gated on `suspensions.read`, which a TEAM_MANAGER does not
hold. But `GET /players/:id` includes `suspensions: { where: { active: true } }`,
and `privacy.service.ts` puts TEAM_MANAGER in `PERSONAL_DATA_ROLES` — so a coach
receives the UNREDACTED record for their own squad, active bans included. The
player profile page at `/team/players/:id` is built on exactly that, and is the
only screen a club can see a ban on before the team sheet is refused by name.

What is still true: it costs one request PER PLAYER, so a squad-wide "available
players" figure would be 24 requests and the dashboard still does not print one.
Closing that properly means either the players LIST including an active-suspension
flag, or `/teams/my` carrying it — the second is smaller and leaks nothing.

## The formation board — /team/formation

A coach picks a side on the surface the sport is played on, and sends it to the
match. Tapping an empty slot lists the players who play there first: `roleAffinity`
in `lib/formation.ts` scores every squad member against the slot's role — exact
for a listed position, then the same area of the surface, then everyone else. It
ORDERS, it never restricts, because coaches play people out of position all the
time and a tool that argued would be wrong.

**Geometry is shared, not cloned.** `buildSlots`, `rowsFor`, `parseFormation` and
`roleRank` moved out of `components/match/FormationPitch` into `lib/formation.ts`,
and that component now imports them. Two copies would drift, and the drift would
show as a coach placing a striker on the board and seeing them a row lower on the
public match page.

**Slot roles are derived for football and fixed for everyone else.** Basketball,
volleyball and netball declare `positions` in `playingSurfaces`; football cannot,
because whether a slot is a defender or a midfielder depends on the shape. So
football's are derived from the rows (first row of one is the goal, last is the
attack, the row after the goal is the defence, the rest is midfield) and a
different formation genuinely produces different slots.

**Tap, not drag.** A drag is the obvious way to copy a console game and the wrong
one here: it fights the page's scroll on a phone, has no keyboard equivalent and
gives a screen reader nothing. Two deliberate taps work one-handed and announce
themselves.

**The picker is a Modal over the board, not a side panel beside it.** The first
version swapped a permanent right-hand panel between "your side" and the player
list, which cost the board a third of the screen for a list nobody reads and put
the picker nowhere near the slot it was filling. `Modal` also already owns the
scrim, the scroll lock, Escape, the focus trap and returning focus to the slot
that opened it — all of which the bespoke panel would have had to reimplement,
and did not. "Fill by position" and "Clear" moved to a toolbar beside the shape
chips; the captain toggle moved into the picker, where the player is.

**It saves through the same `PUT /fixtures/:id/lineup`**, so "send to the match"
is not a second concept — filing a side here IS filing the team sheet, the
reporter sees it immediately, and the kick-off lock (423 for a TEAM_MANAGER)
applies exactly as it does on the sheet editor. `/team/lineups` stays: it is a
LIST, which is the right tool at 14:50 when one name has to change, and the tool
a reporter can use from a touchline in the rain.

**A latent crash fixed on the way:** `ClubCrest`'s `shortName(team = {})` only
defaulted an UNDEFINED argument, so any caller holding a `null` team — a nullable
`fixture.homeTeam`, a club portal with no club — threw on `team.shortName`.
Normalised inside, which covers every caller.

## Squad and the player profile

`/team/players` is a wall of faces — a photo grid by default with a list/table
toggle remembered in `localStorage` (try/catch on read AND write; it throws in
some privacy contexts). Search, position filter, and a camera on every card that
uploads that player's photograph in one tap: `downscaleImage`, then
`updatePlayer(id, {}, file)` with an EMPTY field set, so a photo upload can never
trip the eligibility rules and be refused for something the coach did not do.

`/team/players/:id` is the player in full, and exists as a page rather than a
modal because of section two: **can this player play?** Active suspensions plus
document clearance, in one answer.

**AN EARLIER NOTE IN THIS FILE WAS WRONG about suspensions** — corrected above.
A coach cannot use `GET /suspensions` (gated on `suspensions.read`), but
`GET /players/:id` includes active ones and `privacy.service.ts` puts
TEAM_MANAGER in `PERSONAL_DATA_ROLES`, so a club DOES get them for its own squad.
That is the whole reason this page earns its place: without it the first a club
hears of a ban is the team sheet being refused by name at filing time.

The season editor is the EXISTING `components/admin/PlayerStatsModal`, imported
rather than rewritten — it already takes its field spec from the server, so a
basketball player is asked for points and rebounds and a footballer for goals and
cards, and adding a stat to the spec makes it enterable without touching the UI.

**Cross-page cache.** The squad page invalidates `['team-player', String(id)]` on
photo, edit and remove. The profile keys on the id as a STRING (what `useParams`
gives) and deliberately NOT on the public page's `['player', id]`, because
`api/endpoints/players.ts` caches the whole `{success, data}` envelope while
`team.ts` returns `data.data` — two shapes under one key is a rendering bug.

**A bug in my own documents page, found by this work and fixed:** `stateFor`
sorted competing uploads by `d.createdAt`, and `PlayerDocument` has no such
column — it is `uploadedAt`. Comparing NaN to NaN left the order arbitrary, so a
player holding a rejected copy AND a newer pending one could show either, and
"Rejected" is the state carrying the reviewer's note and the coach's next move.

**Backend limits these pages work around rather than hide.** `PUT /players/:id`
writes `dateOfBirth`, `jerseyNumber`, `height` and `weight` as
`value ? coerce(value) : undefined`, so a blank is a silent no-op and none of the
four can be CLEARED from the UI; `idNumber` and `licenseNo` use
`!== undefined ? (value || null)` and clear correctly. Both pages say so at the
field instead of letting a form pretend it saved. There is also no way to REMOVE
a photograph (`photo` is only replaced when `req.file` is present), and no
endpoint writes `PlayerCareer` at all, so career history is read-only. Fixing the
first needs the controller to tell an absent key from an empty one, which
`playerForm` on the client already does.

**Removing a player is a soft deactivate** (`active: false`), not a delete — the
confirmation says so. `active` is deliberately absent from the details form:
two controls for one destructive effect, one of them a switch, is how a squad
loses a player by accident.

## Two club pages removed as repetitive — and what moved first

`/team/documents` and `/team/lineups` are gone. Neither was deleted before its
unique capability had somewhere else to live:

  · **Document upload moved onto the player profile.** The documents page showed
    the same clearance the profile already showed, but it was the ONLY place a
    club could actually send a file — the profile merely linked to it. So the
    repetition was the display, and the fix was to make the row that reports a
    gap the control that closes it: tapping a missing or rejected document on
    `/team/players/:id` opens the picker with the player and type already known.
    What is genuinely lost is the squad-wide matrix and its per-column completion
    ("Medical 14/24"), which is worth remembering if the bottleneck view is ever
    missed.
  · **The suspended-player marking moved onto the formation board.** The sheet
    editor marked the ids the server names in its 409; the board only recited the
    sentence. It now does both, so a coach does not have to match three names
    against a squad of twenty-five.

`/team/formation` inherits the "Team sheets" nav label — it is what a coach calls
the thing and it is now the only screen that files one. THE REPORTER KEEPS ITS
OWN list-shaped editor at `/reporter/lineups`, and should: it is used from a
touchline in the rain to transcribe paper, which is the one place a tactics board
is the wrong tool.

Every inbound link was rewired, including `matchTasks().to` in lib/coachMatch
(and its test), the sidebar footer's "file it" prompt, the match page and the
dashboard. `grep -rn "team/lineups\|team/documents"` returns only historical
prose in two header comments.

**A backend defect found, reported, NOT fixed.** In
`apps/backend/src/controllers/fixtures.controller.ts`, `saveResult` writes
`homeScoreHt ? parseInt(...) : null` and the same for `awayScoreHt` and
`attendance`. A genuine 0–0 half-time score, or an attendance of 0, is stored as
`null`. Consequence for the new work: those matches show "Half-time score" as
permanently outstanding on the sign-off checklist. Fix is `!= null && !== ''`
instead of truthiness. Left alone because the task was UI and the change touches
result-recording semantics.

**Verified.** Frontend `tsc` clean, `vite build` clean, 34/34 frontend tests
(`fitWithin`, plus `sportEvents` pinned against copies of the server's enum,
weights and MatchStat columns — drift there is otherwise silent until a reporter
taps something mid-match). Backend `tsc` clean, 219/219 tests, including
`eventPoints.test.ts` which reconstructs a 58-61 basketball scoreline from real
events.

Latest pass: frontend `tsc` clean, `vite build` clean, **63/63 frontend tests**
across 7 files (15 new in `coachMatch.test.ts` — the side a fixture is read from,
unfiled vs. cannot-say, who filed it, and that a PENDING document is not
clearance to play). Backend `tsc` clean, **219/219**. Nothing was verified in a
browser — per standing instruction the user is the only one who runs a dev
server.

**Constraints honoured.** No dev server was started. The public/fan-facing app
was not touched, and no desktop sidebar was added anywhere outside the portals
that already had one.

## Recently Completed
- Neon Postgres hosting: schema and data live on `plain-hill-97449501`, backend
  pointed at it, 171/171 backend tests green. Two items still need a human:
  the `DATA_RESIDENCY` compliance gate (blocks any production deploy — the DB is
  `us-east-2` and `.neon.tech` is in `KNOWN_OFFSHORE`), and a stale Neon MCP API
  key (`3308124`) minted under the wrong account and written into eight agent
  configs. See git history for the full account-switch notes.
- Admin: register a player on its own page.
- AI assistant answering from the platform's own records.
- Admin: writing an article gets a page of its own.
- Volleyball: the remaining four FRVB clubs, plus an idempotency fix.
