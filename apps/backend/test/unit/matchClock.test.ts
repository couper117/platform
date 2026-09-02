/**
 * Unit tests for the match clock — no server, no database.
 * Run via `npm run test:unit` (node:test through tsx).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transition, canTransition, readClock, eventMinuteAt, isOverAddedTime } = require('../../src/services/matchClock.logic');

const KICKOFF = new Date(Date.UTC(2026, 7, 28, 15, 0, 0));
const later = (mins: number, secs = 0) => new Date(KICKOFF.getTime() + mins * 60_000 + secs * 1000);
const firstHalf = (over = {}) => ({ period: 'FIRST_HALF', periodStartedAt: KICKOFF, periodBaseMinute: 0, addedMinutes: 0, ...over });

test('before kick-off the clock is stopped at 0', () => {
  const c = readClock({ period: 'PRE' }, KICKOFF);
  assert.equal(c.running, false);
  assert.equal(c.minute, 0);
  assert.equal(c.display, "0'");
});

test('the clock counts up from the moment start was pressed', () => {
  assert.equal(readClock(firstHalf(), later(0)).minute, 0);
  assert.equal(readClock(firstHalf(), later(1)).minute, 1);
  assert.equal(readClock(firstHalf(), later(23)).minute, 23);
});

test('seconds within a minute do not advance it', () => {
  // 12:59 is still the 12th minute; only a completed minute counts.
  assert.equal(readClock(firstHalf(), later(12, 59)).minute, 12);
  assert.equal(readClock(firstHalf(), later(13, 0)).minute, 13);
});

test('a first half stops climbing at 45 and reports the rest as stoppage', () => {
  const c = readClock(firstHalf(), later(47));
  assert.equal(c.minute, 45);
  assert.equal(c.stoppage, 2);
  assert.equal(c.display, "45+2'");
});

test("the referee's added minutes are carried, and do not stop the clock", () => {
  const c = readClock(firstHalf({ addedMinutes: 3 }), later(46));
  assert.equal(c.addedMinutes, 3);
  assert.equal(c.display, "45+1'");
  assert.equal(c.running, true);
});

test('running past the signalled stoppage is detectable', () => {
  assert.equal(isOverAddedTime(firstHalf({ addedMinutes: 3 }), later(47)), false); // 45+2 of 3
  assert.equal(isOverAddedTime(firstHalf({ addedMinutes: 3 }), later(49)), true);  // 45+4 of 3
});

test('half time stops the clock at 45', () => {
  const c = readClock({ period: 'HALF_TIME', periodStartedAt: null, periodBaseMinute: 45 }, later(60));
  assert.equal(c.running, false);
  assert.equal(c.minute, 45);
});

test('the second half resumes at 45 rather than restarting', () => {
  const secondHalf = { period: 'SECOND_HALF', periodStartedAt: KICKOFF, periodBaseMinute: 45, addedMinutes: 0 };
  assert.equal(readClock(secondHalf, later(0)).minute, 45);
  assert.equal(readClock(secondHalf, later(10)).minute, 55);
  assert.equal(readClock(secondHalf, later(46)).display, "90+1'");
});

test('full time stops the clock at 90', () => {
  const c = readClock({ period: 'FULL_TIME', periodStartedAt: null }, later(200));
  assert.equal(c.running, false);
  assert.equal(c.minute, 90);
});

test('a clock with no start time never runs, whatever the period says', () => {
  // Guards against a period written without its timestamp.
  const c = readClock({ period: 'FIRST_HALF', periodStartedAt: null }, later(30));
  assert.equal(c.running, false);
  assert.equal(c.minute, 0);
});

test('an event takes the clock, splitting stoppage into extraTime', () => {
  assert.deepEqual(eventMinuteAt(firstHalf(), later(23)), { minute: 23, extraTime: 0 });
  assert.deepEqual(eventMinuteAt(firstHalf(), later(47)), { minute: 45, extraTime: 2 });
});

// ── transitions ──

test('transitions move the period and set or clear the start time', () => {
  assert.equal(transition('start', KICKOFF).period, 'FIRST_HALF');
  assert.equal(transition('start', KICKOFF).periodStartedAt, KICKOFF);
  assert.equal(transition('halftime', KICKOFF).periodStartedAt, null);
  assert.equal(transition('halftime', KICKOFF).periodBaseMinute, 45);
  assert.equal(transition('resume', KICKOFF).period, 'SECOND_HALF');
  assert.equal(transition('resume', KICKOFF).periodStartedAt, KICKOFF);
  assert.equal(transition('fulltime', KICKOFF).periodStartedAt, null);
});

test('starting a period logs the matching event, resuming does not', () => {
  // KICKOFF, HALFTIME and FULLTIME are real match events; the restart after the
  // interval is not one, so it must not appear in the feed.
  assert.equal(transition('start', KICKOFF).eventType, 'KICKOFF');
  assert.equal(transition('halftime', KICKOFF).eventType, 'HALFTIME');
  assert.equal(transition('fulltime', KICKOFF).eventType, 'FULLTIME');
  assert.equal(transition('resume', KICKOFF).eventType, null);
});

test('added time resets when a new period begins', () => {
  for (const a of ['start', 'halftime', 'resume', 'fulltime']) {
    assert.equal(transition(a, KICKOFF).addedMinutes, 0, `${a} should clear added time`);
  }
});

test('only sensible transitions are allowed', () => {
  assert.equal(canTransition('PRE', 'start'), true);
  assert.equal(canTransition('FIRST_HALF', 'start'), false);    // cannot kick off twice
  assert.equal(canTransition('FIRST_HALF', 'halftime'), true);
  assert.equal(canTransition('HALF_TIME', 'resume'), true);
  assert.equal(canTransition('SECOND_HALF', 'resume'), false);  // nor restart the second half
  assert.equal(canTransition('SECOND_HALF', 'fulltime'), true);
  assert.equal(canTransition('FULL_TIME', 'fulltime'), false);
});

test('an unknown action is refused rather than guessed at', () => {
  assert.equal(transition('rewind', KICKOFF), null);
  assert.equal(canTransition('FIRST_HALF', 'rewind'), false);
});

test('stoppage is capped, so a match left running does not read 90+5819', () => {
  // A second half still "running" four days later — exactly what a match left
  // live over a weekend produced before the cap existed.
  const stale = { period: 'SECOND_HALF', periodStartedAt: KICKOFF, periodBaseMinute: 45, addedMinutes: 0 };
  const c = readClock(stale, later(60 * 24 * 4));
  assert.equal(c.minute, 90);
  assert.equal(c.stoppage, 15);
  assert.equal(c.display, "90+15'");
  assert.equal(c.stalled, true, 'should be flagged as stalled');
});

test('normal stoppage is untouched by the cap and never flagged stalled', () => {
  const c = readClock(firstHalf(), later(48));
  assert.equal(c.display, "45+3'");
  assert.equal(c.stalled, false);
});
