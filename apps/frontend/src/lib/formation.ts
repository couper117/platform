import type { Surface } from '../config/playingSurfaces';

/**
 * The geometry and the role-matching behind a line-up on a surface.
 *
 * EXTRACTED FROM components/match/FormationPitch so two screens can share it.
 * That component draws a line-up somebody else already picked; the club portal's
 * board lets a coach pick one. They must agree about where a slot IS and what it
 * is FOR, or a coach would place a striker on the board and watch it render a
 * row lower on the public match page.
 *
 * Coordinates are percentages of the same 100 x 150 portrait box the surfaces
 * are declared in, so nothing here knows or cares about pixels.
 */

/**
 * Rank a free-form position so players land in sensible places.
 *
 * Deliberately generic: the same ordering serves a goalkeeper, a point guard and
 * a setter, because every one of these sports lists its roster from the back
 * outwards. Anything unrecognised sits in the middle rather than being dropped.
 */
export const roleRank = (pos?: string) => {
  const s = String(pos || '').toLowerCase();
  if (/goal|keeper|\bgk\b|\bgs\b|libero/.test(s)) return 0;
  if (/def|back|\bcb\b|\brb\b|\blb\b|\bwb\b|full|guard|\bpg\b|\bsg\b|\bgd\b/.test(s)) return 1;
  if (/for|strik|attack|wing|\bst\b|\bcf\b|\bfw\b|centre|center|\bc\b|spik/.test(s)) return 3;
  return 2;
};

/** Trim a row layout so it never seats more players than the sport fields. */
export const clampRows = (rows: number[], starters: number) => {
  const out: number[] = [];
  let left = starters;
  for (const n of rows) {
    if (left <= 0) break;
    out.push(Math.min(n, left));
    left -= out[out.length - 1];
  }
  return out.length ? out : rows;
};

/** Formation strings only mean something where the sport uses them. */
export const parseFormation = (formation: string | undefined, fallback: number[]) => {
  const lines = String(formation || '').split(/[^0-9]+/).map((n) => parseInt(n, 10)).filter((n) => n > 0);
  const sum = lines.reduce((a, b) => a + b, 0);
  if (!lines.length || sum < 3 || sum > 20) return fallback;
  return lines;
};

/**
 * The row layout a sport and a chosen shape produce together.
 *
 * A formation string describes the OUTFIELD — "4-3-3" is ten players, not eleven
 * — so where the sport keeps a goal that row is added back, or the goalkeeper is
 * quietly dropped from every sheet that names a shape.
 */
export const rowsFor = (surface: Surface, formation?: string | null) => {
  const keeps = surface.rows[0] === 1;
  if (!surface.formations?.length || !formation) return surface.rows;
  return clampRows(
    keeps
      ? [1, ...parseFormation(formation, surface.rows.slice(1))]
      : parseFormation(formation, surface.rows),
    surface.starters
  );
};

/** (x%, y%) for each starter, from the goal line inward. */
export const buildSlots = (
  rows: number[],
  orientation: 'top' | 'bottom',
  opposed: boolean,
  band: [number, number]
) => {
  // Mirrored for the bottom side, so both teams read as facing each other.
  const near = opposed ? (orientation === 'top' ? band[0] : 150 - band[0]) : band[0];
  const far = opposed ? (orientation === 'top' ? band[1] : 150 - band[1]) : band[1];
  const slots: Array<{ x: number; y: number }> = [];
  rows.forEach((count, r) => {
    const v = rows.length === 1 ? (near + far) / 2 : near + ((far - near) * r) / (rows.length - 1);
    const y = (v / 150) * 100;
    for (let i = 0; i < count; i += 1) slots.push({ x: ((i + 1) * 100) / (count + 1), y });
  });
  return slots;
};

/* ── what each slot is FOR ───────────────────────────────────────────────── */

/**
 * A label per slot, so a coach tapping an empty spot is told what belongs there.
 *
 * TWO SPORTS ANSWER THIS DIFFERENTLY. Basketball, volleyball and netball have
 * FIXED positions — `surface.positions` lists them in row order, and a point
 * guard is a point guard whatever shape you play. Football does not: whether a
 * slot is a defender or a midfielder depends entirely on the formation, which is
 * why the config declares no positions for it and they are derived from the rows.
 *
 * The derivation: the first row of one is the goal, the last row is the attack,
 * the row after the goal is the defence, and everything between is midfield.
 * That is a simplification — a 4-2-3-1 has two distinct midfield bands — but it
 * is a simplification in the same direction as the sport, and it never claims a
 * precision the data does not have.
 */
export const slotRoles = (surface: Surface, formation?: string | null): string[] => {
  const rows = rowsFor(surface, formation);
  const total = rows.reduce((a, b) => a + b, 0);

  // A sport with fixed positions: use them, in row order, as far as they go.
  if (surface.positions?.length) {
    const out: string[] = [];
    for (let i = 0; i < total; i += 1) out.push(surface.positions[i] ?? '');
    return out;
  }

  const keeps = surface.rows[0] === 1;
  const out: string[] = [];
  rows.forEach((count, r) => {
    let role: string;
    if (keeps && r === 0) role = 'GK';
    else if (r === rows.length - 1) role = 'FWD';
    else if (r === (keeps ? 1 : 0)) role = 'DEF';
    else role = 'MID';
    for (let i = 0; i < count; i += 1) out.push(role);
  });
  return out;
};

/**
 * Words that mean the same slot, so a squad listing "Point Guard" is offered for
 * a slot labelled "PG" and one listing "Striker" for a slot labelled "FWD".
 *
 * A club's `player.position` is free text typed by whoever registered them, so
 * this has to be generous. It is only ever used to ORDER and GROUP the picker —
 * never to stop a coach placing whoever they want, because a coach plays people
 * out of position all the time and a tool that argued about it would be wrong.
 */
const ROLE_WORDS: Record<string, RegExp> = {
  GK: /goal|keeper|\bgk\b/,
  DEF: /\bdef|back\b|\bcb\b|\brb\b|\blb\b|\blwb\b|\brwb\b|\bwb\b|full.?back|centre.?back|center.?back/,
  MID: /mid|\bcm\b|\bdm\b|\bcdm\b|\bam\b|\bcam\b|\blm\b|\brm\b|playmaker|anchor/,
  FWD: /forward|strik|\bst\b|\bcf\b|\bfw\b|wing|\blw\b|\brw\b|attack|second.?strik/,
  PG: /\bpg\b|point.?guard/,
  SG: /\bsg\b|shooting.?guard|off.?guard/,
  SF: /\bsf\b|small.?forward/,
  PF: /\bpf\b|power.?forward/,
  C: /\bc\b|\bcentre\b|\bcenter\b|\bpivot\b/,
  GS: /\bgs\b|goal.?shoot/,
  GA: /\bga\b|goal.?attack/,
  WA: /\bwa\b|wing.?attack/,
  WD: /\bwd\b|wing.?def/,
  GD: /\bgd\b|goal.?def/,
};

/**
 * How well a player suits a slot: 2 they play there, 1 the same area of the
 * surface, 0 no reason to think so.
 *
 * A numeric slot label — volleyball's rotation zones 1 to 6 — is a place on the
 * court and not a job, so nothing can be matched against it and everybody scores
 * the same. Saying so is better than inventing an affinity.
 */
export const roleAffinity = (position: string | null | undefined, role: string) => {
  if (!role || /^\d+$/.test(role)) return 0;
  const pos = String(position || '').toLowerCase().trim();
  if (!pos) return 0;

  const exact = ROLE_WORDS[role.toUpperCase()];
  if (exact && exact.test(pos)) return 2;

  // Same third of the surface. Only meaningful for the derived football-family
  // roles; a fixed-position sport has already had its exact answer above.
  const FAMILY: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
  const slotBand = FAMILY[role.toUpperCase()];
  if (slotBand === undefined) return 0;
  return roleRank(pos) === slotBand ? 1 : 0;
};

/** The full label behind a short role code, for a picker's heading. */
export const ROLE_NAME: Record<string, string> = {
  GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward',
  PG: 'Point guard', SG: 'Shooting guard', SF: 'Small forward', PF: 'Power forward', C: 'Centre',
  GS: 'Goal shooter', GA: 'Goal attack', WA: 'Wing attack', WD: 'Wing defence', GD: 'Goal defence',
};

export const roleName = (role: string) => ROLE_NAME[String(role || '').toUpperCase()] || role || 'Player';
