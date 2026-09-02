/**
 * Reading the match clock in the browser.
 *
 * Mirrors apps/backend/src/services/matchClock.logic.ts. The server sends the
 * kick-off timestamp and the minute at the moment it answered; this extrapolates
 * from that so the display ticks every second without a request per second.
 *
 * Shared by the reporter console and the public match page deliberately: a
 * viewer and the reporter must never see different minutes for the same match,
 * and the surest way to guarantee that is one implementation.
 */

export type Clock = {
  period: string;
  running: boolean;
  minute: number;
  stoppage: number;
  addedMinutes: number;
  elapsedSeconds: number;
  display: string;
  /** When this reading arrived, so elapsed time can be extrapolated from it. */
  readAtMs?: number;
};

export const PERIOD_LABEL: Record<string, string> = {
  PRE: 'Not started',
  FIRST_HALF: 'First half',
  HALF_TIME: 'Half time',
  SECOND_HALF: 'Second half',
  FULL_TIME: 'Full time',
};

/** Where each period counts from and where its regulation time ends. */
const BOUNDS: Record<string, { base: number; end: number }> = {
  PRE: { base: 0, end: 0 },
  FIRST_HALF: { base: 0, end: 45 },
  HALF_TIME: { base: 45, end: 45 },
  SECOND_HALF: { base: 45, end: 90 },
  FULL_TIME: { base: 90, end: 90 },
};

/** Mirrors MAX_STOPPAGE on the server — see matchClock.logic.ts for why. */
const MAX_STOPPAGE = 15;

const mmss = (totalSeconds: number) => {
  const s = Math.max(0, totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Stamp a clock as it arrives, so later ticks measure from a known instant rather
 * than trusting the browser's wall clock to agree with the server's.
 */
export const stampClock = (clock: any): Clock | null =>
  (clock ? { ...clock, readAtMs: Date.now() } : null);

/**
 * The clock as it reads `nowMs`.
 *
 * Past regulation the minute stops climbing and the excess becomes stoppage, so a
 * first half in its 47th minute reads "45+2'" the way a broadcast shows it.
 */
export const tickClock = (clock: Clock | null | undefined, nowMs: number) => {
  if (!clock) return { period: 'PRE', running: false, minute: 0, stoppage: 0, addedMinutes: 0, display: "0'", mmss: '00:00' };

  const bounds = BOUNDS[clock.period] || BOUNDS.PRE;

  if (!clock.running) {
    return { ...clock, stoppage: 0, display: `${clock.minute}'`, mmss: mmss(clock.minute * 60) };
  }

  const since = Math.max(0, Math.floor((nowMs - (clock.readAtMs ?? nowMs)) / 1000));
  const elapsed = (clock.elapsedSeconds || 0) + since;

  // elapsedSeconds counts from the start of the match, so subtract the period's
  // base before converting the remainder into minutes played in this period.
  const raw = bounds.base + Math.floor((elapsed - bounds.base * 60) / 60);
  const minute = Math.min(raw, bounds.end);
  const uncapped = Math.max(0, raw - bounds.end);
  const stoppage = Math.min(uncapped, MAX_STOPPAGE);

  return {
    ...clock,
    minute,
    stoppage,
    stalled: uncapped > MAX_STOPPAGE,
    display: stoppage > 0 ? `${minute}+${stoppage}'` : `${minute}'`,
    mmss: mmss(elapsed),
  };
};
