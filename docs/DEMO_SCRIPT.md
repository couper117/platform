# RwaSport — 90-Second Demo Script

A tight, rehearsable live demo. The goal: prove it's a **real, working product**
serving **real data** — not slides. Practice it 3× until there are no dead clicks.

## Before you start (2 min setup, off-stage)

- Have the app running: `npm run dev` → open **http://localhost:5173**.
  - *No wifi / risky network?* Use the offline demo instead: `npm run demo:serve`
    (fully self-contained, mock data — nothing can go wrong on stage).
- Log in once and out, so the path is warm.
- Have logins on a sticky note:
  - **Admin:** `admin@rwasport.rw` · `Manager@123`
  - **Reporter:** `match.reporter@rwasport.rw` · `Manager@123`
- Zoom the browser to ~110% so the room can read it. Full-screen the window.

## The run (≈ 90 seconds)

**0:00 — Home (the hook)** · *land on `/`*
> "This is RwaSport — the digital home of Rwandan sport. Everything you see is
> live data from our own system."
- Point to the **live counters** (sports / teams / leagues / **live now**) and the
  **LIVE & TODAY** matches with real club crests and scores.

**0:15 — A live match** · *click a match in "Live & Today"*
> "Fans follow any match in real time — score, timeline, lineups, stats — updated
> the instant a reporter enters it."
- Scroll the match page briefly (timeline / lineups).

**0:35 — The fan breadth** · *tap Fixtures or a Sport tile → a league table*
> "It's not just football — 20+ sports, standings, news, all in Kinyarwanda,
> French and English, and it works on a cheap phone, even offline."

**0:50 — Behind the scenes: the reporter** · *log in as the reporter → `/reporter/dashboard`*
> "Here's where that live score comes from — a pitch-side reporter enters goals
> and cards on their phone, and it's instantly on every fan's screen."

**1:05 — Governance: the admin** · *log in as admin → `/admin/dashboard`*
> "And federations run everything from here — verify teams and players, review
> documents, manage fixtures and standings. This replaces paper and spreadsheets."
- Show the dashboard stats + one management page (Teams or Documents).

**1:20 — The school angle (the differentiator)** · *open Amashuri / AKC3*
> "We even digitize school sport — the Amashuri games — training thousands of young
> Rwandans on the platform from an early age."

**1:30 — Close**
> "A working, inclusive, Made-in-Rwanda platform for the whole sports ecosystem —
> live today. What we need next is a pilot with one federation."

## If something breaks (stay calm)

- Score didn't update? "This is live seeded data — let me show you the reporter
  side where it's entered." (Pivot to the admin/reporter flow.)
- Network flakes? Switch to the **offline demo** (`npm run demo:serve`) — identical UI,
  zero backend. Keep talking; don't apologize twice.

## Fast answers to likely questions

- **"Is this real or a mockup?"** → Real. Running backend, database, tests, CI.
- **"Do payments work?"** → Integration is built and signature-verified; it goes
  live the moment we add the gateway keys (sandbox for now).
- **"How does it handle poor networks?"** → PWA with an offline shell; live scores
  are never cached so they're always fresh.
- **"Data privacy for kids' records?"** → Designed toward Rwanda's Data Protection
  Law Nº 058/2021; data is portable and can be self-hosted for residency.
- **"What do you need?"** → A pilot with one federation or the AKC3 schools programme.
