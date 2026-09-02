/**
 * How each sport is laid out, and whether it has a playing surface at all.
 *
 * The lineup view was a football pitch — goalkeeper, penalty areas, a "4-3-3"
 * formation string — shown for every sport on the platform. Of the twenty sports
 * here, that is wrong for nineteen and meaningless for nine: a judo bout has no
 * pitch to lay players out on, and neither does a cycling stage or a chess match.
 *
 * Markings are declared as primitives rather than drawn per sport, so one
 * renderer covers every surface and adding a sport is data, not a component.
 * Coordinates are percentages of a 100 x 150 portrait box, which keeps every
 * surface comparable regardless of its real-world dimensions.
 *
 * `slots` place the starters. A number per row reads top to bottom for the team
 * defending the top half; the renderer mirrors it for the other side, the way a
 * broadcast graphic shows both teams facing each other.
 */

export type Marking =
  | { t: 'rect'; x: number; y: number; w: number; h: number; dash?: boolean }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; dash?: boolean }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { t: 'arc'; cx: number; cy: number; r: number; from: number; to: number };

export type Surface = {
  /** What the surface is called, so the UI never has to say "pitch" for a court. */
  label: string;
  /** Starters placed on it. */
  starters: number;
  /** Players per row, from the goal line inward. */
  rows: number[];
  /** Position labels in row order, where the sport has fixed ones. */
  positions?: string[];
  /** True when the two sides face each other across a halfway line. */
  opposed: boolean;
  /**
   * Where the top side's players sit, as [nearest the goal line, nearest the
   * middle]. Taken from each surface's own bounds — a volleyball court is inset
   * from the frame, so a band shared with football would stand its back row on
   * the boundary line.
   */
  band: [number, number];
  markings: Marking[];
  /** Surface colour, so a court does not have to be green. */
  tone: 'grass' | 'wood' | 'clay' | 'blue' | 'mat';
};

/** Football, and the shape most other team sports are wrongly assumed to share. */
const FOOTBALL: Surface = {
  label: 'Pitch', starters: 11, rows: [1, 4, 3, 3], opposed: true, band: [10, 46], tone: 'grass',
  markings: [
    { t: 'rect', x: 2, y: 2, w: 96, h: 146 },
    { t: 'line', x1: 2, y1: 75, x2: 98, y2: 75 },
    { t: 'circle', cx: 50, cy: 75, r: 11 },
    { t: 'circle', cx: 50, cy: 75, r: 0.8, fill: true },
    { t: 'rect', x: 22, y: 2, w: 56, h: 18 },   // penalty area
    { t: 'rect', x: 37, y: 2, w: 26, h: 7 },    // goal area
    { t: 'rect', x: 22, y: 130, w: 56, h: 18 },
    { t: 'rect', x: 37, y: 141, w: 26, h: 7 },
  ],
};

/** Five a side, on wood, with a key and an arc — not a small football pitch. */
const BASKETBALL: Surface = {
  label: 'Court', starters: 5, rows: [2, 2, 1], opposed: true, band: [12, 46], tone: 'wood',
  positions: ['PG', 'SG', 'SF', 'PF', 'C'],
  markings: [
    { t: 'rect', x: 2, y: 2, w: 96, h: 146 },
    { t: 'line', x1: 2, y1: 75, x2: 98, y2: 75 },
    { t: 'circle', cx: 50, cy: 75, r: 11 },
    { t: 'rect', x: 34, y: 2, w: 32, h: 34 },   // the key
    { t: 'arc', cx: 50, cy: 36, r: 11, from: 0, to: 180 },
    { t: 'arc', cx: 50, cy: 14, r: 33, from: 12, to: 168 },  // three-point line
    { t: 'rect', x: 34, y: 114, w: 32, h: 34 },
    { t: 'arc', cx: 50, cy: 114, r: 11, from: 180, to: 360 },
    { t: 'arc', cx: 50, cy: 136, r: 33, from: 192, to: 348 },
  ],
};

/** Six on court in two ranks, split by a net rather than a halfway line. */
const VOLLEYBALL: Surface = {
  label: 'Court', starters: 6, rows: [3, 3], opposed: true, band: [20, 48], tone: 'clay',
  positions: ['4', '3', '2', '5', '6', '1'],
  markings: [
    { t: 'rect', x: 8, y: 12, w: 84, h: 126 },
    { t: 'line', x1: 8, y1: 75, x2: 92, y2: 75 },        // the net
    { t: 'line', x1: 8, y1: 54, x2: 92, y2: 54, dash: true },  // attack lines
    { t: 'line', x1: 8, y1: 96, x2: 92, y2: 96, dash: true },
  ],
};

/** Seven a side, with the six-metre goal area that defines the game. */
const HANDBALL: Surface = {
  label: 'Court', starters: 7, rows: [1, 3, 3], opposed: true, band: [12, 46], tone: 'clay',
  markings: [
    { t: 'rect', x: 4, y: 4, w: 92, h: 142 },
    { t: 'line', x1: 4, y1: 75, x2: 96, y2: 75 },
    { t: 'arc', cx: 50, cy: 4, r: 22, from: 0, to: 180 },
    { t: 'arc', cx: 50, cy: 4, r: 32, from: 0, to: 180 },
    { t: 'arc', cx: 50, cy: 146, r: 22, from: 180, to: 360 },
    { t: 'arc', cx: 50, cy: 146, r: 32, from: 180, to: 360 },
  ],
};

/** Fifteen, arranged by unit — front row, second row, back row, halves, backs. */
const RUGBY: Surface = {
  label: 'Pitch', starters: 15, rows: [3, 2, 3, 2, 3, 2], opposed: true, band: [10, 48], tone: 'grass',
  markings: [
    { t: 'rect', x: 2, y: 2, w: 96, h: 146 },
    { t: 'line', x1: 2, y1: 75, x2: 98, y2: 75 },
    { t: 'line', x1: 2, y1: 14, x2: 98, y2: 14 },        // try lines
    { t: 'line', x1: 2, y1: 136, x2: 98, y2: 136 },
    { t: 'line', x1: 2, y1: 40, x2: 98, y2: 40, dash: true },   // 22m
    { t: 'line', x1: 2, y1: 110, x2: 98, y2: 110, dash: true },
  ],
};

/** Seven, in thirds, with the goal circles only some positions may enter. */
const NETBALL: Surface = {
  label: 'Court', starters: 7, rows: [2, 3, 2], opposed: true, band: [13, 47], tone: 'clay',
  positions: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
  markings: [
    { t: 'rect', x: 4, y: 4, w: 92, h: 142 },
    { t: 'line', x1: 4, y1: 51, x2: 96, y2: 51 },
    { t: 'line', x1: 4, y1: 99, x2: 96, y2: 99 },
    { t: 'circle', cx: 50, cy: 75, r: 8 },
    { t: 'arc', cx: 50, cy: 4, r: 30, from: 0, to: 180 },
    { t: 'arc', cx: 50, cy: 146, r: 30, from: 180, to: 360 },
  ],
};

/** Eleven on an oval, set out from the strip in the middle. */
const CRICKET: Surface = {
  label: 'Field', starters: 11, rows: [4, 3, 4], opposed: false, band: [34, 116], tone: 'grass',
  markings: [
    { t: 'circle', cx: 50, cy: 75, r: 47 },
    { t: 'circle', cx: 50, cy: 75, r: 28, },
    { t: 'rect', x: 45, y: 58, w: 10, h: 34 },   // the pitch
  ],
};

/** Singles or doubles, across a net, with service boxes. */
const TENNIS: Surface = {
  label: 'Court', starters: 2, rows: [1, 1], opposed: true, band: [20, 52], tone: 'blue',
  markings: [
    { t: 'rect', x: 12, y: 8, w: 76, h: 134 },
    { t: 'rect', x: 20, y: 8, w: 60, h: 134 },   // singles sidelines
    { t: 'line', x1: 12, y1: 75, x2: 88, y2: 75 },  // net
    { t: 'line', x1: 20, y1: 46, x2: 80, y2: 46 },  // service lines
    { t: 'line', x1: 20, y1: 104, x2: 80, y2: 104 },
    { t: 'line', x1: 50, y1: 46, x2: 50, y2: 104 },
  ],
};

const BADMINTON: Surface = {
  ...TENNIS, label: 'Court', tone: 'wood',
  markings: [
    { t: 'rect', x: 14, y: 10, w: 72, h: 130 },
    { t: 'rect', x: 22, y: 10, w: 56, h: 130 },
    { t: 'line', x1: 14, y1: 75, x2: 86, y2: 75 },
    { t: 'line', x1: 14, y1: 58, x2: 86, y2: 58 },
    { t: 'line', x1: 14, y1: 92, x2: 86, y2: 92 },
    { t: 'line', x1: 50, y1: 10, x2: 50, y2: 58 },
    { t: 'line', x1: 50, y1: 92, x2: 50, y2: 140 },
  ],
};

const TABLE_TENNIS: Surface = {
  label: 'Table', starters: 2, rows: [1, 1], opposed: true, band: [30, 56], tone: 'blue',
  markings: [
    { t: 'rect', x: 18, y: 20, w: 64, h: 110 },
    { t: 'line', x1: 12, y1: 75, x2: 88, y2: 75 },   // net, overhanging
    { t: 'line', x1: 50, y1: 20, x2: 50, y2: 130 },  // centre line
  ],
};

/**
 * By sport slug. Anything absent has no surface — a bout, a race or a board game
 * is not laid out on a field, and drawing one for it would be a decoration that
 * tells the reader something untrue.
 */
export const SURFACES: Record<string, Surface> = {
  football: FOOTBALL,
  basketball: BASKETBALL,
  volleyball: VOLLEYBALL,
  handball: HANDBALL,
  rugby: RUGBY,
  netball: NETBALL,
  cricket: CRICKET,
  tennis: TENNIS,
  badminton: BADMINTON,
  'table-tennis': TABLE_TENNIS,
};

/**
 * The surface for a sport, or null when it has none.
 *
 * Falls back on the sport's type rather than on football: an unrecognised TEAM
 * sport is more like a pitch than like nothing, but an unrecognised combat sport
 * must not acquire one.
 */
export const surfaceFor = (sport?: { slug?: string; type?: string } | null): Surface | null => {
  if (!sport) return null;
  const bySlug = sport.slug ? SURFACES[sport.slug] : undefined;
  if (bySlug) return bySlug;
  return sport.type === 'TEAM' ? FOOTBALL : null;
};

/** What to show instead, when there is no surface. */
export const NO_SURFACE_REASON: Record<string, string> = {
  COMBAT: 'Bouts are contested between two athletes in a weight class, so there is no team sheet to lay out.',
  RACING: 'Riders and athletes start together rather than taking up positions, so this is a start list.',
  RACKET: 'This tie is played as individual matches rather than from a team sheet.',
};
