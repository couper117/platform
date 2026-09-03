/**
 * What a season looks like, per sport.
 *
 * ONE LIST, TWO JOBS. The public profile reads it to decide which numbers to show
 * and in what order; the admin editor reads it to decide which fields to offer.
 * They were going to be two copies of the same table in two apps, and two copies
 * of a table like this do not stay in step — a stat added for volleyball would
 * have appeared on the profile and been un-enterable in the admin.
 *
 * It is also the ALLOWLIST. Anything sent to the stats endpoint that is not named
 * here is rejected, so the JSON column cannot quietly accumulate typos
 * ("assits") that then never render.
 *
 * `decimal` marks a per-game average, which is written to one place. Everything
 * else is a whole number. The first three entries are the headline tiles.
 */

export type StatSpec = { key: string; label: string; decimal?: boolean };

const SPEC: Record<number, StatSpec[]> = {
  // Football — the three that lead are the three a fan quotes.
  1: [
    { key: 'goals', label: 'goals' },
    { key: 'assists', label: 'assists' },
    { key: 'appearances', label: 'appearances' },
    { key: 'minutes', label: 'minutes' },
    { key: 'cleanSheets', label: 'clean_sheets' },
    { key: 'conceded', label: 'conceded' },
    { key: 'yellowCards', label: 'yellow_cards' },
    { key: 'redCards', label: 'red_cards' },
  ],
  // Basketball is read per game, so these are averages to one decimal.
  2: [
    { key: 'points', label: 'ppg', decimal: true },
    { key: 'rebounds', label: 'rpg', decimal: true },
    { key: 'assists', label: 'apg', decimal: true },
    { key: 'games', label: 'games' },
    { key: 'steals', label: 'spg', decimal: true },
    { key: 'blocks', label: 'bpg', decimal: true },
    { key: 'minutes', label: 'mpg', decimal: true },
  ],
  3: [
    { key: 'points', label: 'points' },
    { key: 'kills', label: 'kills' },
    { key: 'blocks', label: 'blocks' },
    { key: 'matches', label: 'matches' },
    { key: 'aces', label: 'aces' },
    { key: 'digs', label: 'digs' },
  ],
  4: [
    { key: 'stageWins', label: 'stage_wins' },
    { key: 'podiums', label: 'podiums' },
    { key: 'points', label: 'points' },
    { key: 'races', label: 'races' },
    { key: 'komPoints', label: 'kom_points' },
  ],
  5: [
    { key: 'seasonBest', label: 'season_best' },
    { key: 'wins', label: 'wins' },
    { key: 'podiums', label: 'podiums' },
    { key: 'meets', label: 'meets' },
    { key: 'nationalRank', label: 'national_rank' },
  ],
  6: [
    { key: 'goals', label: 'goals' },
    { key: 'assists', label: 'assists' },
    { key: 'matches', label: 'matches' },
    { key: 'saves', label: 'saves' },
    { key: 'suspensions', label: 'suspensions' },
  ],
};

/** A sport nobody has written a sheet for still gets something sensible. */
const FALLBACK: StatSpec[] = [
  { key: 'appearances', label: 'appearances' },
  { key: 'wins', label: 'wins' },
  { key: 'podiums', label: 'podiums' },
];

export const specFor = (sportId?: number | null): StatSpec[] => SPEC[Number(sportId)] ?? FALLBACK;

/** Every key any sport can store — the allowlist the write endpoint validates on. */
export const ALL_STAT_KEYS: string[] = [
  ...new Set([...Object.values(SPEC).flat(), ...FALLBACK].map((s) => s.key)),
];

/**
 * Keep only the recognised keys, coerced to finite numbers, dropping blanks.
 *
 * A field cleared in the admin form arrives as '' and must DELETE the stat, not
 * store a zero — a zero is a claim ("he scored none"), an absent key is the
 * absence of a claim, and the profile renders those differently.
 */
export const sanitiseStats = (input: any): Record<string, number> => {
  const out: Record<string, number> = {};
  if (!input || typeof input !== 'object') return out;
  for (const key of ALL_STAT_KEYS) {
    const raw = input[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const n = Number(raw);
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
};

module.exports = { specFor, ALL_STAT_KEYS, sanitiseStats };
