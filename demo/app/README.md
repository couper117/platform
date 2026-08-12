# RwaSport — Static Demo App (`demo/app`)

This is the **pitch sandbox**. It is a self-contained copy of the frontend that
**always runs on local mock data** — no backend, no database, no network. Build
it and you get a static site in `../dist` that runs from a USB stick offline.

> The **real system** lives in `apps/frontend` (+ `apps/backend`). It has **none**
> of this demo scaffolding. Change things here in the demo; when you're happy,
> tell Claude to **implement them in the real system** and the change is ported
> into `apps/frontend`.

## Run it

From the repo root:

```bash
npm run demo:dev      # live dev server at http://localhost:4174
npm run demo:build    # build the static site into demo/dist
npm run demo:serve    # serve the built demo at http://localhost:4173
```

(The real app uses ports 5000/5173; the demo uses 4174/4173 so they never clash.)

## What makes this the demo (and NOT in the real system)

Everything demo-specific lives here and here only:

| File | Role |
|---|---|
| `src/api/demo/mockData.ts` | All the demo data — clubs, players, fixtures, races, schools, admins. **Edit data here.** |
| `src/api/demo/mockAdapter.ts` | Intercepts every API call and answers it from `mockData`. |
| `src/api/demo/assets.ts` | Generates original SVG crests / avatars / covers (offline, no trademarked logos). |
| `src/api/client.ts` | Here it **always** installs the mock adapter (the real one talks to the backend). |
| `src/config/sportThemes.ts` | `DEMO = true` → generated offline backdrops (the real one uses hosted photos). |
| `src/pages/auth/LoginPage.tsx` | `isDemo = true` → the one-tap role picker on the sign-in panel. |

## Logging in

On `/auth/login`, click a button on the side panel, or type a name + **any**
password: `admin` (Super Admin), `federation`, `league`, `amashuri`, `coach`
(Team Manager), `reporter`.

## Porting a change to the real system

1. Make and preview the change here (`npm run demo:dev`).
2. Ask Claude: *"port this demo change into the real system."*
3. Claude applies the equivalent change to `apps/frontend` (real data comes from
   the backend there, not the mock layer).
