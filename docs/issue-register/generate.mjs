import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

// status: open | fixed | partial | deferred
const devs = {
  Kenny:  { role: 'Backend API, Auth & Security (api/src)', issues: [] },
  Malvyn: { role: 'Database, Config, Realtime, Deploy & Dead-code (data/infra)', issues: [] },
  Levi:   { role: 'Public Frontend (pages/public, akc3, shared components)', issues: [] },
  Alpha:  { role: 'Admin / Team / Reporter / Auth Frontend', issues: [] },
  Brian:  { role: 'Internationalisation (i18n) & Accessibility', issues: [] },
};
const I = (dev, o) => devs[dev].issues.push(o);

// ── KENNY — Backend (ALL FIXED) ──
const K = [
  ['K1','critical','CORS reflected every origin with credentials=true','api/src/app.js','Any site could make authenticated cross-origin calls.','Whitelist against FRONTEND_URL + localhost; reject others.'],
  ['K2','critical','Payment verify was unauthenticated & unsigned','api/src/controllers/payments.controller.js','Anyone could mark a reference SUCCESS and auto-verify a team.','Protect route (SUPERADMIN); added Transaction model; activate a subscription flag instead of status=VERIFIED.'],
  ['K3','high','Refresh tokens stored in plaintext; no auth throttling','api/src/controllers/auth.controller.js','A DB leak yielded replayable tokens; no login throttle.','SHA-256 hash tokens before storing/looking up; strict rate limiter on login/refresh.'],
  ['K4','high','Zod validation applied to only 2 endpoints','api/src/validators/schemas.js','Most mutating routes accepted unvalidated bodies.','Added schemas + validate() across auth/leagues/fixtures/teams/players/news/sports/documents/contacts.'],
  ['K5','high','Mass-assignment in AKC3 create controllers','api/src/controllers/akc3/fixtures.controller.js','req.body spread straight into Prisma.','Added buildFixtureData whitelist + integrity checks.'],
  ['K6','high','Missing /leagues/:id/standings and /scorers routes','api/src/routes/leagues.routes.js','Frontend/mock expected dedicated routes.','Added getLeagueStandings (ranked) + getLeagueScorers routes.'],
  ['K7','high','TopScorer table never populated','api/src/controllers/fixtures.controller.js','Top-scorer lists always empty in real builds.','GOAL/PENALTY events upsert TopScorer goals per player/league.'],
  ['K8','medium','LiveMatchState never created/updated','api/src/controllers/fixtures.controller.js','getFixture.liveState always null.','Upsert LiveMatchState on every event and on result save.'],
  ['K9','medium','No /admin/stats aggregate endpoint','api/src/controllers/admin.controller.js','Dashboard had no real counts source.','Added GET /admin/stats (teams/players/pendingDocs/live/recent).'],
  ['K10','medium','Score double-counted between events & result','api/src/controllers/fixtures.controller.js','Blind increment + absolute set diverged.','Score now DERIVED from goal events (single source of truth).'],
  ['K11','medium','AKC3 enterResult never set winnerTeamId; string compare','api/src/controllers/akc3/fixtures.controller.js','Winner never recorded; scores compared as strings.','Parse ints; set winner (null on draw); compute isDraw from ints.'],
  ['K12','medium','Document auto-verify required passport AND national ID','api/src/controllers/documents.controller.js','Verification effectively unreachable.','Now birth certificate + (passport OR national ID).'],
  ['K13','medium','No pagination on list endpoints','api/src/utils/paginate.js','Whole tables returned with deep includes.','Backward-compatible ?page/?limit on fixtures/news/players (+total).'],
  ['K14','medium','createFixture allowed self-play / out-of-league teams','api/src/controllers/fixtures.controller.js','No distinctness or membership checks.','Validate home!=away, league exists, both teams registered.'],
  ['K15','low','errorHandler leaked messages; no Prisma mapping','api/src/middleware/errorHandler.js','P2002/P2025 surfaced as 500.','Map Prisma codes to 400/404/409; sanitize in prod.'],
  ['K16','low','getMe/logout unwrapped; null-user crash','api/src/controllers/auth.controller.js','TypeError escaped the handler.','try/catch -> next(error) + null-check.'],
  ['K17','low','Public settings exposed all rows','api/src/controllers/settings.controller.js','Any admin key leaked to the public map.','Added Setting.isPublic; public GET filters isPublic=true.'],
  ['K18','low','Inconsistent reporter authorization','api/src/controllers/fixtures.controller.js','saveResult checked fixture-only; events checked fixture OR league.','Unified to fixture-OR-league in both.'],
  ['K19','low','Rate-limit response was a raw string','api/src/app.js','429 inconsistent with the JSON envelope.','JSON handler + separate auth limiter.'],
  ['K20','low','addTeamToLeague ignored maxTeams','api/src/controllers/leagues.controller.js','Unlimited teams; raw P2002 on dup.','Enforce maxTeams; P2002 now maps to 409.'],
  ['K21','low','Slug collisions unhandled (news/sport/league)','api/src/utils/slug.js','Duplicate slugs hid records.','uniqueSlug() appends -2/-3 on collision.'],
  ['K22','low','Standings omitted winless registered teams','api/src/services/standings.service.js','Only teams in completed fixtures appeared.','Seed rows from LeagueTeam so all registered teams show.'],
  ['K23','medium','No email / password reset / verification','api/src/utils/sendMail.js','nodemailer configured but unused.','Added sendMail + forgot-password/reset-password endpoints (dev-safe fallback).'],
  ['K24','high','visitorTracker blocked every request with a DB write','api/src/middleware/visitorTracker.js','Awaited a write on all traffic; userId always null.','Fire-and-forget + filter noise.'],
];
for (const [id,sev,title,file,problem,fix] of K) I('Kenny', { id, sev, title, file, problem, fix, status:'fixed' });

// ── MALVYN ──
const M = [
  ['M1','critical','Per-match Pusher channel/event mismatch','react-app/src/hooks/useLiveMatch.js','Match page received zero realtime.','Subscribe fixture-${id} / matchUpdate,matchEvent.','fixed'],
  ['M2','critical','news.findUnique on non-unique slug -> 500','api/src/controllers/news.controller.js','Article detail errored every request.','findFirst({slug}) + numeric id fallback.','fixed'],
  ['M3','high','seed.js non-idempotent (dup then crash)','api/prisma/seed.js','Second run duplicates then throws.','Convert to upsert / marker guard.','open'],
  ['M4','high','seed forces Ad id:1 -> sequence desync','api/prisma/seed.js','Next auto-id ad insert collides.','Remove explicit id / setval realign in seed.js.','open'],
  ['M5','high','Dead Mongoose backend tree under api/ root','api/controllers, api/models, api/routes','Unused, misleading dead weight.','Deleted the legacy tree.','fixed'],
  ['M6','medium','Dead frontend stack (Main/AuthContext/flat pages)','react-app/src','Orphaned + second auth stack.','Deleted after confirming no imports.','fixed'],
  ['M7','medium','env.js silently fell back to raw process.env','api/src/config/env.js','Unvalidated config accepted.','Fail-fast on critical vars; defaults otherwise.','fixed'],
  ['M8','medium','Missing react-app/.env.example','react-app/','VITE_* undocumented for a fresh clone.','Added .env.example.','fixed'],
  ['M9','low','Dead VITE_SOCKET_URL + FRONTEND_URL port mismatch','react-app/.env, api/.env','Socket var unused; wrong Vite port.','Removed var; set FRONTEND_URL=5173.','fixed'],
  ['M10','high','vercel-build ran generate but not migrate deploy','api/package.json','Fresh Vercel DB had no tables.','vercel-build now runs prisma migrate deploy.','fixed'],
  ['M11','low','No seed:extra / prisma.seed chain','api/package.json','reset wouldn’t auto-seed.','Added seed:extra + prisma.seed.','fixed'],
  ['M12','low','Obsolete Capacitor bundledWebRuntime key','react-app/capacitor.config.json','Ignored since v4.','Removed the key.','fixed'],
  ['M13','medium','PWA: no service worker + SVG-only icon','react-app/public/manifest.webmanifest','Not installable/offline.','Add vite-plugin-pwa + 192/512 PNG (needs assets).','deferred'],
  ['M14','low','demo/dist gitignored -> demo not self-contained','.gitignore','Fresh clone of demo has no build.','Negate ignore or document build step.','open'],
  ['M15','medium','Secrets in OneDrive-synced .env','api/.env','DB pw + JWT secret cloud-synced.','Rotate; keep only in untracked local .env.','open'],
  ['M16','low','theme_color mismatch (manifest vs html)','react-app/public/manifest.webmanifest','Inconsistent browser tint.','Aligned to #111120.','fixed'],
];
for (const [id,sev,title,file,problem,fix,status] of M) I('Malvyn', { id, sev, title, file, problem, fix, status });

// ── LEVI ──
const L = [
  ['L1','high','/news was an inline placeholder','react-app/src/App.jsx','Navbar/Footer linked to a stub.','Built NewsListPage.','fixed'],
  ['L2','high','/news/:slug was a stub','react-app/src/App.jsx','NewsCards linked to a stub.','Built NewsArticlePage.','fixed'],
  ['L3','high','/contact was a stub','react-app/src/App.jsx','Footer CTA led nowhere.','Built ContactPage (working form).','fixed'],
  ['L4','high','Dead links /privacy and /terms','react-app/src/components/layout/Footer.jsx','Redirected to home.','Added LegalPage (privacy/terms).','fixed'],
  ['L5','high','Dead link /teams/:id','react-app/src/pages/public/LeagueDetailsPage.jsx','No public team page.','Add /teams/:id profile page.','open'],
  ['L6','high','FixtureCard crashed on null team','react-app/src/components/shared/FixtureCard.jsx','Blanked the section.','Optional-chain team; default getInitials.','fixed'],
  ['L7','high','StandingsTable crashed on null team/form','react-app/src/components/shared/StandingsTable.jsx','Threw on fresh/AKC rows.','Guard team/form/id.','fixed'],
  ['L8','high','LiveScoreTicker crashed on null team','react-app/src/components/home/LiveScoreTicker.jsx','Blanked every page chrome.','Optional-chain team access.','fixed'],
  ['L9','medium','NewsCard invalid date + /news/undefined','react-app/src/components/shared/NewsCard.jsx','Threw on missing date/slug.','Guard date; slug||id.','fixed'],
  ['L10','medium','League teams tab charAt crash','react-app/src/pages/public/LeagueDetailsPage.jsx','Null team threw.','Filter null; guard name.','fixed'],
  ['L11','medium','No query error states across public pages','react-app/src/pages/public','Failures render as empty-states.','Handle isError + retry.','open'],
  ['L12','medium','AdBanner used <Link> for external URL','react-app/src/components/shared/AdBanner.jsx','Router mishandled absolute URL.','Use <a rel=noopener>; normalize data.','fixed'],
  ['L13','low','/amashuri/results opened Upcoming tab','react-app/src/pages/akc3/AkcFixturesPage.jsx','Ignored the path.','Init status from pathname.','fixed'],
  ['L14','low','Seo lacked OG/Twitter/canonical; pages missing Seo','react-app/src/components/shared/Seo.jsx','Bare link previews.','Extended Seo (OG/Twitter/canonical); still to add <Seo> to all pages.','partial'],
  ['L15','low','Sticky sub-bars use fixed top offset','react-app/src/pages/public/LeaguesPage.jsx','Overlap/gap with ticker.','Dynamic offset / CSS var.','open'],
  ['L16','low','Unused imports across public pages','react-app/src/pages/public','Dead imports.','Remove unused imports.','open'],
];
for (const [id,sev,title,file,problem,fix,status] of L) I('Levi', { id, sev, title, file, problem, fix, status });

// ── ALPHA ──
const A = [
  ['A1','high','invalidateQueries v4 array form -> lists never refresh','react-app/src/pages/admin','Cache never invalidated after mutations.','Converted all to {queryKey}.','fixed'],
  ['A2','high','AdminDashboard hardcoded stats + fake activity','react-app/src/pages/admin/AdminDashboard.jsx','842/12,402/124 literals; dead buttons.','Fetch /admin/stats + /activity; wire buttons.','open'],
  ['A3','medium','Two auth stacks / divergent token keys','react-app/src/context/AuthContext.jsx','rnsp-token vs rnsp-access-token.','Deleted dead stack; standardised on authStore.','fixed'],
  ['A4','high','authStore.refresh never rehydrates user/role','react-app/src/store/authStore.js','Stale role bounces valid sessions.','Call /auth/me after refresh.','open'],
  ['A5','high','AdminNewsPage create modal does not submit','react-app/src/pages/admin/AdminNewsPage.jsx','Unbound inputs, no mutation.','Wire inputs + createNews mutation.','open'],
  ['A6','medium','News/Players Edit buttons non-functional','react-app/src/pages/admin/AdminNewsPage.jsx','No handler/modal.','Add edit modals + PUT.','open'],
  ['A7','medium','AdminAdsPage modal omits targetUrl/position','react-app/src/pages/admin/AdminAdsPage.jsx','position hardcoded.','Add fields; disable while pending.','open'],
  ['A8','high','assignReporter/assignAdmin -> nonexistent endpoints','react-app/src/pages/admin/AdminLeaguesPage.jsx','No onError/invalidate; unguarded.','Backend routes exist (K); add onError + guard.','open'],
  ['A9','high','LiveReportingPage null-user crash + dead controls','react-app/src/pages/admin/LiveReportingPage.jsx','user.id null; minute hardcoded; buttons dead.','Guard user; reporter-scoped fetch; wire controls.','open'],
  ['A10','low','StatCard dynamic Tailwind classes never compile','react-app/src/pages/admin/AdminDashboard.jsx','Colourless icons.','Static class map.','fixed'],
  ['A11','low','AdminPlayersPage no debounce/empty/confirm','react-app/src/pages/admin/AdminPlayersPage.jsx','Per-keystroke fetch; no confirm.','Debounce + empty state + confirm.','open'],
  ['A12','medium','Missing empty/error states across admin tables','react-app/src/pages/admin','Blank tables on empty/fail.','Add empty/error UI.','open'],
  ['A13','medium','Client role trusted for gating','react-app/src/components/layout/AdminLayout.jsx','localStorage role mounts admin UI.','Treat as hint; handle 403.','open'],
  ['A14','medium','AdminSettingsPage sets state in queryFn','react-app/src/pages/admin/AdminSettingsPage.jsx','Overwrites unsaved edits.','Init in onSuccess/effect.','open'],
  ['A15','medium','TeamDashboard magic doc rule + dead link','react-app/src/pages/team/TeamDashboard.jsx','Hardcoded 3-docs; /team/players/new missing.','Derive from API; fix route.','open'],
  ['A16','high','Team portal pages are stubs','react-app/src/App.jsx','players/documents/fixtures/profile placeholders.','Build the four team pages.','open'],
  ['A17','medium','AkcAdminDashboard Add/Manage/CSV inert','react-app/src/pages/admin/AkcAdminDashboard.jsx','No handlers; import never called.','Wire CSV import + actions.','open'],
  ['A18','low','Reporter portal single route, no nav','react-app/src/App.jsx','No sidebar/profile/history.','Scope reporter surface.','open'],
  ['A19','low','No per-page role gating','react-app/src/components/layout/AdminLayout.jsx','All admin roles see everything.','Gate nav/pages by role.','open'],
];
for (const [id,sev,title,file,problem,fix,status] of A) I('Alpha', { id, sev, title, file, problem, fix, status });

// ── BRIAN ──
const B = [
  ['B1','high','Footer 100% hardcoded English','react-app/src/components/layout/Footer.jsx','Stays English in fr/rw/sw.','footer.* keys + t().','open'],
  ['B2','high','Sidebar hardcoded (admin + team)','react-app/src/components/layout/Sidebar.jsx','No t().','sidebar.* keys.','open'],
  ['B3','high','Admin pages ~entirely hardcoded','react-app/src/pages/admin','Zero t() in routed admin pages.','admin.* namespace (large).','deferred'],
  ['B4','high','RegisterTeamPage ~95% hardcoded + Zod msgs','react-app/src/pages/auth/RegisterTeamPage.jsx','Labels/validation English.','register.* keys; Zod via t().','open'],
  ['B5','medium','LoginPage partly hardcoded; unused login_title','react-app/src/pages/auth/LoginPage.jsx','Heading/placeholders literal.','Use existing keys + add.','open'],
  ['B6','medium','Navbar stray hardcoded strings','react-app/src/components/layout/Navbar.jsx','Register Team/Appearance/Language literal.','t() + nav.* keys.','open'],
  ['B7','medium','HomePage hardcoded strings','react-app/src/pages/public/HomePage.jsx','Badge/spotlight/empty literal.','Wrap in t().','open'],
  ['B8','medium','MatchDetailsPage hardcodes existing keys','react-app/src/pages/public/MatchDetailsPage.jsx','Real-time/Full Time literal.','Use match.* keys.','open'],
  ['B9','medium','No language detector','react-app/src/i18n/index.js','Non-English browsers get English.','Detect navigator language.','fixed'],
  ['B10','medium','<html lang> never updated','react-app/index.html','Stays lang=en.','languageChanged -> documentElement.lang.','fixed'],
  ['B11','low','Unused/dead translation keys','react-app/src/i18n/locales','Wasted effort / trap.','Wire or remove.','open'],
  ['B12','medium','a11y: lang/hamburger lack aria','react-app/src/components/layout/Navbar.jsx','No aria-label/expanded.','Added aria-*.','fixed'],
  ['B13','low','a11y: viewport disables pinch-zoom','react-app/index.html','Fails WCAG 1.4.4.','Removed user-scalable=no.','fixed'],
  ['B14','low','a11y: language buttons lack aria-current','react-app/src/components/layout/Navbar.jsx','Active conveyed by colour only.','Added aria-current.','fixed'],
];
for (const [id,sev,title,file,problem,fix,status] of B) I('Brian', { id, sev, title, file, problem, fix, status });

// ─── RENDER ───
const sevColor = { critical:'#b91c1c', high:'#c2410c', medium:'#a16207', low:'#4d7c0f' };
const statusMeta = {
  fixed:{label:'FIXED',color:'#15803d',bg:'#dcfce7'}, partial:{label:'PARTIAL',color:'#a16207',bg:'#fef9c3'},
  deferred:{label:'DEFERRED',color:'#6d28d9',bg:'#ede9fe'}, open:{label:'OPEN',color:'#b91c1c',bg:'#fee2e2'},
};
const all = Object.values(devs).flatMap(d => d.issues);
const bySev = (s) => all.filter(i => i.sev === s).length;
const byStatus = (s) => all.filter(i => i.status === s).length;
const esc = (s='') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const devSection = (name, d) => `
  <section class="dev">
    <div class="dev-head"><h2>${name}</h2><div class="dev-role">${esc(d.role)}</div>
      <div class="dev-stats"><span>${d.issues.length} issues</span>
        <span class="ok">${d.issues.filter(i=>i.status==='fixed').length} fixed</span>
        <span class="warn">${d.issues.filter(i=>i.status!=='fixed').length} pending</span></div></div>
    <table><thead><tr><th>ID</th><th>Sev</th><th>Issue &amp; Fix</th><th>Location</th><th>Status</th></tr></thead><tbody>
      ${d.issues.map(i=>`<tr><td class="id">${i.id}</td>
        <td><span class="sev" style="background:${sevColor[i.sev]}">${i.sev}</span></td>
        <td class="issue"><div class="t">${esc(i.title)}</div><div class="p">${esc(i.problem)}</div><div class="f"><b>Fix:</b> ${esc(i.fix)}</div></td>
        <td class="loc">${esc(i.file)}</td>
        <td><span class="st" style="color:${statusMeta[i.status].color};background:${statusMeta[i.status].bg}">${statusMeta[i.status].label}</span></td></tr>`).join('')}
    </tbody></table></section>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;margin:0;font-size:11px}
.cover{background:linear-gradient(135deg,#111120,#16162a);color:#fff;padding:56px 48px}
.cover h1{font-size:34px;margin:0 0 6px;letter-spacing:-1px}.cover .sub{color:#9ca3af;font-size:13px;margin-bottom:24px}
.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}.kpi{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 18px;min-width:118px}
.kpi .n{font-size:26px;font-weight:700}.kpi .l{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af}
.red{color:#f87171}.amber{color:#fbbf24}.green{color:#4ade80}.legend{margin-top:24px;font-size:11px;color:#cbd5e1}
.content{padding:28px 40px}section.dev{margin-bottom:26px}.dev-head{border-left:5px solid #E8002D;padding:4px 0 4px 12px;margin-bottom:10px}
.dev-head h2{margin:0;font-size:20px}.dev-role{color:#6b7280;font-size:11px}.dev-stats{margin-top:4px;font-size:10px}
.dev-stats span{margin-right:12px;text-transform:uppercase;letter-spacing:.5px}.dev-stats .ok{color:#15803d;font-weight:700}.dev-stats .warn{color:#b91c1c;font-weight:700}
table{width:100%;border-collapse:collapse}th{text-align:left;background:#f3f4f6;font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;padding:6px 8px;border-bottom:2px solid #e5e7eb}
td{padding:8px;border-bottom:1px solid #eef0f2;vertical-align:top}tr{page-break-inside:avoid}
td.id{font-weight:700;color:#374151;white-space:nowrap}td.loc{font-family:Consolas,monospace;font-size:9px;color:#6b7280;max-width:150px;word-break:break-all}
.sev{color:#fff;padding:2px 7px;border-radius:20px;font-size:8px;text-transform:uppercase;font-weight:700;letter-spacing:.5px}
.st{padding:2px 8px;border-radius:20px;font-size:8.5px;font-weight:700;letter-spacing:.5px}
.issue .t{font-weight:700;margin-bottom:2px}.issue .p{color:#4b5563;margin-bottom:3px}.issue .f{color:#065f46}
</style></head><body>
<div class="cover"><h1>RNSP / RwaSport — Issue Register</h1>
<div class="sub">Full-system audit (frontend · backend · i18n) &middot; Rwanda National Sports Platform &middot; updated ${new Date().toISOString().slice(0,10)}</div>
<div class="kpis">
<div class="kpi"><div class="n">${all.length}</div><div class="l">Total issues</div></div>
<div class="kpi"><div class="n red">${bySev('critical')}</div><div class="l">Critical</div></div>
<div class="kpi"><div class="n amber">${bySev('high')}</div><div class="l">High</div></div>
<div class="kpi"><div class="n">${bySev('medium')}</div><div class="l">Medium</div></div>
<div class="kpi"><div class="n">${bySev('low')}</div><div class="l">Low</div></div>
<div class="kpi"><div class="n green">${byStatus('fixed')}</div><div class="l">Fixed</div></div>
<div class="kpi"><div class="n amber">${byStatus('partial')+byStatus('deferred')}</div><div class="l">Partial/Deferred</div></div>
<div class="kpi"><div class="n red">${byStatus('open')}</div><div class="l">Open</div></div></div>
<div class="legend">Owners — <b>Kenny</b>: Backend/Auth/Security (all fixed) &nbsp;·&nbsp; <b>Malvyn</b>: Data/Config/Realtime/Deploy &nbsp;·&nbsp; <b>Levi</b>: Public Frontend &nbsp;·&nbsp; <b>Alpha</b>: Admin/Team/Reporter/Auth UI &nbsp;·&nbsp; <b>Brian</b>: i18n &amp; Accessibility</div></div>
<div class="content">${Object.entries(devs).map(([n,d])=>devSection(n,d)).join('')}</div>
</body></html>`;

writeFileSync('report.html', html);
const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'networkidle' });
await p.pdf({ path: '../docs/RNSP_Issue_Register.pdf', format: 'A4', printBackground: true, margin: { top:'0', bottom:'20px', left:'0', right:'0' } });
await b.close();
console.log(`PDF: ${all.length} issues | fixed=${byStatus('fixed')} partial=${byStatus('partial')} deferred=${byStatus('deferred')} open=${byStatus('open')} | Kenny=${devs.Kenny.issues.filter(i=>i.status==='fixed').length}/24 fixed`);
