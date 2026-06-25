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