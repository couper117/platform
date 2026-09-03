import apiClient from '../client';

/**
 * Everything the club portal is allowed to do, in one place.
 *
 * A TEAM_MANAGER — the coach — holds four capabilities on the server:
 * `teams.write`, `players.read` / `players.write`, `fixtures.lineups` and
 * `payments.subscribe`. Collecting the calls here means the portal can be read
 * against that list and shown to grant nothing more. In particular there is no
 * event, no clock and no result in this file: a coach names their side, the
 * reporter at the ground reports the match, and neither does the other's job.
 *
 * The one endpoint they share is `PUT /fixtures/:id/lineup`, and the server tells
 * them apart there: `canManageTeamSheet` lets a coach write only their own team's
 * sheet, and locks it once the match is under way — a lock a reporter does not
 * have, because a late change still has to be recorded from the touchline.
 */

/* ── the club ────────────────────────────────────────────────────────────── */

/** The signed-in coach's club, with its squad, officials and league standings. */
export const getMyTeam = async () => {
  const { data } = await apiClient.get('/teams/my');
  return data.data;
};

/**
 * Club details. Multipart because the crest rides along with it — the server
 * takes the logo on the same `PUT` that takes the name and the colours.
 */
export const updateMyTeam = async (teamId: number, fields: Record<string, any>, logo?: File | null) => {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(key, String(value));
  });
  if (logo) body.append('logo', logo);
  const { data } = await apiClient.put(`/teams/${teamId}`, body);
  return data.data;
};

/* ── the squad ───────────────────────────────────────────────────────────── */

export const getMyPlayers = async (teamId: number) => {
  const { data } = await apiClient.get('/players', { params: { teamId, limit: 200 } });
  return data.data;
};

/**
 * One player in full: career, the season sheet, recent form, their documents and
 * any ACTIVE SUSPENSION.
 *
 * A TEAM_MANAGER is in the server's `PERSONAL_DATA_ROLES`, so a coach receives
 * the unredacted record for their own squad rather than the public projection.
 * That is the only place a club can see that a player is banned: `GET
 * /suspensions` is gated on `suspensions.read`, which they do not hold, so
 * without this page the first they hear of it is the team sheet being refused by
 * name at filing time.
 */
export const getPlayer = async (id: number | string) => {
  const { data } = await apiClient.get(`/players/${id}`);
  return data.data;
};

/**
 * Create or update a player, with an optional photograph on the same request.
 *
 * ALWAYS MULTIPART. The endpoints run through `upload.single('photo')`, and
 * sending JSON to a multer route works only until the first time somebody
 * attaches a file — so both shapes go the same way and there is no second code
 * path that is only exercised when a photo is present.
 *
 * A blank value is sent as an empty string rather than omitted: multer gives the
 * controller strings, and omitting a key means "leave it alone" where an empty
 * string means "clear it". Those are different intentions and the caller decides
 * which by including the key or not.
 */
const playerForm = (fields: Record<string, any>, photo?: File | null) => {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    body.append(key, value === null ? '' : String(value));
  });
  if (photo) body.append('photo', photo);
  return body;
};

export const createPlayer = async (fields: Record<string, any>, photo?: File | null) => {
  const { data } = await apiClient.post('/players', playerForm(fields, photo));
  return data.data;
};

export const updatePlayer = async (id: number, fields: Record<string, any>, photo?: File | null) => {
  const { data } = await apiClient.put(`/players/${id}`, playerForm(fields, photo));
  return data.data;
};

export const deletePlayer = async (id: number) => {
  const { data } = await apiClient.delete(`/players/${id}`);
  return data;
};

/* ── club staff ──────────────────────────────────────────────────────────── */

/**
 * Coaching staff and officials. `canManageTeam` on the server confines each of
 * these to the caller's own club, which is why the routes carry only `protect`.
 */
export const getOfficials = async (teamId: number) => {
  const { data } = await apiClient.get('/officials', { params: { teamId } });
  return data.data;
};

export const createOfficial = async (body: Record<string, any>) => {
  const { data } = await apiClient.post('/officials', body);
  return data.data;
};

export const updateOfficial = async (id: number, body: Record<string, any>) => {
  const { data } = await apiClient.patch(`/officials/${id}`, body);
  return data.data;
};

export const deleteOfficial = async (id: number) => {
  const { data } = await apiClient.delete(`/officials/${id}`);
  return data;
};

/* ── matches ─────────────────────────────────────────────────────────────── */

/** Every fixture this club is in, home or away. */
export const getMyFixtures = async (teamId: number, params: Record<string, any> = {}) => {
  const { data } = await apiClient.get('/fixtures', { params: { teamId, limit: 200, ...params } });
  return data.data;
};

/**
 * One match in full: events, line-ups, team sheets with their author, stats, the
 * derived clock — and `assignedReporters`, which is how a coach finds out who is
 * covering their game.
 */
export const getMatch = async (id: number | string) => {
  const { data } = await apiClient.get(`/fixtures/${id}`);
  return data.data;
};

/* ── the team sheet ──────────────────────────────────────────────────────── */

export type LineupRow = {
  playerId: number;
  position?: string | null;
  jerseyNo?: number | null;
  isStarter?: boolean;
  isCaptain?: boolean;
};

/**
 * File this club's side for a match.
 *
 * THE SERVER REFUSES A WHOLE SHEET, BY NAME, in three cases the caller must
 * surface verbatim rather than flatten into "something went wrong":
 *   400 — "Not in this squad: <names>"
 *   409 — "Suspended, cannot be named: <name> (2 matches of a red card ban left)"
 *         plus `suspended: number[]`, the offending player ids
 *   423 — the match has started, and a coach's sheet is locked from kick-off
 *
 * The 423 is the one that separates this portal from the reporter's: a coach
 * files before kick-off, and after it the record of a late change belongs to
 * whoever is standing at the touchline.
 */
export const saveLineup = async (
  fixtureId: number | string,
  body: { teamId: number; formation?: string | null; coachName?: string | null; published?: boolean; players: LineupRow[] }
) => {
  const { data } = await apiClient.put(`/fixtures/${fixtureId}/lineup`, body);
  return data;
};

/* ── documents ───────────────────────────────────────────────────────────── */

export const getDocumentRequirements = async () => {
  const { data } = await apiClient.get('/documents/requirements');
  return data.data;
};

export const uploadDocument = async (body: FormData) => {
  const { data } = await apiClient.post('/documents/upload', body);
  return data.data;
};
