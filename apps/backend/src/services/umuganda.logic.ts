/**
 * Pure Umuganda date maths — no database, no IO.
 *
 * Umuganda is held on the LAST SATURDAY of each month. That is an expectation,
 * not a decree: the authorities occasionally move it, so everything here
 * produces a *candidate* date that an administrator can later confirm, move or
 * disable (see umuganda.service).
 *
 * Timezone: Rwanda is UTC+2 all year (Africa/Kigali, no DST). Comparing a
 * fixture's instant against a calendar day in plain UTC would misfile any match
 * kicking off after 22:00 UTC — 00:00-02:00 the next morning in Kigali. So every
 * instant is shifted into Kigali local time before its calendar day is taken.
 *
 * Unit tested in test/unit/umuganda.test.ts.
 */

const KIGALI_UTC_OFFSET_MINUTES = 120;

/** 'YYYY-MM-DD' for the Kigali calendar day an instant falls on. */
const kigaliDayKey = (instant: Date | string | number): string => {
  const d = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + KIGALI_UTC_OFFSET_MINUTES * 60000)
    .toISOString()
    .slice(0, 10);
};

/**
 * 'YYYY-MM-DD' for a date-only column. Prisma hands back @db.Date as UTC
 * midnight, so this must NOT apply the Kigali shift or it would roll forward.
 */
const dayKey = (dateOnly: Date | string): string => {
  const d = dateOnly instanceof Date ? dateOnly : new Date(dateOnly);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

/**
 * The last Saturday of a month, as UTC midnight.
 * @param month 1-12 (calendar month, not JS 0-based)
 */
const lastSaturdayOf = (year: number, month: number): Date => {
  // Day 0 of the following month == the last day of this one.
  const d = new Date(Date.UTC(year, month, 0));
  const daysBackToSaturday = (d.getUTCDay() - 6 + 7) % 7;
  d.setUTCDate(d.getUTCDate() - daysBackToSaturday);
  return d;
};

/** `count` consecutive {year, month} pairs starting at the month of `from`. */
const monthsFrom = (from: Date, count: number): Array<{ year: number; month: number }> => {
  const out: Array<{ year: number; month: number }> = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth() + 1;
  for (let i = 0; i < count; i += 1) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
};

/** Does this instant land on the given Umuganda day, in Kigali local time? */
const fallsOnUmuganda = (matchDate: Date | string | null | undefined, umugandaDate: Date | string): boolean => {
  if (!matchDate) return false;
  const a = kigaliDayKey(matchDate);
  return a !== '' && a === dayKey(umugandaDate);
};

/**
 * "08:00" -> minutes past midnight. Returns null for anything unparseable so
 * callers can fall back rather than silently treating it as 00:00.
 */
const minutesOfDay = (hhmm: string | null | undefined): number | null => {
  if (typeof hhmm !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

/**
 * Is a kickoff inside the community-work window? Used to tell a genuine clash
 * ("2pm match on Umuganda morning" is fine, an 09:00 one is not) from a match
 * that merely shares the date. Both are surfaced to the admin; only the window
 * overlap is called a hard clash.
 */
const clashesWithWindow = (
  matchDate: Date | string | null | undefined,
  startTime: string,
  endTime: string,
): boolean => {
  if (!matchDate) return false;
  const d = matchDate instanceof Date ? matchDate : new Date(matchDate);
  if (Number.isNaN(d.getTime())) return false;
  const shifted = new Date(d.getTime() + KIGALI_UTC_OFFSET_MINUTES * 60000);
  const kickoff = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const start = minutesOfDay(startTime);
  const end = minutesOfDay(endTime);
  if (start === null || end === null || end <= start) return false;
  return kickoff >= start && kickoff < end;
};

module.exports = {
  KIGALI_UTC_OFFSET_MINUTES,
  kigaliDayKey,
  dayKey,
  lastSaturdayOf,
  monthsFrom,
  fallsOnUmuganda,
  minutesOfDay,
  clashesWithWindow,
};
