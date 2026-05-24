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