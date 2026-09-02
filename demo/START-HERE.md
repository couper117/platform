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

> Prefer not to use Node? `./dist` is plain static files that need **no server
> configuration at all**. Any static host works — `npx serve dist`,
> `python3 -m http.server`, GitHub Pages, S3, Netlify — and it can live at any
> path, so `example.com/pitch/demo/` is fine. Copy the folder anywhere and it runs.
>
> Routes are hash-based (`.../index.html#/fixtures`), which is what removes the
> need for rewrite rules: the part after `#` never reaches the server, so deep
> links and refreshes cannot 404.
>
> One limitation: opening `index.html` straight off disk with `file://` shows a
> blank page. That is a browser rule, not a packaging mistake — Chrome treats a
> `file://` page as an opaque origin and refuses to load ES modules into it. Serve
> the folder over http, however trivially.

## What you can explore

- **Home** — live match spotlight, latest news, ad slots
- **Leagues** — national leagues with filters → league detail & standings
- **Fixtures / Results** — live, upcoming, and completed matches → match details
- **Amashuri Games** — schools directory, championships, standings, fixtures,
  school profiles, and match pages
- **Match details** — scoreboard, event timeline, lineups, and live stats
- **Portals** — visit `#/auth/login` and sign in. Any credentials are accepted,
  but the sign-in form is the real one, so the password must be at least six
  characters (`demo1234` works). The
  **username decides which portal opens**, so you can explore every role:

  | Username (any 6+ char password) | Opens |
  |---------------------------------|-------|
  | `admin`                 | Admin area — dashboard, leagues, teams, players, documents, ads, visitors, championships, settings |
  | `coach`                 | Team Manager portal — roster, missing-docs, schedule |
  | `reporter`              | Match Reporter — live reporting |
  | `league`                | League Admin (admin area) |

All data is fictional sample data served entirely in-browser.

## Keeping it identical to the real app

`demo/app/src` is a copy of `apps/frontend/src`. Only two files deliberately
differ, and both are about running without a backend or a server:

- `src/api/client.ts` — the real client, plus one block that installs the mock
  adapter so every request is answered locally.
- `src/App.tsx` — the real route table, with `HashRouter` in place of
  `BrowserRouter`.

Everything else should be byte-identical. To resync after the real app changes,
copy `apps/frontend/src` over `demo/app/src`, restore `src/api/demo/`, and
re-apply those two edits. `npm run check:drift` guards the shared design files.

## How the demo works

- The site in `./dist` was produced with `vite build` using a `VITE_DEMO=true`
  flag.
- That flag swaps the app's HTTP client for a mock adapter
  (`src/api/demo/mockAdapter.js`) that answers every request from a local
  dataset (`src/api/demo/mockData.js`) instead of calling the real API.
- `serve.js` is a tiny zero-dependency static file server. It still carries a
  single-page-app fallback, but the demo no longer relies on it: hash routing
  means the server only ever sees `/index.html`. The fallback stays because it
  costs nothing and keeps `serve.js` usable for the real app's build too.
- The demo builds with `base: './'`, so every asset is referenced relatively.
  That is what lets the folder run from a sub-path rather than only a domain root.

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
