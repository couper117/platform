/**
 * Unit tests for abandoned-match detection — no server, no database.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  assessLiveState,
  ABANDON_AFTER_MINUTES,
  ABANDON_INTERVAL_AFTER_MINUTES,
} = require('../../src/services/staleMatches.logic');

const KICKOFF = new Date(Date.UTC(2026, 8, 1, 15, 0, 0));
const at = (mins: number) => new Date(KICKOFF.getTime() + mins * 60_000);
const running = (over = {}) => ({
  period: 'SECOND_HALF', periodStartedAt: KICKOFF, periodBaseMinute: 45, addedMinutes: 0, ...over,
});

test('a match in normal play is not stale', () => {
  assert.equal(assessLiveState(running(), at(20)).stale, false);   // 65'
  assert.equal(assessLiveState(running(), at(44)).stale, false);   // 89'
});

test('normal stoppage is not abandonment', () => {
  // 90+5 — a completely ordinary end to a half.
  assert.equal(assessLiveState(running(), at(50)).stale, false);
});

test('a match left running well past the end is closed', () => {
  const r = assessLiveState(running(), at(45 + ABANDON_AFTER_MINUTES + 5));
  assert.equal(r.stale, true);
  assert.match(r.reason, /past the end of second half/);
  assert.ok(r.minutesOver > ABANDON_AFTER_MINUTES);
});

test('a match left running for days is closed', () => {
  // The case this exists for: live over a long weekend, reading 90+15'.
  const r = assessLiveState(running(), at(60 * 24 * 4));
  assert.equal(r.stale, true);
});

test("the referee's added time is honoured before the grace period", () => {
  // 12 minutes signalled: at 90+35 the plain threshold would have fired, but
  // the allowance is 30 + 12, so it has not.
  const withStoppage = running({ addedMinutes: 12 });
  assert.equal(assessLiveState(withStoppage, at(45 + 35)).stale, false);
  assert.equal(assessLiveState(withStoppage, at(45 + 43)).stale, true);
});

test('the boundary is exclusive — exactly at the limit is still live', () => {
  assert.equal(assessLiveState(running(), at(45 + ABANDON_AFTER_MINUTES)).stale, false);
  assert.equal(assessLiveState(running(), at(45 + ABANDON_AFTER_MINUTES + 1)).stale, true);
});

test('a first half is judged against its own end, not the match end', () => {
  const firstHalf = { period: 'FIRST_HALF', periodStartedAt: KICKOFF, periodBaseMinute: 0, addedMinutes: 0 };
  assert.equal(assessLiveState(firstHalf, at(50)).stale, false);          // 45+5
  assert.equal(assessLiveState(firstHalf, at(45 + 31)).stale, true);
});

test('a match abandoned at half time is closed after a long enough interval', () => {
  const interval = { period: 'HALF_TIME', periodStartedAt: null, updatedAt: KICKOFF };
  assert.equal(assessLiveState(interval, at(20)).stale, false);
  assert.equal(assessLiveState(interval, at(ABANDON_INTERVAL_AFTER_MINUTES + 1)).stale, true);
  assert.match(assessLiveState(interval, at(ABANDON_INTERVAL_AFTER_MINUTES + 1)).reason, /half time/);
});

test('a match that has not kicked off is never stale', () => {
  // Otherwise every scheduled fixture with a live-state row would be "abandoned".
  assert.equal(assessLiveState({ period: 'PRE' }, at(60 * 24 * 30)).stale, false);
});

test('a finished match is not treated as abandoned', () => {
  // FULL_TIME means the reporter did press the button; marking it COMPLETED is
  // a separate step and not this rule's business.
  assert.equal(assessLiveState({ period: 'FULL_TIME', periodStartedAt: null }, at(9999)).stale, false);
});

test('a running period with no start time is left alone', () => {
  assert.equal(assessLiveState({ period: 'SECOND_HALF', periodStartedAt: null }, at(9999)).stale, false);
});

test('no state at all is handled without throwing', () => {
  assert.equal(assessLiveState(null, at(10)).stale, false);
  assert.equal(assessLiveState(undefined, at(10)).stale, false);
});
