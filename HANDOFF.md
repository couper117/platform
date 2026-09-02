# HANDOFF

## Current Task
Admin portal UI revamp. The client's brief: "this admin pages look like SHIT — start
with the dashboard for ministry of sport, we need it looking like a admin portal,
fix its header, we don't need those nav links, nice icons with a nice search bar —
we will copy every other admin page based on this one."

## Status
In progress. The shell and the template dashboard are **done and committed**
(`6095aa1`). Six agents are fanning the template out across the remaining 43 admin
pages.

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
- [ ] 43 remaining admin pages — agents in flight, see below.
- [ ] Visual pass over the fanned-out pages, then typecheck + build + commit.

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

**Next step on resume:** collect the six agent reports, run the typecheck and the
frontend build once across the whole tree, screenshot a sample of the fanned-out
pages against the user's dev server on `localhost:5174` (Vite binds `[::1]`, so use
`localhost`, never `127.0.0.1`; log in as `admin` / `Manager@123`), then commit.

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
