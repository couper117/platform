/**
 * Unit tests for the pure Umuganda date maths — no server, no database.
 *
 * The two things worth locking down: the last-Saturday calculation never drifts
 * off a Saturday, and day-matching respects Kigali local time (UTC+2) rather
 * than raw UTC — otherwise late-evening kickoffs get filed on the wrong day.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  lastSaturdayOf,
  kigaliDayKey,
  dayKey,
  monthsFrom,
  fallsOnUmuganda,
  minutesOfDay,
  clashesWithWindow,
} = require('../../src/services/umuganda.logic');

const iso = (d: any) => d.toISOString().slice(0, 10);

test('lastSaturdayOf always lands on a Saturday, across a full year', () => {
  for (let m = 1; m <= 12; m += 1) {
    const d = lastSaturdayOf(2026, m);
    assert.equal(d.getUTCDay(), 6, `${2026}-${m} produced ${iso(d)}, not a Saturday`);
  }
});

test('lastSaturdayOf returns the LAST Saturday, not merely a late one', () => {
  // Adding 7 days must push it into the following month.
  for (let m = 1; m <= 12; m += 1) {
    const d = lastSaturdayOf(2027, m);
    const plusWeek = new Date(d);
    plusWeek.setUTCDate(plusWeek.getUTCDate() + 7);
    assert.notEqual(plusWeek.getUTCMonth(), d.getUTCMonth(), `${iso(d)} is not the last Saturday`);
  }
});

test('known dates: August 2026 falls on the 29th', () => {
  assert.equal(iso(lastSaturdayOf(2026, 8)), '2026-08-29');
  assert.equal(iso(lastSaturdayOf(2026, 1)), '2026-01-31');
  assert.equal(iso(lastSaturdayOf(2026, 4)), '2026-04-25');
});

test('leap-year February and year rollovers stay on a Saturday', () => {
  for (const [y, m] of [[2024, 2], [2028, 2], [2032, 2], [2027, 1], [2028, 12]]) {
    const d = lastSaturdayOf(y, m);
    assert.equal(d.getUTCDay(), 6, `${y}-${m} -> ${iso(d)}`);
    assert.equal(d.getUTCMonth(), m - 1, `${y}-${m} escaped its month`);
  }
});

test('monthsFrom walks forward and rolls the year over', () => {
  const months = monthsFrom(new Date(Date.UTC(2026, 10, 15)), 4); // Nov 2026
  assert.deepEqual(months, [
    { year: 2026, month: 11 },
    { year: 2026, month: 12 },
    { year: 2027, month: 1 },
    { year: 2027, month: 2 },
  ]);
});

test('kigaliDayKey shifts an instant into Kigali local time (UTC+2)', () => {
  // 22:30 UTC on the 29th is 00:30 on the 30th in Kigali.
  assert.equal(kigaliDayKey(new Date('2026-08-29T22:30:00.000Z')), '2026-08-30');
  // 21:00 UTC is 23:00 the same day.
  assert.equal(kigaliDayKey(new Date('2026-08-29T21:00:00.000Z')), '2026-08-29');
});

test('dayKey does NOT shift — a DATE column is already midnight UTC', () => {
  assert.equal(dayKey(new Date('2026-08-29T00:00:00.000Z')), '2026-08-29');
});

test('fallsOnUmuganda uses the Kigali day, not the UTC day', () => {
  const umuganda = lastSaturdayOf(2026, 8); // 2026-08-29

  // 14:00 Kigali on Umuganda day.
  assert.equal(fallsOnUmuganda(new Date('2026-08-29T12:00:00.000Z'), umuganda), true);
  // 00:30 Kigali on Umuganda day — the previous UTC day.
  assert.equal(fallsOnUmuganda(new Date('2026-08-28T22:30:00.000Z'), umuganda), true);
  // 00:30 Kigali the day AFTER — same UTC day, must not match.
  assert.equal(fallsOnUmuganda(new Date('2026-08-29T22:30:00.000Z'), umuganda), false);
  assert.equal(fallsOnUmuganda(null, umuganda), false);
});

test('minutesOfDay parses HH:MM and rejects nonsense', () => {
  assert.equal(minutesOfDay('08:00'), 480);
  assert.equal(minutesOfDay('11:30'), 690);
  assert.equal(minutesOfDay('8:05'), 485);
  assert.equal(minutesOfDay('25:00'), null);
  assert.equal(minutesOfDay('08:99'), null);
  assert.equal(minutesOfDay('nope'), null);
  assert.equal(minutesOfDay(undefined), null);
});

test('clashesWithWindow separates a morning clash from an afternoon match', () => {
  // 09:00 Kigali — inside the 08:00-11:00 community-work window.
  assert.equal(clashesWithWindow(new Date('2026-08-29T07:00:00.000Z'), '08:00', '11:00'), true);
  // 14:00 Kigali — same day, clear of the window.
  assert.equal(clashesWithWindow(new Date('2026-08-29T12:00:00.000Z'), '08:00', '11:00'), false);
  // Exactly 11:00 Kigali is the end boundary, treated as clear.
  assert.equal(clashesWithWindow(new Date('2026-08-29T09:00:00.000Z'), '08:00', '11:00'), false);
  // A malformed window never reports a clash.
  assert.equal(clashesWithWindow(new Date('2026-08-29T07:00:00.000Z'), 'x', '11:00'), false);
});
