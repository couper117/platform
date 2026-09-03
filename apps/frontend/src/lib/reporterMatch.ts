/**
 * What a reporter needs to know about a match, derived once.
 *
 * WHY THIS IS NOT INSIDE A COMPONENT. Four screens ask the same three questions —
 * is this match mine to start, is it ready to be reported, and what is still
 * missing — and each one answered them differently while the console was the only
 * reporting surface. Today's list called a match "ready" if it existed; the
 * console discovered at kick-off that neither team had a sheet and offered no way
 * out. One function means the readiness a reporter is shown on Monday is the same
 * readiness the console enforces on Saturday.
 *
 * NOTHING HERE IS INVENTED. Every field read below is one the API really returns
 * from GET /fixtures/:id (teamSheets, lineups, stats, streamUrl, status).
 */

export const ACTIVE_STATUSES = ['SCHEDULED', 'LIVE'];
export const CLOSED_STATUSES = ['COMPLETED', 'ABANDONED', 'CANCELLED', 'POSTPONED'];

/** Clock markers belong to the clock controls, never to the reporter's undo. */
export const CLOCK_EVENTS = ['KICKOFF', 'HALFTIME', 'FULLTIME', 'EXTRA_TIME'];

export type ReadinessItem = {
  key: string;
  label: string;
  done: boolean;
  /** True where the match can still be reported without it. */
  optional: boolean;
  /** What the reporter loses by leaving it undone. */
  why: string;
};

/**
 * The pre-match checklist.
 *
 * A team sheet is marked REQUIRED even though the server will happily accept a
 * goal with no player attached, because a goal credited to nobody is a goal that
 * never reaches a scorer's tally or a player page — the reporter's work
 * evaporates quietly. The stream link is genuinely optional and says so.
 *
 * NOTE WHOSE ITEM EACH ONE IS. A team sheet is the COACH's to file, from the club
 * portal; it appears here because the reporter is the one who finds out at 14:50
 * that it never arrived, and who can record the paper version. The `why` lines
 * say so, rather than reading like a list of the reporter's own omissions.
 */
export const readiness = (fixture: any): ReadinessItem[] => {
  if (!fixture) return [];
  const sheetFor = (teamId: number) =>
    (fixture.lineups || []).some((l: any) => l.teamId === teamId);

  return [
    {
      key: 'home-sheet',
      label: `${fixture.homeTeam?.shortName || fixture.homeTeam?.name || 'Home'} team sheet`,
      done: sheetFor(fixture.homeTeamId),
      optional: false,
      why: 'The coach files this. Without it, goals and cards for this team cannot name a player.',
    },
    {
      key: 'away-sheet',
      label: `${fixture.awayTeam?.shortName || fixture.awayTeam?.name || 'Away'} team sheet`,
      done: sheetFor(fixture.awayTeamId),
      optional: false,
      why: 'The coach files this. Without it, goals and cards for this team cannot name a player.',
    },
    {
      key: 'venue',
      label: 'Venue confirmed',
      done: !!fixture.venue,
      optional: true,
      why: 'Followers see “Venue TBD” on the public match page.',
    },
    {
      key: 'stream',
      label: 'Stream link',
      done: !!fixture.streamUrl,
      optional: true,
      why: 'Only needed if this match is being broadcast.',
    },
  ];
};

/** How far through the checklist, as a fraction and as the blocking count. */
export const readinessSummary = (fixture: any) => {
  const items = readiness(fixture);
  const required = items.filter((i) => !i.optional);
  const blocking = required.filter((i) => !i.done);
  return {
    items,
    done: items.filter((i) => i.done).length,
    total: items.length,
    blocking,
    ready: blocking.length === 0,
  };
};

/** Has the reporter finished the paperwork a completed match still needs? */
export const closeoutSummary = (fixture: any) => {
  if (!fixture) return { items: [], outstanding: 0 };
  const statFor = (teamId: number) => (fixture.stats || []).some((s: any) => s.teamId === teamId);
  const items = [
    { key: 'score', label: 'Final score confirmed', done: fixture.homeScore != null && fixture.awayScore != null },
    { key: 'ht', label: 'Half-time score', done: fixture.homeScoreHt != null && fixture.awayScoreHt != null },
    { key: 'attendance', label: 'Attendance', done: fixture.attendance != null },
    { key: 'stats', label: 'Match statistics', done: statFor(fixture.homeTeamId) && statFor(fixture.awayTeamId) },
  ];
  return { items, outstanding: items.filter((i) => !i.done).length };
};

/* ── time ────────────────────────────────────────────────────────────────── */

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const isToday = (iso?: string | null) =>
  !!iso && startOfDay(new Date(iso)) === startOfDay(new Date());

export const isWithinDays = (iso: string | null | undefined, days: number) => {
  if (!iso) return false;
  const delta = startOfDay(new Date(iso)) - startOfDay(new Date());
  return delta >= 0 && delta < days * DAY;
};

/**
 * "in 2h 15m", "in 3 days", "kick-off passed".
 *
 * Deliberately coarse past an hour: a reporter travelling to a ground needs to
 * know whether they have time, not the second count.
 */
export const timeUntil = (iso?: string | null, nowMs = Date.now()) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - nowMs;
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return 'kick-off passed';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h ${mins % 60}m`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
};

/** Sort helpers — soonest first for what is coming, newest first for what is done. */
export const bySoonest = (a: any, b: any) => +new Date(a.matchDate || 0) - +new Date(b.matchDate || 0);
export const byNewest = (a: any, b: any) => +new Date(b.matchDate || 0) - +new Date(a.matchDate || 0);
