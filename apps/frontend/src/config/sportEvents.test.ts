import { describe, it, expect } from 'vitest';
import { actionsForSport, statFieldsForSport, EVENT_LABEL, eventTone } from './sportEvents';

/**
 * The reporter console's vocabulary, pinned against the two contracts it cannot
 * see from here.
 *
 * The dangerous failure in this file is silent: a variant whose `value` is not a
 * real `EventType` is accepted by the UI, sent, and rejected by the server's
 * validator at the moment a reporter taps it during a live match. A `points`
 * that disagrees with `EVENT_POINTS` on the server shows one number in the sheet
 * and puts a different one on the scoreboard. Neither shows up in a typecheck,
 * so both are asserted here against copies of the server's lists — and if those
 * copies drift, that is exactly what these tests are for.
 */

/** Mirrors the EventType enum in apps/backend/prisma/schema.prisma. */
const EVENT_TYPES = [
  'COMMENTARY', 'GOAL', 'OWN_GOAL', 'PENALTY', 'RED_CARD', 'YELLOW_CARD',
  'SUBSTITUTION', 'INJURY', 'VAR', 'KICKOFF', 'HALFTIME', 'FULLTIME', 'EXTRA_TIME',
  'TWO_POINTER', 'THREE_POINTER', 'FREE_THROW', 'DUNK', 'FOUL', 'TIMEOUT',
  'SUSPENSION', 'SEVEN_METRE', 'SET_WON', 'TRY', 'CONVERSION', 'PENALTY_KICK', 'DROP_GOAL',
];

/** Mirrors EVENT_POINTS in apps/backend/src/services/matchEvents.service.ts. */
const SERVER_POINTS: Record<string, number> = {
  GOAL: 1, PENALTY: 1, OWN_GOAL: 1, SEVEN_METRE: 1,
  FREE_THROW: 1, TWO_POINTER: 2, DUNK: 2, THREE_POINTER: 3,
  SET_WON: 1,
  CONVERSION: 2, PENALTY_KICK: 3, DROP_GOAL: 3, TRY: 5,
};

/** Mirrors the columns on MatchStat that `saveStats` accepts. */
const STAT_COLUMNS = [
  'possession', 'shots', 'shotsOnTarget', 'shotsInsideBox', 'shotsOutsideBox',
  'corners', 'offsides', 'fouls', 'yellowCards', 'redCards', 'gkSaves', 'passAccuracy', 'xg',
];

const SPORTS = ['football', 'basketball', 'volleyball', 'handball', 'rugby', 'cricket', undefined];

describe('actionsForSport', () => {
  it('gives every sport a usable set, including one nobody has described', () => {
    for (const slug of SPORTS) {
      const actions = actionsForSport(slug);
      expect(actions.length, `${slug} has no actions`).toBeGreaterThan(0);
      // The dock lays these out in one row on a 360px screen; past five they
      // stop clearing a thumb.
      expect(actions.length, `${slug} has too many actions to dock`).toBeLessThanOrEqual(5);
    }
  });

  it('only ever offers event types the server will accept', () => {
    for (const slug of SPORTS) {
      for (const action of actionsForSport(slug)) {
        for (const v of action.variants || []) {
          expect(EVENT_TYPES, `${slug}/${action.id} offers ${v.value}`).toContain(v.value);
        }
        if (action.eventType) {
          expect(EVENT_TYPES, `${slug}/${action.id} publishes ${action.eventType}`).toContain(action.eventType);
        }
      }
    }
  });

  it('agrees with the server about what a score is worth', () => {
    for (const slug of SPORTS) {
      for (const action of actionsForSport(slug)) {
        if (action.kind !== 'score') continue;
        for (const v of action.variants || []) {
          expect(v.points, `${v.value} has no weight in the sheet`).toBeDefined();
          expect(v.points, `${v.value} disagrees with the server`).toBe(SERVER_POINTS[v.value]);
        }
      }
    }
  });

  it('gives every action a capture path that can actually complete', () => {
    for (const slug of SPORTS) {
      for (const action of actionsForSport(slug)) {
        if (action.kind === 'score' || action.kind === 'discipline') {
          expect(action.variants?.length, `${slug}/${action.id} has nothing to pick`).toBeGreaterThan(0);
        }
        // A team-only action publishes the moment a side is tapped, so it must
        // already know what it is publishing.
        if (action.kind === 'team') expect(action.eventType, `${slug}/${action.id}`).toBeTruthy();
      }
    }
  });

  it('names every event it can produce, so nothing reads as "Update" in the feed', () => {
    for (const slug of SPORTS) {
      for (const action of actionsForSport(slug)) {
        for (const v of action.variants || []) expect(EVENT_LABEL[v.value]).toBeTruthy();
        if (action.eventType) expect(EVENT_LABEL[action.eventType]).toBeTruthy();
      }
    }
  });

  it('speaks each sport in its own words, not football\'s', () => {
    const values = (slug: string) =>
      actionsForSport(slug).flatMap((a) => (a.variants || []).map((v) => v.value));

    expect(values('basketball')).toContain('THREE_POINTER');
    expect(values('basketball')).toContain('FOUL');
    // An own goal and a yellow card do not exist in basketball.
    expect(values('basketball')).not.toContain('OWN_GOAL');
    expect(values('basketball')).not.toContain('YELLOW_CARD');

    expect(values('rugby')).toContain('TRY');
    expect(values('handball')).toContain('SEVEN_METRE');
    expect(values('handball')).toContain('SUSPENSION');

    // Volleyball scores by the set and it belongs to the team, so it publishes
    // straight from the team step with no variants at all.
    const set = actionsForSport('volleyball').find((a) => a.id === 'score');
    expect(set?.kind).toBe('team');
    expect(set?.eventType).toBe('SET_WON');
  });

  it('falls back to a generic set rather than to football', () => {
    const cricket = actionsForSport('cricket').flatMap((a) => (a.variants || []).map((v) => v.value));
    expect(cricket).not.toContain('OWN_GOAL');
    expect(cricket).toContain('GOAL'); // a plain point, labelled as one
    expect(actionsForSport('cricket').find((a) => a.id === 'score')?.variants?.[0].label).toBe('Point');
  });
});

describe('statFieldsForSport', () => {
  it('only asks for columns MatchStat actually has', () => {
    for (const slug of SPORTS) {
      for (const field of statFieldsForSport(slug)) {
        expect(STAT_COLUMNS, `${slug} asks for ${field.key}`).toContain(field.key);
        expect(field.label).toBeTruthy();
      }
    }
  });

  it('does not ask a basketball reporter for corners, offsides or keeper saves', () => {
    const keys = statFieldsForSport('basketball').map((f) => f.key);
    expect(keys).not.toContain('corners');
    expect(keys).not.toContain('offsides');
    expect(keys).not.toContain('gkSaves');
    expect(keys).toContain('fouls');
  });
});

describe('eventTone', () => {
  it('paints every scoring event as a score, whatever the sport', () => {
    for (const type of Object.keys(SERVER_POINTS)) {
      // An own goal moves the score but is not a good thing, so it is the one
      // scoring type that is deliberately not green.
      const expected = type === 'OWN_GOAL' ? 'text-danger-text' : 'text-brand-text';
      expect(eventTone(type).tone, type).toBe(expected);
    }
  });

  it('keeps a basketball foul a caution and never a dismissal', () => {
    expect(eventTone('FOUL').tone).toBe('text-live');
    expect(eventTone('SUSPENSION').tone).toBe('text-live');
    expect(eventTone('RED_CARD').tone).toBe('text-danger-text');
  });
});
