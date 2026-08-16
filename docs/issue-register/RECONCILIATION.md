# Issue Register — Reconciliation (2026-08-17)

The register in `generate.mjs` / `../RNSP_Issue_Register.pdf` was authored against
an **earlier project layout** and predates two milestones, so its file paths and
several statuses are out of date. This note reconciles it with the current code.

## What changed since the register was written

1. **Monorepo restructure.** `react-app/` → `apps/frontend`, `api/` → `apps/backend`.
   Every `react-app/...` / `api/...` path in the register is historical; the files
   now live under `apps/*`. (The orphaned `/api` tree was since deleted.)
2. **"Demo parity" milestone** built out the public pages, role portals, live
   reporting and full i18n.
3. **Hardening session** (this one): working typecheck/lint + CI, a real test
   suite, DB indexes, the modeled-but-unbuilt CRUD, env-gated payments, a demo
   drift guard, and the dead-field / dead-dir cleanup.

`generate.mjs` now applies a dated `RECONCILED` override before rendering, so a
regenerated PDF reflects the statuses below.

## Verified resolved (re-audited against `apps/frontend` / `apps/backend`)

| ID | Item | Evidence |
|----|------|----------|
| A2 | AdminDashboard hardcoded stats | Now fetches `/admin/stats`, `/admin/roster`, `/activity` via react-query |
| A4 | authStore.refresh didn't rehydrate | `refresh()` calls `/auth/me` after refresh |
| A5 | AdminNewsPage create modal inert | Wired to a `createNews` mutation |
| A8 | assign reporter/admin → nonexistent endpoints | Hit real backend routes, with `onError` |
| A9 | LiveReportingPage null-user crash | User guarded; **covered by an e2e test** (reporter login → page renders) |
| A16 | Team portal stubs | Five real team pages (dashboard/players/documents/fixtures/profile) |
| M3, M4 | seed.js non-idempotent | Legacy `api/prisma/seed.js` removed; `apps/backend` seeds are upsert-based |
| M13 | PWA not installable | `vite-plugin-pwa` + 192/512 PNG icons shipped |
| M14 | demo/dist not self-contained | `.gitignore` allowlists `demo/dist` (committed on purpose) |
| B1–B8 | Hardcoded English | Full EN/RW/FR locales (~60 KB each); `t()` throughout footer/sidebar/navbar/admin/register/home/match |

## Still open / needs a fresh audit

- **M15 — secrets in a OneDrive-synced `.env` → `partial`.** Documented and
  rotation recommended (see [`/SECURITY.md`](../../SECURITY.md) and
  `apps/backend/.env.example`), but the repository still lives under OneDrive, so
  this is not fully closed until the secrets are rotated and moved out of the
  synced tree. **Action is operational (owner's machine), not code.**
- **Low-priority frontend polish** not individually re-verified here and left at
  their original status pending a focused UI audit against `apps/frontend`:
  L5, L11, L14–L16, A6, A7, A11, A12, A13, A14, A15, A17–A19, B11. Many are
  likely resolved by the demo-parity work but are not claimed fixed without a
  per-item check.

## Regenerating

Per the register README: `npm i playwright && npx playwright install chromium`,
then `node generate.mjs`. The `RECONCILED` map at the top of `generate.mjs` is the
single place to adjust statuses as the remaining items are verified.
