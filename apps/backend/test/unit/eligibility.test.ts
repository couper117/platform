/**
 * Unit tests for the pure eligibility rules — no server, no database.
 * Run via `npm run test:unit` (node:test through tsx).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isForeign, ageCap, seasonRefYear, playerLeagueIssues } = require('../../src/services/eligibility.rules');

test('isForeign: Rwandan (any casing) counts as local', () => {
  assert.equal(isForeign('Rwandan'), false);
  assert.equal(isForeign('rwanda'), false);
  assert.equal(isForeign('RWANDAN'), false);
});

test('isForeign: missing nationality is local, never foreign', () => {
  assert.equal(isForeign(null), false);
  assert.equal(isForeign(undefined), false);
  assert.equal(isForeign(''), false);
});

test('isForeign: other nationalities count against the quota', () => {
  assert.equal(isForeign('Kenyan'), true);
  assert.equal(isForeign('Nigerian'), true);
  assert.equal(isForeign('Cameroonian'), true);
});

test('ageCap: maps under-N categories, null when unrestricted', () => {
  assert.equal(ageCap('U13'), 13);
  assert.equal(ageCap('U17'), 17);
  assert.equal(ageCap('U20'), 20);
  assert.equal(ageCap('JUNIOR'), 20);
  assert.equal(ageCap('SENIOR'), null);
  assert.equal(ageCap(undefined), null);
});

test('seasonRefYear: prefers the end year of a "2025/2026" season', () => {
  assert.equal(seasonRefYear({ season: '2025/2026' }), 2026);
  assert.equal(seasonRefYear({ season: '2025-2026' }), 2026);
});

test('seasonRefYear: single-year season, then startDate, then created', () => {
  assert.equal(seasonRefYear({ season: '2024' }), 2024);
  assert.equal(seasonRefYear({ season: '', startDate: '2023-03-01' }), 2023);
  assert.equal(seasonRefYear({ createdAt: '2022-06-01' }), 2022);
});

test('playerLeagueIssues: a matching player has no issues', () => {
  const league = { gender: 'MALE', ageCategory: 'SENIOR' };
  assert.deepEqual(playerLeagueIssues({ fullName: 'Amir', gender: 'MALE' }, league, 2026), []);
});

test('playerLeagueIssues: enforces men-only / women-only leagues', () => {
  const menOnly = playerLeagueIssues({ fullName: 'Bea', gender: 'FEMALE' }, { gender: 'MALE', ageCategory: 'SENIOR' }, 2026);
  assert.equal(menOnly.length, 1);
  assert.match(menOnly[0], /men-only/);

  const womenOnly = playerLeagueIssues({ fullName: 'Ced', gender: 'MALE' }, { gender: 'FEMALE', ageCategory: 'SENIOR' }, 2026);
  assert.match(womenOnly[0], /women-only/);
});

test('playerLeagueIssues: enforces the age cap (too old is rejected)', () => {
  const league = { gender: 'MIXED', ageCategory: 'U17' };
  // Born 2006, ref year 2026 → age ~20 ≥ 17 → too old.
  const old = playerLeagueIssues({ fullName: 'Old', gender: 'MALE', dateOfBirth: '2006-01-01' }, league, 2026);
  assert.match(old[0], /too old/);
  // Born 2012 → age ~14 < 17 → eligible.
  assert.deepEqual(playerLeagueIssues({ fullName: 'Young', gender: 'MALE', dateOfBirth: '2012-01-01' }, league, 2026), []);
});

test('playerLeagueIssues: age-capped league requires a date of birth', () => {
  const noDob = playerLeagueIssues({ fullName: 'NoDob', gender: 'MALE' }, { gender: 'MIXED', ageCategory: 'U20' }, 2026);
  assert.equal(noDob.length, 1);
  assert.match(noDob[0], /date of birth required/);
});
