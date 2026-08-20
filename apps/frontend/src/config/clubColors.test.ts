import { describe, it, expect } from 'vitest';
import { clubColor, rawClubColor, knownClubColors } from './clubColors';

describe('clubColor', () => {
  it('returns null for unknown clubs (never invents a hue)', () => {
    expect(clubColor({ name: 'Totally Unknown United' })).toBe(null);
    expect(clubColor(null as any)).toBe(null);
  });

  it('resolves a known club by its fuzzy name key', () => {
    // "APR FC" → key strips the "fc" noise word → "apr"
    expect(clubColor({ name: 'APR FC' })).toBeTruthy();
    expect(clubColor({ name: 'Rayon Sports' })).toBeTruthy();
  });

  it('prefers an API-provided primaryColor over the stopgap map', () => {
    // #abcdef is bright enough to survive the visibility clamp unchanged.
    expect(clubColor({ name: 'APR FC', primaryColor: '#abcdef' })).toBe('#abcdef');
  });

  it('lifts a too-dark colour until it is visible on the dark surface', () => {
    // Police FC navy (#12386E) is ~1.2:1 on the dark surface → must be lightened.
    const raw = rawClubColor({ name: 'Police FC' });
    const clamped = clubColor({ name: 'Police FC' });
    expect(raw).toBe('#12386E');
    expect(clamped).not.toBe(raw);
    expect(clamped).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('exposes the known entries with key/color/label for the design-system page', () => {
    const all = knownClubColors();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toHaveProperty('color');
    expect(all[0]).toHaveProperty('label');
  });
});
