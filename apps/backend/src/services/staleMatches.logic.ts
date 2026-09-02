/**
 * Deciding when a live match has been abandoned rather than played.
 *
 * Pure rules — no database, no clock of its own — so the judgement can be
 * unit-tested at any instant (test/unit/staleMatches.test.ts). Same split as
 * matchClock.logic.ts, whose reading this builds on.
 *
 * A reporter who forgets to press full time leaves the match live forever. It
 * keeps its place on the live-scores channel, the public page shows a clock
 * pinned at "90+15'", and the fixture never becomes a result. The clock already
 * detects this — readClock() returns `stalled` once a period has run more than
 * MAX_STOPPAGE past regulation — but nothing ever acted on it.
 */

const { readClock, PERIODS } = require('./matchClock.logic');

/**
 * How long past the end of a period before it is treated as abandoned.
 *
 * The clock's own MAX_STOPPAGE (15) is about display: it stops the minute
 * climbing absurdly. Ending someone's match is a heavier action than clamping a
 * number, so it waits considerably longer. Thirty minutes past the end of
 * regulation is far beyond any real stoppage, extra time or VAR delay, while
 * still closing the match the same evening rather than days later.
 */
const ABANDON_AFTER_MINUTES = 30;

/**
 * A match sitting at half time is not running, so the clock cannot tell how long
 * it has been there. An interval this long means nobody came back.
 */
const ABANDON_INTERVAL_AFTER_MINUTES = 120;

const MS_PER_MINUTE = 60_000;

/**
 * Whether this live state should be closed, and why.
 *
 * Returns `{ stale: false }` or `{ stale: true, reason, minutesOver }`. The
 * reason is carried through to the activity log, because "the system ended your
 * match" is only acceptable if it can say what it concluded and when.
 */
const assessLiveState = (state: any, now: Date = new Date()) => {
  if (!state) return { stale: false };

  const period = state.period || 'PRE';
  const meta = PERIODS[period] || PERIODS.PRE;

  // Nothing has started, or it is already over — either way there is nothing to
  // close. FULL_TIME is a finished match that simply has not been marked
  // COMPLETED; that is the caller's business, not an abandonment.
  if (period === 'PRE' || period === 'FULL_TIME') return { stale: false };

  if (!meta.running) {
    // An interval. The clock is stopped, so measure from when it stopped.
    const since = state.updatedAt ? new Date(state.updatedAt).getTime() : null;
    if (since == null) return { stale: false };
    const minutesIdle = Math.floor((now.getTime() - since) / MS_PER_MINUTE);
    if (minutesIdle >= ABANDON_INTERVAL_AFTER_MINUTES) {
      return { stale: true, reason: `left at ${period.toLowerCase().replace('_', ' ')} for ${minutesIdle} minutes`, minutesOver: minutesIdle };
    }
    return { stale: false };
  }

  if (!state.periodStartedAt) return { stale: false };

  const clock = readClock(state, now);
  const played = Math.floor(
    (now.getTime() - new Date(state.periodStartedAt).getTime()) / MS_PER_MINUTE,
  ) + meta.base;
  const minutesOver = played - meta.regulationEnd;

  // The referee's own added time is honoured before the grace period starts, so
  // a signalled twelve minutes of stoppage is never cut short.
  const allowed = ABANDON_AFTER_MINUTES + Math.max(0, clock.addedMinutes || 0);
  if (minutesOver > allowed) {
    return {
      stale: true,
      reason: `ran ${minutesOver} minutes past the end of ${period.toLowerCase().replace('_', ' ')}`,
      minutesOver,
    };
  }
  return { stale: false };
};

module.exports = {
  ABANDON_AFTER_MINUTES,
  ABANDON_INTERVAL_AFTER_MINUTES,
  assessLiveState,
};
