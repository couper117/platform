import { describe, it, expect } from 'vitest';
import { rowsFor, slotRoles, roleAffinity, buildSlots, parseFormation, clampRows } from './formation';
import { surfaceFor } from '../config/playingSurfaces';

/**
 * The formation board's arithmetic and its sense of what a slot is FOR.
 *
 * Every failure here is silent on screen. A shape that adds up wrong puts ten
 * players on a pitch and drops the eleventh with no error; a slot labelled from
 * the wrong row asks a coach to put a striker in defence; and an affinity that
 * matches nothing turns "tap the point guard spot and see your point guards"
 * back into an unsorted squad list, which is the whole feature.
 */

const football = surfaceFor({ slug: 'football' })!;
const basketball = surfaceFor({ slug: 'basketball' })!;
const volleyball = surfaceFor({ slug: 'volleyball' })!;

describe('shape', () => {
  it('adds the goalkeeper back onto a formation string', () => {
    // "4-3-3" is ten outfield players. Read literally it would field ten and
    // silently drop the keeper from every sheet that names a shape.
    expect(rowsFor(football, '4-3-3')).toEqual([1, 4, 3, 3]);
    expect(rowsFor(football, '4-4-2')).toEqual([1, 4, 4, 2]);
    expect(rowsFor(football, '4-2-3-1')).toEqual([1, 4, 2, 3, 1]);
  });

  it('never seats more players than the sport fields', () => {
    const rows = rowsFor(football, '5-5-5');
    expect(rows.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(football.starters);
  });

  it('ignores a formation string for a sport that has none', () => {
    // A basketball sheet carrying "4-3-3" once laid eleven players on a court
    // that holds five — a football line-up wearing a basketball court.
    expect(rowsFor(basketball, '4-3-3')).toEqual(basketball.rows);
    expect(rowsFor(basketball, '4-3-3').reduce((a, b) => a + b, 0)).toBe(basketball.starters);
  });

  it('falls back when a string is nonsense', () => {
    expect(parseFormation('', [4, 4, 2])).toEqual([4, 4, 2]);
    expect(parseFormation('abc', [4, 4, 2])).toEqual([4, 4, 2]);
    expect(parseFormation('1-1', [4, 4, 2])).toEqual([4, 4, 2]); // sums to 2, too few
    expect(clampRows([9, 9, 9], 5)).toEqual([5]);
  });
});

describe('slot roles', () => {
  it('derives football roles from the shape, because football has no fixed ones', () => {
    expect(slotRoles(football, '4-3-3')).toEqual([
      'GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD',
    ]);
    // A different shape means different slots — which is exactly why these
    // cannot be a fixed list the way basketball's are.
    expect(slotRoles(football, '4-4-2')).toEqual([
      'GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD',
    ]);
  });

  it('uses the fixed positions where the sport has them', () => {
    expect(slotRoles(basketball, null)).toEqual(['PG', 'SG', 'SF', 'PF', 'C']);
  });

  it('produces exactly one role per starter', () => {
    for (const [surface, shape] of [[football, '3-5-2'], [basketball, null], [volleyball, null]] as const) {
      const rows = rowsFor(surface, shape);
      expect(slotRoles(surface, shape)).toHaveLength(rows.reduce((a, b) => a + b, 0));
    }
  });
});

describe('roleAffinity', () => {
  it('puts the point guards at the top of the point guard spot', () => {
    expect(roleAffinity('PG', 'PG')).toBe(2);
    expect(roleAffinity('Point Guard', 'PG')).toBe(2);
    expect(roleAffinity('Centre', 'C')).toBe(2);
    expect(roleAffinity('Shooting Guard', 'PG')).toBeLessThan(2);
  });

  it('puts the strikers at the top of a forward spot', () => {
    expect(roleAffinity('Striker', 'FWD')).toBe(2);
    expect(roleAffinity('ST', 'FWD')).toBe(2);
    expect(roleAffinity('Left Winger', 'FWD')).toBe(2);
    expect(roleAffinity('Centre Back', 'DEF')).toBe(2);
    expect(roleAffinity('Goalkeeper', 'GK')).toBe(2);
  });

  it('still offers the same area of the surface below an exact match', () => {
    // A right back is not a centre back, but they belong in the defence — worth
    // ranking above a striker for a defensive slot, and below an actual one.
    expect(roleAffinity('Right Back', 'DEF')).toBeGreaterThan(0);
    expect(roleAffinity('Striker', 'DEF')).toBe(0);
    expect(roleAffinity('Goalkeeper', 'FWD')).toBe(0);
  });

  it('claims nothing it cannot know', () => {
    expect(roleAffinity('', 'FWD')).toBe(0);
    expect(roleAffinity(null, 'FWD')).toBe(0);
    expect(roleAffinity('Striker', '')).toBe(0);
    // Volleyball's slots are rotation ZONES, not jobs. Nothing can be matched
    // against "4", so everybody scores the same rather than being ranked by an
    // affinity that does not exist.
    expect(roleAffinity('Setter', '4')).toBe(0);
    expect(roleAffinity('Outside Hitter', '2')).toBe(0);
  });
});

describe('buildSlots', () => {
  it('gives every player a spot inside the surface', () => {
    const slots = buildSlots(rowsFor(football, '4-3-3'), 'top', false, [10, 140]);
    expect(slots).toHaveLength(11);
    slots.forEach((s) => {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(100);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(100);
    });
  });

  it('spreads a row evenly and keeps the rows in order', () => {
    const [a, b, c] = buildSlots([3], 'top', false, [10, 140]);
    expect([a.x, b.x, c.x]).toEqual([25, 50, 75]);
    // The keeper's row sits nearer the goal line than the forwards'.
    const full = buildSlots([1, 4, 3, 3], 'top', false, [10, 140]);
    expect(full[0].y).toBeLessThan(full[full.length - 1].y);
  });

  it('mirrors the other side so two teams face each other', () => {
    const top = buildSlots([1, 4, 3, 3], 'top', true, [10, 70]);
    const bottom = buildSlots([1, 4, 3, 3], 'bottom', true, [10, 70]);
    expect(top[0].y).toBeLessThan(50);
    expect(bottom[0].y).toBeGreaterThan(50);
  });
});
