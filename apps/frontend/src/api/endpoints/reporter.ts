import apiClient from '../client';

/**
 * Everything the reporter portal is allowed to do, in one place.
 *
 * WHY A MODULE AND NOT `apiClient.post(...)` AT EACH CALL SITE. A match reporter
 * holds exactly three capabilities on the server — `fixtures.report`,
 * `fixtures.lineups` and `reporters.profile` — and every one of them is checked
 * per fixture by canManageFixture(). Collecting the calls here means the portal
 * can be read against that list and shown to grant nothing more: there is no
 * `createFixture`, no `deleteFixture`, no team or player write in this file,
 * because a reporter reports a match, they do not run the competition.
 *
 * Each function returns the payload the server actually sends (`data.data` where
 * the envelope carries one), so no screen has to remember which shape it gets.
 */

/* ── assignments ─────────────────────────────────────────────────────────── */

/** Fixtures this reporter is down for, directly or through their league. */
export const getMyFixtures = async (reporterId: number | string, params: Record<string, any> = {}) => {
  const { data } = await apiClient.get('/fixtures', { params: { reporterId, limit: 200, ...params } });
  return data.data;
};

/** One match, with events, line-ups, team sheets, stats and the derived clock. */
export const getMatch = async (id: number | string) => {
  const { data } = await apiClient.get(`/fixtures/${id}`);
  return data.data;
};

/* ── the clock ───────────────────────────────────────────────────────────── */

/**
 * Period transitions and the referee's added minutes.
 *
 * `start` is the only way a match goes live from this portal: it stamps kick-off,
 * writes the KICKOFF event and flips the status in one call, so the clock and the
 * feed can never disagree about when the match began.
 */
export type ClockAction = 'start' | 'halftime' | 'resume' | 'fulltime';
export const setClock = async (id: number | string, body: { action?: ClockAction; addedMinutes?: number }) => {
  const { data } = await apiClient.post(`/fixtures/${id}/clock`, body);
  return data;
};

/* ── the feed ────────────────────────────────────────────────────────────── */

/** Publish an event. No minute is sent — the server stamps it from the clock. */
export const addEvent = async (id: number | string, body: Record<string, any>) => {
  const { data } = await apiClient.post(`/fixtures/${id}/events`, body);
  return data;
};

/**
 * Remove an event. The server puts back the score, the scorer's tally and any
 * suspension the card produced, which is why this is safe to reach for the
 * moment a tap lands on the wrong team.
 */
export const removeEvent = async (id: number | string, eventId: number) => {
  const { data } = await apiClient.delete(`/fixtures/${id}/events/${eventId}`);
  return data;
};

/* ── team sheets ─────────────────────────────────────────────────────────── */

export type LineupRow = {
  playerId: number;
  position?: string | null;
  jerseyNo?: number | null;
  isStarter?: boolean;
  isCaptain?: boolean;
};

/**
 * Publish one team's sheet.
 *
 * The server rejects the whole sheet — by name — if it lists a player from
 * another squad or one serving a ban, so the caller must surface `message`
 * rather than assume a 4xx means "something went wrong".
 */
export const saveLineup = async (
  id: number | string,
  body: { teamId: number; formation?: string | null; coachName?: string | null; published?: boolean; players: LineupRow[] }
) => {
  const { data } = await apiClient.put(`/fixtures/${id}/lineup`, body);
  return data;
};

/** A team's squad, for building that sheet. */
export const getTeam = async (teamId: number) => {
  const { data } = await apiClient.get(`/teams/${teamId}`);
  return data.data;
};

/* ── stats and the result ────────────────────────────────────────────────── */

export type MatchStatInput = {
  teamId: number;
  possession?: number | string | null;
  shots?: number | string | null;
  shotsOnTarget?: number | string | null;
  corners?: number | string | null;
  offsides?: number | string | null;
  fouls?: number | string | null;
  gkSaves?: number | string | null;
  passAccuracy?: number | string | null;
};

/** Per-team match statistics. Pushed live to anyone watching the Stats tab. */
export const saveStats = async (id: number | string, body: MatchStatInput) => {
  const { data } = await apiClient.put(`/fixtures/${id}/stats`, body);
  return data;
};

/**
 * The confirmed result: full-time score, half-time score and attendance.
 *
 * Distinct from the clock's `fulltime`, which ends the reporting session and
 * lets the event log speak for the score. This is the reporter signing off on
 * the official line, and the server stops recounting events once it is saved.
 */
export const saveResult = async (
  id: number | string,
  body: { homeScore: number; awayScore: number; homeScoreHt?: number | null; awayScoreHt?: number | null; attendance?: number | null; status?: string }
) => {
  const { data } = await apiClient.post(`/fixtures/${id}/result`, body);
  return data;
};

/* ── match detail a reporter may correct ─────────────────────────────────── */

/**
 * Venue, referee and the stream link.
 *
 * The endpoint also accepts `matchDate` and `status`; this portal deliberately
 * never sends either. Rescheduling and abandoning a match are the league admin's
 * decisions, and a control that quietly moved a fixture would be the one thing
 * on this screen a reporter could not undo.
 */
export const updateMatchDetail = async (
  id: number | string,
  body: { venue?: string | null; referee?: string | null; streamUrl?: string | null; streamActive?: boolean }
) => {
  const { data } = await apiClient.patch(`/fixtures/${id}`, body);
  return data;
};

/* ── the reporter themselves ─────────────────────────────────────────────── */

export const getMyReporterProfile = async () => {
  const { data } = await apiClient.get('/reporters/me');
  return data.data;
};

export const updateMyReporterProfile = async (body: Record<string, any>) => {
  const { data } = await apiClient.put('/reporters/me', body);
  return data.data;
};

// The photograph moved to api/endpoints/account — it writes `User.avatar`, which
// belongs to the account rather than to the reporter profile, and the club portal
// needs the identical control for a coach.
export { uploadMyAvatar, removeMyAvatar } from './account';
