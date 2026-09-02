/**
 * Axios adapter for the static showcase build (VITE_DEMO=true).
 *
 * Intercepts every request the app makes and resolves it from the local demo
 * dataset, so the production frontend runs with zero backend / database.
 * Unknown GET routes fall back to an empty list and writes return a success
 * stub, so no screen ever crashes on a missing endpoint.
 */
import * as db from './mockData';

const ok = (data, status = 200) => ({ data, status, statusText: 'OK', headers: {} });
const byId = (list, id) => list.find((x) => String(x.id) === String(id));

// Filter helpers -----------------------------------------------------------
const filterFixtures = (params = {}) => {
  let list = db.fixtures;
  if (params.status) list = list.filter((f) => f.status === params.status);
  if (params.leagueId) list = list.filter((f) => String(f.league?.id) === String(params.leagueId));
  if (params.sportId) {
    const leagueIds = db.leagues.filter((l) => String(l.sport?.id) === String(params.sportId)).map((l) => l.id);
    list = list.filter((f) => leagueIds.includes(f.leagueId));
  }
  if (params.teamId) list = list.filter((f) => String(f.homeTeamId) === String(params.teamId) || String(f.awayTeamId) === String(params.teamId));
  if (params.from) list = list.filter((f) => !f.matchDate || new Date(f.matchDate) >= new Date(params.from));
  if (params.to) list = list.filter((f) => !f.matchDate || new Date(f.matchDate) <= new Date(params.to));
  if (params.limit) list = list.slice(0, Number(params.limit));
  return list;
};

const filterLeagues = (params = {}) => {
  let list = db.leagues;
  if (params.sportId) list = list.filter((l) => String(l.sport?.id) === String(params.sportId));
  if (params.gender) list = list.filter((l) => l.gender === params.gender);
  if (params.level) list = list.filter((l) => l.level === params.level);
  if (params.status) list = list.filter((l) => l.status === params.status);
  return list;
};

const filterSchools = (params = {}) => {
  let list = db.schools;
  if (params.category) list = list.filter((s) => s.category === params.category);
  if (params.search) {
    const q = String(params.search).toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q));
  }
  return list;
};

const filterTeams = (params = {}) => {
  let list = db.teams;
  if (params.status) list = list.filter((tm) => tm.status === params.status);
  if (params.sportId) list = list.filter((tm) => String(tm.sportId) === String(params.sportId));
  if (params.search) {
    const q = String(params.search).toLowerCase();
    list = list.filter((tm) => tm.name.toLowerCase().includes(q));
  }
  return list;
};

const filterPlayers = (params = {}) => {
  let list = db.players;
  if (params.teamId) list = list.filter((p) => String(p.teamId) === String(params.teamId));
  if (params.status) list = list.filter((p) => p.status === params.status);
  if (params.search) {
    const q = String(params.search).toLowerCase();
    list = list.filter((p) => p.fullName.toLowerCase().includes(q) || String(p.id) === q);
  }
  if (params.limit) list = list.slice(0, Number(params.limit));
  return list;
};

const filterAkcFixtures = (params = {}) => {
  let list = db.akcFixtures;
  if (params.competitionId) list = list.filter((f) => String(f.competitionId) === String(params.competitionId));
  if (params.status) list = list.filter((f) => f.status === params.status);
  if (params.schoolId) list = list.filter((f) => String(f.homeTeam?.school?.id) === String(params.schoolId) || String(f.awayTeam?.school?.id) === String(params.schoolId));
  return list;
};

const paginate = (list, params) => {
  const limit = Number(params.limit) || 20;
  const page = Number(params.page) || 1;
  return ok({ data: list.slice((page - 1) * limit, page * limit), total: list.length, pages: Math.ceil(list.length / limit), page });
};

// Route table — each entry: [method, RegExp, handler(match, params, body)] ---
const routes = [
  ['GET', /^\/sports\/?$/, (_m, p) => ok({ data: p.active ? db.sports.filter((s) => s.active) : db.sports })],
  ['GET', /^\/sports\/([^/]+)\/?$/, (m) => ok({ data: db.sports.find((s) => s.slug === m[1] || String(s.id) === m[1]) || db.sports[0] })],

  ['GET', /^\/federations\/([^/]+)\/?$/, (m) => ok({ data: byId(db.federations, m[1]) || db.federations[0] })],
  ['GET', /^\/federations\/?$/, () => ok({ data: db.federations })],

  ['GET', /^\/leagues\/([^/]+)\/standings\/?$/, (m) => ok((db.standingsByLeague[m[1]] || db.standings).map((s, i) => ({ ...s, rank: i + 1 })))],
  ['GET', /^\/leagues\/([^/]+)\/scorers\/?$/, (m) => ok(db.scorersByLeague[m[1]] || db.topScorers)],
  ['GET', /^\/leagues\/([^/]+)\/fixtures\/?$/, (m) => ok({ data: db.fixtures.filter((f) => String(f.leagueId) === String(m[1])) })],
  ['GET', /^\/leagues\/([^/]+)\/?$/, (m) => ok({ data: db.buildLeagueDetail(byId(db.leagues, m[1]) || db.leagues[0]) })],
  ['GET', /^\/leagues\/?$/, (_m, p) => { const data = filterLeagues(p); return ok({ data, count: data.length }); }],

  ['GET', /^\/teams\/my\/?$/, () => ok({ data: db.buildMyTeam() })],
  ['GET', /^\/teams\/([^/]+)\/officials\/?$/, (m) => ok({ data: db.officials.filter((o) => String(o.teamId) === String(m[1])) })],
  ['GET', /^\/teams\/([^/]+)\/players\/?$/, (m) => ok({ data: db.players.filter((pl) => String(pl.teamId) === String(m[1])) })],
  ['GET', /^\/teams\/([^/]+)\/?$/, (m) => ok({ data: db.buildTeamDetail(byId(db.teams, m[1]) || db.teams[0]) })],
  ['GET', /^\/teams\/?$/, (_m, p) => ok({ data: filterTeams(p) })],

  ['GET', /^\/fixtures\/([^/]+)\/?$/, (m) => ok({ data: db.buildFixtureDetail(byId(db.fixtures, m[1]) || db.fixtures[0]) })],
  ['GET', /^\/fixtures\/?$/, (_m, p) => ok({ data: filterFixtures(p) })],

  ['GET', /^\/news\/([^/]+)\/?$/, (m) => ok({ data: db.news.find((n) => n.slug === m[1] || String(n.id) === m[1]) || db.news[0] })],
  ['GET', /^\/news\/?$/, (_m, p) => ok({ data: p.limit ? db.news.slice(0, Number(p.limit)) : db.news })],

  // The detail endpoint carries the season and the form; the list stays lean.
  //
  // NO `|| db.players[0]` HERE, unlike its neighbours. Falling back to the first
  // record keeps a screen alive when a link is stale, which is the right trade for
  // an embedded panel — but /players/:id is a page people link to directly, and
  // serving somebody else's season under the requested id is worse than an error.
  // The page has an ErrorState for exactly this.
  ['GET', /^\/players\/([^/]+)\/?$/, (m) => {
    const player = byId(db.players, m[1]);
    if (!player) return { data: { message: 'Player not found' }, status: 404, statusText: 'Not Found', headers: {} };
    return ok({ data: { ...player, season: db.seasonFor(player), form: db.formFor(player, db.fixtures) } });
  }],
  ['GET', /^\/players\/?$/, (_m, p) => ok({ data: filterPlayers(p) })],

  ['GET', /^\/documents\/requirements\/?$/, () => ok({ data: ['NATIONAL_ID', 'BIRTH_CERTIFICATE', 'MEDICAL', 'PASSPORT'] })],
  ['GET', /^\/documents\/?$/, (_m, p) => ok({ data: p.status ? db.documents.filter((d) => d.status === p.status) : db.documents })],

  // Racing sports: a race calendar + classification, keyed by sport (not fixtures).
  ['GET', /^\/races\/([^/]+)\/?$/, (m) => ok({ data: db.raceById(m[1]) || null })],
  ['GET', /^\/races\/?$/, (_m, p) => ok({ data: db.racingForSport(p.sportId) })],

  ['GET', /^\/venues\/?$/, () => ok({ data: db.venues })],
  ['GET', /^\/transfers\/?$/, () => ok({ data: db.transfers })],
  ['GET', /^\/officials\/?$/, () => ok({ data: db.officials })],
  ['GET', /^\/contacts\/?$/, (_m, p) => ok({ data: p.status ? db.contacts.filter((c) => c.status === p.status) : db.contacts })],
  ['GET', /^\/(payments|transactions)\/?$/, () => ok({ data: db.transactions })],

  ['GET', /^\/activity\/?$/, (_m, p) => paginate(db.activityLogs, p)],
  ['GET', /^\/settings\/all\/?$/, () => ok({ data: db.settingsAll })],
  ['GET', /^\/settings\/?$/, () => ok({ data: db.settings })],
  ['GET', /^\/ads\/?$/, (_m, p) => ok({ data: p.position ? db.adsList.filter((a) => a.position === p.position) : db.adsList })],

  // Admin console
  ['GET', /^\/admin\/stats\/?$/, () => ok({ data: db.adminStats })],
  ['GET', /^\/admin\/dashboard\/?$/, () => ok({ data: db.adminStats })],
  ['GET', /^\/admin\/sport-admins\/?$/, () => ok({ data: db.sportAdmins })],
  ['GET', /^\/admin\/visitors\/?$/, (_m, p) => paginate(db.activityLogs, p)],
  ['GET', /^\/admin\/roster\/?$/, (_m, p) => ok({ data: filterPlayers(p) })],
  ['GET', /^\/admin\/leagues\/?$/, (_m, p) => ok({ data: filterLeagues(p) })],
  ['GET', /^\/admin\/teams\/?$/, (_m, p) => ok({ data: filterTeams(p) })],
  ['GET', /^\/admin\/players\/?$/, (_m, p) => ok({ data: filterPlayers(p) })],
  ['GET', /^\/admin\/fixtures\/?$/, (_m, p) => ok({ data: filterFixtures(p) })],
  ['GET', /^\/admin\/documents\/?$/, (_m, p) => ok({ data: p.status ? db.documents.filter((d) => d.status === p.status) : db.documents })],
  ['GET', /^\/admin\/news\/?$/, () => ok({ data: db.news })],
  ['GET', /^\/admin\/ads\/?$/, () => ok({ data: db.adsList })],
  ['GET', /^\/admin\/championships\/?$/, () => ok({ data: db.akcCompetitions })],
  ['GET', /^\/admin\/settings\/?$/, () => ok({ data: db.settingsAll })],
  ['GET', /^\/admin\/akc3\/?$/, () => ok({ data: { competitions: db.akcCompetitions, teams: db.akcTeams, standings: db.akcStandings } })],

  // Amashuri Games (served under /akc3/*)
  ['GET', /^\/akc3\/(admin\/)?schools\/([^/]+)\/?$/, (m) => ok({ data: db.buildSchoolDetail(byId(db.schools, m[2]) || db.schools[0]) })],
  ['GET', /^\/akc3\/(admin\/)?schools\/?$/, (_m, p) => ok({ data: filterSchools(p) })],
  // A school team is a destination now, not a row inside a school page.
  ['GET', /^\/akc3\/teams\/([^/]+)\/?$/, (m) => {
    const team = byId(db.akcTeams, m[1]);
    if (!team) return { data: { message: 'Team not found' }, status: 404, statusText: 'Not Found', headers: {} };
    return ok({ data: db.buildAkcTeamDetail(team) });
  }],
  ['GET', /^\/akc3\/teams\/?$/, (_m, p) => ok({ data: p.schoolId ? db.akcTeams.filter((t) => String(t.schoolId) === String(p.schoolId)) : db.akcTeams })],
  // Same shape /players/:id returns, so both feed the one PlayerProfile.
  ['GET', /^\/akc3\/athletes\/([^/]+)\/?$/, (m) => {
    const athlete = byId(db.akcAthletes, m[1]);
    if (!athlete) return { data: { message: 'Athlete not found' }, status: 404, statusText: 'Not Found', headers: {} };
    const team = byId(db.akcTeams, athlete.teamId);
    return ok({ data: {
      ...athlete,
      season: db.seasonFor(athlete),
      form: db.akcFormFor(athlete),
      teamLabel: team,
    } });
  }],
  ['GET', /^\/akc3\/fixtures\/([^/]+)\/?$/, (m) => ok({ data: byId(db.akcFixtures, m[1]) || db.akcFixtures[0] })],
  ['GET', /^\/akc3\/(fixtures|results)\/?$/, (_m, p) => ok({ data: filterAkcFixtures(p) })],
  ['GET', /^\/akc3\/standings\/?$/, (_m, p) => ok({ data: p.competitionId ? db.akcStandings.filter((s) => String(s.competitionId) === String(p.competitionId)) : db.akcStandings })],
  ['GET', /^\/akc3\/(admin\/)?competitions\/([^/]+)\/?$/, (m) => ok({ data: byId(db.akcCompetitions, m[2]) || db.akcCompetitions[0] })],
  ['GET', /^\/akc3\/(admin\/)?competitions\/?$/, () => ok({ data: db.akcCompetitions })],
  ['GET', /^\/akc3\/sports\/?$/, () => ok({ data: db.akcSports })],
  ['GET', /^\/akc3\/announcements\/?$/, () => ok({ data: db.akcAnnouncements })],

  // Auth — demo login accepts any credentials; username hints the role/portal.
  ['POST', /^\/auth\/login\/?$/, (_m, _p, body) => ok({ user: db.loginUser(body?.username), accessToken: 'demo-token', refreshToken: 'demo-refresh' })],
  ['POST', /^\/auth\/refresh\/?$/, () => ok({ accessToken: 'demo-token' })],
  ['POST', /^\/auth\/logout\/?$/, () => ok({ message: 'Logged out' })],
  ['GET', /^\/auth\/me\/?$/, () => ok(db.demoUser)],
];

export default function mockAdapter(config) {
  const method = (config.method || 'get').toUpperCase();
  const raw = config.url || '';
  const url = raw.split('?')[0];
  // A QUERY STRING IN THE URL COUNTS TOO. This read only `config.params`, so a
  // caller that wrote the query by hand — `get('/ads?position=SIDEBAR')`, which is
  // how every ad slot asks — had its filter silently dropped and got the unfiltered
  // list back. Every slot on the page then rendered `list[0]`: the same advert
  // three times over. Axios params still win, since they are the typed form.
  const query = Object.fromEntries(new URLSearchParams(raw.split('?')[1] || ''));
  const params = { ...query, ...(config.params || {}) };
  let body = config.data;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { /* leave as-is */ }
  }

  for (const [m, re, handler] of routes) {
    if (m !== method) continue;
    const match = url.match(re);
    if (match) {
      const res = handler(match, params, body);
      const response = { ...res, config, request: {} };
      // An adapter settles its own status — axios does not apply validateStatus to
      // what an adapter resolves with. Without this, a handler returning 404
      // resolved as a success and the caller rendered the error body as data.
      if (response.status >= 400) {
        return Promise.reject(Object.assign(new Error(`Request failed with status code ${response.status}`), {
          isAxiosError: true, config, request: {}, response,
        }));
      }
      return Promise.resolve(response);
    }
  }

  // Safe fallbacks so unmapped endpoints never crash a screen.
  if (method === 'GET') return Promise.resolve({ ...ok({ data: [] }), config, request: {} });
  return Promise.resolve({ ...ok({ success: true }, 200), config, request: {} });
}
