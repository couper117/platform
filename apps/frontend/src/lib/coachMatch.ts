/**
 * What a coach needs to know about a match, derived once.
 *
 * The mirror of lib/reporterMatch, and deliberately a separate file: the two
 * roles read the same fixture and want opposite things from it. A reporter asks
 * "can I report this?"; a coach asks "have I done my part, and who is covering
 * us?" Sharing one helper would have meant one of them reading a checklist
 * written for the other.
 *
 * NOTHING HERE IS INVENTED. Every field read is one `GET /fixtures/:id` really
 * returns — lineups, teamSheets (now with `submittedBy`), assignedReporters,
 * status, matchDate, venue.
 */

export const ACTIVE_STATUSES = ['SCHEDULED', 'LIVE'];
export const CLOSED_STATUSES = ['COMPLETED', 'ABANDONED', 'CANCELLED', 'POSTPONED'];

/**
 * A coach's sheet is locked from kick-off.
 *
 * This is the server's rule, not a UI preference — `saveLineup` returns 423 for a
 * TEAM_MANAGER once the fixture is LIVE or COMPLETED. It is also the one place
 * the two portals genuinely differ: a REPORTER may still fix a sheet mid-match,
 * because a late announced change has to be recordable from the touchline. The
 * copy that goes with this state should say where to turn, not just that the door
 * is shut.
 */
export const LOCKED_STATUSES = ['LIVE', 'COMPLETED'];
export const isSheetLocked = (fixture: any) => LOCKED_STATUSES.includes(fixture?.status);

/** Which side of this fixture is the coach's club? */
export const sideOf = (fixture: any, teamId?: number | null) =>
  fixture?.homeTeamId === teamId ? 'home' : fixture?.awayTeamId === teamId ? 'away' : null;

export const opponentOf = (fixture: any, teamId?: number | null) =>
  fixture?.homeTeamId === teamId ? fixture?.awayTeam : fixture?.homeTeam;

/** "H" or "A", the only two letters a coach reads a fixture list by. */
export const homeOrAway = (fixture: any, teamId?: number | null) =>
  (sideOf(fixture, teamId) === 'home' ? 'H' : sideOf(fixture, teamId) === 'away' ? 'A' : '—');

/* ── the team sheet ──────────────────────────────────────────────────────── */

/**
 * Who named this side. Lives in lib/teamSheet because it is the seam BETWEEN the
 * two portals rather than a fact belonging to either — re-exported here so a
 * club screen has one import for everything it reads off a fixture.
 */
export { sheetAuthor, authorLabel, authorName, type SheetAuthor } from './teamSheet';
import { sheetAuthor as authorOf } from './teamSheet';

/**
 * The team sheet for one club in one fixture.
 *
 * TWO RESPONSES ANSWER THIS, AND THEY ANSWER IT DIFFERENTLY. The fixture DETAIL
 * carries `lineups`, so it knows exactly who is named. The fixture LIST carries
 * only a compact `teamSheets` — team id, author, published — because pulling
 * every player row for two hundred fixtures to answer a yes/no question is not a
 * trade worth making.
 *
 * So `filed` is read from the named players where they are available and from the
 * sheet record where they are not, and `known` says which of those happened. A
 * caller that has neither must not print "no team sheet": that was the defect
 * this replaced — a club that had filed every sheet saw a warning on every row,
 * because the list simply had not been told.
 */
export const sheetFor = (fixture: any, teamId?: number | null) => {
  const meta = (fixture?.teamSheets || []).find((s: any) => s.teamId === teamId) || null;
  const hasLineups = Array.isArray(fixture?.lineups);
  const rows = hasLineups ? fixture.lineups.filter((l: any) => l.teamId === teamId) : [];

  return {
    meta,
    rows,
    /** True where something is on file. Falls back to the sheet record on a list. */
    filed: hasLineups ? rows.length > 0 : !!meta,
    /** False when neither the players nor the sheet record came back at all. */
    known: hasLineups || Array.isArray(fixture?.teamSheets),
    /** Only the detail response can list them; a list row has none to give. */
    starters: rows.filter((r: any) => r.isStarter),
    bench: rows.filter((r: any) => !r.isStarter),
    author: authorOf(meta),
  };
};

/* ── what the coach still owes ───────────────────────────────────────────── */

export type CoachTask = {
  key: string;
  label: string;
  done: boolean;
  why: string;
  /** Where the fix is. */
  to?: string;
};

/**
 * The pre-match checklist, from the club's side.
 *
 * Deliberately SHORTER than the reporter's. A coach is not responsible for the
 * stream link, the venue or the opponent's sheet, and listing things they cannot
 * act on turns a checklist into noise. Their side of it is one item, and it is
 * the item the whole reporter/coach handover turns on.
 */
export const matchTasks = (fixture: any, teamId?: number | null): CoachTask[] => {
  if (!fixture || teamId == null) return [];
  const sheet = sheetFor(fixture, teamId);
  const locked = isSheetLocked(fixture);

  return [
    {
      key: 'sheet',
      label: 'Team sheet filed',
      done: sheet.filed,
      why: locked
        ? 'The match has started, so your sheet is locked. A late change is recorded by the reporter at the ground.'
        : 'File it before kick-off. If you do not, the reporter has to copy it off paper at the ground — and until somebody does, a goal for your club cannot name the player who scored it.',
      to: `/team/formation?fixture=${fixture.id}`,
    },
  ];
};

/** Fixtures this club still owes a sheet for — the club portal's one true nag. */
export const sheetsOutstanding = (fixtures: any[], teamId?: number | null) =>
  (fixtures || []).filter((f: any) => f.status === 'SCHEDULED');

/* ── who is covering us ──────────────────────────────────────────────────── */

/**
 * The reporters assigned to this match.
 *
 * `GET /fixtures/:id` returns only their name, id and avatar — deliberately, per
 * the comment on that include: a live feed is somebody's work and the match page
 * credits them, but the club has no business with their email address. So this
 * shows a face and a name, and links nowhere: `/reporters/:id` needs
 * `reporters.read`, which a coach does not hold, and a link that 403s is worse
 * than no link.
 */
export const reportersOn = (fixture: any) =>
  (fixture?.assignedReporters || []).map((a: any) => a.user).filter(Boolean);

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

/** "in 2h 15m", "in 3 days", "kick-off passed". Coarse past an hour on purpose. */
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

export const bySoonest = (a: any, b: any) => +new Date(a.matchDate || 0) - +new Date(b.matchDate || 0);
export const byNewest = (a: any, b: any) => +new Date(b.matchDate || 0) - +new Date(a.matchDate || 0);

/* ── the squad's paperwork ───────────────────────────────────────────────── */

/**
 * How many required documents the squad is still missing, counted the way the
 * old dashboard counted them — approved documents only, because a pending upload
 * is not clearance to play.
 */
export const missingDocuments = (players: any[], requiredDocTypes: string[] = []) => {
  if (!requiredDocTypes.length) return { missing: 0, players: [] as any[] };
  const short = (players || []).map((p: any) => {
    const approved = new Set(
      (p.documents || []).filter((d: any) => d.status === 'APPROVED').map((d: any) => d.docType)
    );
    const gaps = requiredDocTypes.filter((t) => !approved.has(t));
    return { player: p, gaps };
  }).filter((row) => row.gaps.length > 0);

  return { missing: short.reduce((n, row) => n + row.gaps.length, 0), players: short };
};
