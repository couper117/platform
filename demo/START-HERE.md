# RwaSport — Self-Contained Demo

A fully working, **static showcase** of the RwaSport / Amashuri Games platform.
It runs the real production frontend with a **local demo dataset baked in** — so
there is **no backend, no database, and no internet/API setup required**.

## Run it

You only need **Node.js** installed (any recent version). From this `demo/` folder:

```bash
node serve.js
```

Then open **http://localhost:4173** in your browser.

To use a different port:

```bash
node serve.js 8080
```

> Prefer not to use Node? The site is plain static files in `./dist`. You can serve
> that folder with any static server, e.g. `npx serve dist` or `python -m http.server`.
> (Use a server rather than opening `index.html` directly with `file://`, so the
> single-page-app routes load correctly.)

## What you can explore

- **Home** — live match spotlight, latest news, ad slots
- **Leagues** — national leagues with filters → league detail & standings
- **Fixtures / Results** — live, upcoming, and completed matches → match details
- **Amashuri Games** — schools directory, championships, standings, fixtures,
  school profiles, and match pages
- **Match details** — scoreboard, event timeline, lineups, and live stats
- **Portals** — visit `/auth/login` and sign in (any password works). The
  **username decides which portal opens**, so you can explore every role:

  | Username (any password) | Opens |
  |-------------------------|-------|
  | `admin`                 | Admin area — dashboard, leagues, teams, players, documents, ads, visitors, championships, settings |
  | `coach`                 | Team Manager portal — roster, missing-docs, schedule |
  | `reporter`              | Match Reporter — live reporting |
  | `league`                | League Admin (admin area) |

All data is fictional sample data served entirely in-browser.

## How the demo works

- The site in `./dist` was produced with `vite build` using a `VITE_DEMO=true`
  flag.
- That flag swaps the app's HTTP client for a mock adapter
  (`src/api/demo/mockAdapter.js`) that answers every request from a local
  dataset (`src/api/demo/mockData.js`) instead of calling the real API.
- `serve.js` is a tiny zero-dependency static file server with single-page-app
  fallback (unknown routes return `index.html`).

## Rebuilding the demo

`demo/dist` is committed to the repository on purpose, so a fresh clone can run
the demo straight away with no build step. To regenerate it after changing the
app, from the project's `apps/frontend/` folder:

```bash
npm install
npm run build:demo
```

That runs `vite build --mode demo`, which loads `apps/frontend/.env.demo`
(`VITE_DEMO=true`) and writes to `../../demo/dist`. It is the same command on
Windows, macOS and Linux — no shell-specific env var syntax needed.

The `demo` mode is inert in normal builds, so it does not affect the real
production app: `npm run build` produces a bundle with no mock adapter in it.
