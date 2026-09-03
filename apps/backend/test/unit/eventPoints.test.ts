const test = require('node:test');
const assert = require('node:assert');
const { EVENT_POINTS, GOAL_TYPES } = require('../../src/services/matchEvents.service');

/**
 * What a score is worth, per sport.
 *
 * The score used to be a COUNT of scoring events, which is correct only where
 * every score is worth one. A basketball game finishing 58-61 came out 24-27,
 * because the arithmetic counted baskets rather than points. These tests pin the
 * weights and, more importantly, pin the invariant that makes the bug
 * impossible to reintroduce: the list of scoring event types is derived from the
 * weights, so a type can never be scoring-but-weightless or weighted-but-ignored.
 *
 * `recomputeScore` itself is not tested here — it is a database round trip, and
 * this suite is the pure-logic one. The arithmetic it performs is the table below.
 */

test('every scoring type carries a positive whole-number weight', () => {
  for (const [type, points] of Object.entries(EVENT_POINTS)) {
    assert.ok(Number.isInteger(points), `${type} must be a whole number of points`);
    assert.ok((points as number) > 0, `${type} must be worth something`);
  }
});

test('GOAL_TYPES is derived from the weights, never listed twice', () => {
  assert.deepStrictEqual(
    [...GOAL_TYPES].sort(),
    Object.keys(EVENT_POINTS).sort(),
    'a scoring type that is not weighted would silently score nothing',
  );
});

test('football and handball score in ones', () => {
  assert.strictEqual(EVENT_POINTS.GOAL, 1);
  assert.strictEqual(EVENT_POINTS.PENALTY, 1);
  assert.strictEqual(EVENT_POINTS.OWN_GOAL, 1);
  assert.strictEqual(EVENT_POINTS.SEVEN_METRE, 1);
});

test('basketball has three values, and a dunk is a two-pointer', () => {
  assert.strictEqual(EVENT_POINTS.FREE_THROW, 1);
  assert.strictEqual(EVENT_POINTS.TWO_POINTER, 2);
  assert.strictEqual(EVENT_POINTS.THREE_POINTER, 3);
  // A dunk is kept apart for the feed, not because it is worth more.
  assert.strictEqual(EVENT_POINTS.DUNK, EVENT_POINTS.TWO_POINTER);
});

test('rugby: try 5, conversion 2, penalty and drop goal 3', () => {
  assert.strictEqual(EVENT_POINTS.TRY, 5);
  assert.strictEqual(EVENT_POINTS.CONVERSION, 2);
  assert.strictEqual(EVENT_POINTS.PENALTY_KICK, 3);
  assert.strictEqual(EVENT_POINTS.DROP_GOAL, 3);
});

test('volleyball scores by the set, and a rally point is not a scoring event', () => {
  // Fixtures store sets won in homeScore/awayScore, so the set is the unit.
  assert.strictEqual(EVENT_POINTS.SET_WON, 1);
  assert.ok(!('POINT' in EVENT_POINTS), 'a rally point would be neither the set score nor the point score');
});

test('nothing disciplinary or procedural touches the score', () => {
  for (const type of ['YELLOW_CARD', 'RED_CARD', 'FOUL', 'SUSPENSION', 'TIMEOUT',
    'SUBSTITUTION', 'INJURY', 'VAR', 'COMMENTARY', 'KICKOFF', 'HALFTIME', 'FULLTIME', 'EXTRA_TIME']) {
    assert.ok(!GOAL_TYPES.includes(type), `${type} must not move the score`);
  }
});

test('a basketball scoreline adds up the way the game does', () => {
  // 58-61 from real events, not from counting them.
  const home = [
    ...Array(17).fill('TWO_POINTER'),
    ...Array(6).fill('THREE_POINTER'),
    ...Array(6).fill('FREE_THROW'),
  ];
  const away = [
    ...Array(14).fill('TWO_POINTER'),
    ...Array(2).fill('DUNK'),
    ...Array(7).fill('THREE_POINTER'),
    ...Array(8).fill('FREE_THROW'),
  ];
  const sum = (events: string[]) => events.reduce((total, e) => total + EVENT_POINTS[e], 0);
  assert.strictEqual(sum(home), 58);
  assert.strictEqual(sum(away), 61);
  // The old count-the-events arithmetic, for contrast.
  assert.strictEqual(home.length, 29);
  assert.strictEqual(away.length, 31);
});
