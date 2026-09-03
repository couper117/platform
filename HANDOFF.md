# HANDOFF

## Current Task
Player profiles for professionals: a club-coloured page, real season statistics
stored in the database, and an admin editor to record and correct them.

## Status
**Solved and shipped.** The whole admin portal is on one design vocabulary.
`Levi` and `main` are both at `691b8bb`; frontend and backend typecheck, `vite
build` passes.

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
- [x] 43 remaining admin pages, fanned out to six agents and reviewed.
- [x] Sidebar pinned to the viewport with its own scroller.
- [x] Visual sweep of all 33 reachable admin routes: no page errors, no page
      scrolling sideways.
- [x] Committed, pushed, merged to `main` (one conflict in `apps/backend/
      package.json`: kept Levi's `seed:all`, main's `vercel-build`).

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

**Four more fabricated statistics were found and removed during the fan-out**, all
of the same kind as the dashboard's: `FederationDashboard`'s six-month growth curve
was a literal array; `LeagueDashboard`'s "goals scored over the season" was a sine
wave over fifteen invented matchdays, and its fixture rows said Assigned/Pending by
row index; `AdminAdsPage` and `AkcAdminDashboard` printed a green "Active" chip on
every row regardless of the record. All now read real data or a real empty state.

**Open follow-ups, none blocking:**
  - `GET /akc3/schools` hard-filters `active: true`, so hiding a school removes it
    from the only list that could un-hide it — the Show toggle is unreachable.
  - `visitorTracker` (see above) still writes a row per API GET.
  - `ReporterProfilePage`'s error branch is unreachable: the `isLoading || !form`
    guard runs first and `form` stays null forever on a failed fetch.
  - `AdminFixturesPage`, `LiveReportingPage`, `AdminNewsPage`, `AdminAdsPage` and
    `AdminSettingsPage` have no `t()` at all — hardcoded English, needs an i18n pass.
  - Several list pages show the empty state on a failed request rather than an
    error state.
  - `/admin/players` renders ~20,000px of unpaginated rows.

**To verify visually on resume:** the user's dev server on `localhost:5174` (Vite
binds `[::1]`, so use `localhost`, never `127.0.0.1`; log in as `admin` /
`Manager@123`).

## Standing constraints
- **Never start a dev server.** The user is the only one who runs it.
- "Improve the UI, don't completely change it" — except the admin portal, where a
  revamp was explicitly asked for. Even there: same sections, same order, same
  controls; the visual language is what changes.
- The client rejected a desktop sidebar on the PUBLIC app; that treatment is
  mobile-only. The sidebar here is the ADMIN portal's and is wanted.
- Push over SSH port 443 (`ssh -p 443 -o Hostname=ssh.github.com`) — port 22 is
  blocked on this network.

## Recently Completed
- Header language switcher + i18n overflow fix (116px FR / 74px RW clipping).
- Amashuri main page: pluralised hero stats, grids that fit a sparse dataset,
  next-up fixtures when nothing is live.
- `/fixtures` all-sports desktop: ungrouped 3-col MatchTile grid, 3,113px (from
  7,255px at the worst attempt).
- `/calendar`, `/news` images, `/sports` match cards, standings table width.
