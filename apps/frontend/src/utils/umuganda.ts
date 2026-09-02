/**
 * Umuganda helpers for the client.
 *
 * Mirrors apps/backend/src/services/umuganda.logic.ts. The server stays the
 * authority — the calendar renders whatever /umuganda returns — but the same
 * maths lives here so the UI can label a day before a request lands, and so the
 * month grid can be laid out without a round trip.
 *
 * Rwanda is UTC+2 all year (Africa/Kigali, no DST), so an instant is shifted
 * into Kigali local time before its calendar day is taken. Without that, a match
 * kicking off after 22:00 UTC lands on the wrong day.
 */

export const KIGALI_UTC_OFFSET_MINUTES = 120;

/** 'YYYY-MM-DD' for the Kigali calendar day an instant falls on. */
export const kigaliDayKey = (instant: Date | string | number | null | undefined): string => {
  if (!instant) return '';
  const d = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + KIGALI_UTC_OFFSET_MINUTES * 60000).toISOString().slice(0, 10);
};

/** 'YYYY-MM-DD' for a date-only value — no Kigali shift, or it rolls forward. */
export const dayKey = (dateOnly: Date | string | null | undefined): string => {
  if (!dateOnly) return '';
  const d = dateOnly instanceof Date ? dateOnly : new Date(dateOnly);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

/** The last Saturday of a month, as UTC midnight. `month` is 1-12. */
export const lastSaturdayOf = (year: number, month: number): Date => {
  const d = new Date(Date.UTC(year, month, 0));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() - 6 + 7) % 7));
  return d;
};

/**
 * The cells of a month grid, Monday-first, padded to whole weeks.
 * Each cell carries its own key so callers can bucket events onto it.
 */
export type CalendarCell = {
  date: Date;
  key: string;
  inMonth: boolean;
};

export const buildMonthGrid = (year: number, month: number): CalendarCell[] => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay is Sunday-first; shift so Monday is column 0.
  const lead = (first.getUTCDay() + 6) % 7;
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - lead);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    cells.push({
      date: d,
      key: dayKey(d),
      inMonth: d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year,
    });
    // Stop at a whole week once the month is behind us — avoids a trailing
    // all-greyed row that adds height and says nothing.
    if (i >= 27 && (i + 1) % 7 === 0) {
      const nextDay = new Date(start);
      nextDay.setUTCDate(start.getUTCDate() + i + 1);
      if (nextDay.getUTCMonth() !== month - 1 || nextDay.getUTCFullYear() !== year) break;
    }
  }
  return cells;
};

/** Statuses that mean Umuganda has touched this event. */
export const UMUGANDA_TOUCHED = ['UMUGANDA_CONFLICT', 'RESCHEDULED'];

export const isUmugandaTouched = (status?: string | null) =>
  !!status && UMUGANDA_TOUCHED.includes(String(status).toUpperCase());

/** The four rulings an administrator may record. Never includes a cancel. */
export const UMUGANDA_DECISIONS = ['CONTINUE', 'MOVED', 'AFTER_UMUGANDA', 'AFFECTED'] as const;
export type UmugandaDecision = (typeof UMUGANDA_DECISIONS)[number];

/** Decisions that require the admin to supply a new date/time. */
export const DECISION_NEEDS_DATE: string[] = ['MOVED', 'AFTER_UMUGANDA'];

/** An Umuganda day that is not DISABLED still counts. */
export const isActiveUmuganda = (day?: { status?: string } | null) =>
  !!day && String(day.status).toUpperCase() !== 'DISABLED';

/**
 * Group events by their Kigali day key, so a month grid can look up a cell in
 * O(1) instead of filtering the whole list per cell.
 */
export const bucketByDay = <T extends { matchDate?: any; dayKey?: string }>(events: T[]) => {
  const map = new Map<string, T[]>();
  for (const e of events || []) {
    const key = e.dayKey || kigaliDayKey(e.matchDate);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(e);
    else map.set(key, [e]);
  }
  return map;
};
