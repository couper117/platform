/**
 * Pure match-clock rules. No database, no IO — composed by the controller so the
 * arithmetic can be unit-tested on its own (see test/unit/matchClock.test.ts).
 * Same split as eligibility.rules.ts and import.rules.ts.
 *
 * The clock is derived from a timestamp, never ticked and stored. A stored,
 * incremented minute drifts the moment a request is slow, a reporter refreshes,
 * or a second person opens the console — and the one thing a match clock must be
 * is the same number on every screen.
 */

/** Where each period counts up from, and where its regulation time ends. */
const PERIODS = {
  PRE:         { base: 0,  regulationEnd: 0,  running: false },
  FIRST_HALF:  { base: 0,  regulationEnd: 45, running: true },
  HALF_TIME:   { base: 45, regulationEnd: 45, running: false },
  SECOND_HALF: { base: 45, regulationEnd: 90, running: true },
  FULL_TIME:   { base: 90, regulationEnd: 90, running: false },
};

const MS_PER_MINUTE = 60_000;

/**
 * Most stoppage a period can plausibly show. Referees signal single-digit
 * minutes; a dozen is already extraordinary.
 *
 * Without a ceiling the clock climbs forever: a reporter who forgets to press
 * full time leaves a match reading "90+5819'" days later, which is what a match
 * left running over a long weekend actually produced. Past this the clock is
 * clamped and flagged stalled, so the display stays sane and the state is
 * visibly wrong rather than quietly absurd.
 */
const MAX_STOPPAGE = 15;

/**
 * The state a period transition should write.
 *
 * `action` is what the reporter did. Returning the whole shape — rather than
 * mutating — keeps every transition in one readable table.
 */
const transition = (action: string, now: Date) => {
  switch (action) {
    case 'start':
      return { period: 'FIRST_HALF', periodStartedAt: now, periodBaseMinute: 0, addedMinutes: 0, eventType: 'KICKOFF', minute: 0 };
    case 'halftime':
      // Clock stops. Base moves to 45 so anything logged during the interval is
      // attributed to 45', not to whatever the first half ran to.
      return { period: 'HALF_TIME', periodStartedAt: null, periodBaseMinute: 45, addedMinutes: 0, eventType: 'HALFTIME', minute: 45 };
    case 'resume':
      return { period: 'SECOND_HALF', periodStartedAt: now, periodBaseMinute: 45, addedMinutes: 0, eventType: null, minute: 45 };
    case 'fulltime':
      return { period: 'FULL_TIME', periodStartedAt: null, periodBaseMinute: 90, addedMinutes: 0, eventType: 'FULLTIME', minute: 90 };
    default:
      return null;
  }
};

/** Which actions make sense from where — a second half cannot start twice. */
const ALLOWED_FROM = {
  start: ['PRE'],
  halftime: ['FIRST_HALF'],
  resume: ['HALF_TIME'],
  fulltime: ['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF'],
};

const canTransition = (from: string, action: string) =>
  (ALLOWED_FROM[action] || []).includes(from || 'PRE');

/**
 * Read the clock at an instant.
 *
 * Returns the minute a reporter would write on a team sheet: capped at the end of
 * regulation for the period, with anything beyond that expressed as stoppage —
 * 45+3 rather than 48. `elapsedSeconds` is there so a UI can show a ticking
 * mm:ss without recomputing the rules.
 */
const readClock = (state: any, now: Date = new Date()) => {
  const period = state?.period || 'PRE';
  const meta = PERIODS[period] || PERIODS.PRE;
  const added = Math.max(0, state?.addedMinutes || 0);

  if (!meta.running || !state?.periodStartedAt) {
    return {
      period,
      running: false,
      minute: meta.base,
      stoppage: 0,
      addedMinutes: added,
      elapsedSeconds: meta.base * 60,
      display: `${meta.base}'`,
    };
  }

  const startedAt = new Date(state.periodStartedAt).getTime();
  const seconds = Math.max(0, Math.floor((now.getTime() - startedAt) / 1000));
  const raw = meta.base + Math.floor(seconds / 60);

  // Past regulation the clock stops climbing and the excess becomes stoppage, so
  // the 47th minute of a first half reads "45+2" the way the broadcast does.
  const minute = Math.min(raw, meta.regulationEnd);
  const uncapped = Math.max(0, raw - meta.regulationEnd);
  const stoppage = Math.min(uncapped, MAX_STOPPAGE);
  // Beyond the cap the period was almost certainly never ended.
  const stalled = uncapped > MAX_STOPPAGE;

  return {
    period,
    running: true,
    minute,
    stoppage,
    stalled,
    addedMinutes: added,
    elapsedSeconds: (state.periodBaseMinute || meta.base) * 60 + seconds,
    display: stoppage > 0 ? `${minute}+${stoppage}'` : `${minute}'`,
  };
};

/**
 * The minute an event logged "now" should carry.
 *
 * Stoppage folds back into a single number because MatchEvent stores minute and
 * extraTime separately — 45+2 is minute 45, extraTime 2.
 */
const eventMinuteAt = (state: any, now: Date = new Date()) => {
  const c = readClock(state, now);
  return { minute: c.minute, extraTime: c.stoppage };
};

/** Whether the period has run past the stoppage the referee signalled. */
const isOverAddedTime = (state: any, now: Date = new Date()) => {
  const c = readClock(state, now);
  return c.running && c.addedMinutes > 0 && c.stoppage > c.addedMinutes;
};

module.exports = { PERIODS, MS_PER_MINUTE, MAX_STOPPAGE, transition, canTransition, readClock, eventMinuteAt, isOverAddedTime };
