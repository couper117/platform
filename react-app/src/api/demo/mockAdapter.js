/**
 * Axios adapter for the static showcase build (VITE_DEMO=true).
 *
 * Intercepts every request the app makes and resolves it from the local demo
 * dataset, so the production frontend runs with zero backend / database.
 * Unknown GET routes fall back to an empty list and writes return a success
 * stub, so no screen ever crashes on a missing endpoint.
 */
import * as db from './mockData';

const ok = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
});

const byId = (list, id) => list.find((x) => String(x.id) === String(id));

// Filter helpers -----------------------------------------------------------
const filterFixtures = (params = {}) => {
  let list = db.fixtures;
  if (params.status) list = list.filter((f) => f.status === params.status);
  if (params.leagueId) list = list.filter((f) => String(f.league?.id) === String(params.leagueId));
  if (params.teamId) list = list.filter((f) => String(f.homeTeamId) === String(params.teamId) || String(f.awayTeamId) === String(params.teamId));
  if (params.limit) list = list.slice(0, Number(params.limit));
  return list;
};

const filterLeagues = (params = {}) => {
  let list = db.leagues;
  if (params.sportId) list = list.filter((l) => String(l.sport?.id) === String(params.sportId));
  if (params.gender) list = list.filter((l) => l.gender === params.gender);
  if (params.level) list = list.filter((l) => l.level === params.level);
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
  return list;
};

const filterPlayers = (params = {}) => {
  let list = db.players;
  if (params.search) {
    const q = String(params.search).toLowerCase();
    list = list.filter((p) => p.fullName.toLowerCase().includes(q) || String(p.id) === q);
  }
  return list;
};

const filterAkcFixtures = (params = {}) => {
  let list = db.akcFixtures;
  if (params.competitionId) list = list.filter((f) => String(f.competitionId) === String(params.competitionId));
  if (params.status) list = list.filter((f) => f.status === params.status);
  if (params.schoolId) list = list.filter((f) => String(f.homeTeam?.schoolId) === String(params.schoolId) || String(f.awayTeam?.schoolId) === String(params.schoolId));
  return list;
};

// Route table — each entry: [method, RegExp, handler(match, params, body)] ---
const routes = [
  ['GET', /^\/sports\/?$/, () => ok({ data: db.sports })],

  ['GET', /^\/leagues\/?$/, (_m, p) => {
    const data = filterLeagues(p);
    return ok({ data, count: data.length });
  }],
  ['GET', /^\/leagues\/([^/]+)\/standings\/?$/, () => ok(db.standings.map((s, i) => ({ ...s, rank: i + 1 })))],
  ['GET', /^\/leagues\/([^/]+)\/scorers\/?$/, () => ok(db.topScorers)],
  ['GET', /^\/leagues\/([^/]+)\/?$/, (m) => ok({ data: db.buildLeagueDetail(byId(db.leagues, m[1]) || db.leagues[0]) })],

  ['GET', /^\/teams\/my\/?$/, () => ok({ data: db.buildMyTeam() })],
  ['GET', /^\/teams\/?$/, (_m, p) => ok({ data: filterTeams(p) })],
  ['GET', /^\/teams\/([^/]+)\/?$/, (m) => ok({ data: byId(db.teams, m[1]) || db.teams[0] })],

  ['GET', /^\/fixtures\/?$/, (_m, p) => ok({ data: filterFixtures(p) })],
  ['GET', /^\/fixtures\/([^/]+)\/?$/, (m) => ok({ data: db.buildFixtureDetail(byId(db.fixtures, m[1]) || db.fixtures[0]) })],

  ['GET', /^\/news\/?$/, (_m, p) => ok({ data: p.limit ? db.news.slice(0, Number(p.limit)) : db.news })],
  ['GET', /^\/news\/([^/]+)\/?$/, (m) => ok({ data: db.news.find((n) => n.slug === m[1] || String(n.id) === m[1]) || db.news[0] })],

  ['GET', /^\/players\/?$/, (_m, p) => ok({ data: filterPlayers(p) })],
  ['GET', /^\/documents\/?$/, (_m, p) => ok({ data: p.status ? db.documents.filter((d) => d.status === p.status) : db.documents })],
  ['GET', /^\/activity\/?$/, (_m, p) => {
    const limit = Number(p.limit) || 20;
    const page = Number(p.page) || 1;
    return ok({ data: db.activityLogs.slice((page - 1) * limit, page * limit), total: db.activityLogs.length, pages: Math.ceil(db.activityLogs.length / limit), page });
  }],