/**
 * Unit tests for the player document verification rule — no server, no database.
 *
 * This rule underpins platform trust (a "verified" team/player is what the B2B
 * model sells), so it gets explicit regression coverage.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isPlayerVerifiable } = require('../../src/constants/documentRequirements');

test('birth certificate + a passport verifies', () => {
  assert.equal(isPlayerVerifiable(['BIRTH_CERTIFICATE', 'PASSPORT']), true);
});

test('birth certificate + a national ID verifies', () => {
  assert.equal(isPlayerVerifiable(['BIRTH_CERTIFICATE', 'NATIONAL_ID']), true);
});

test('a birth certificate alone is not enough (needs a photo ID)', () => {
  assert.equal(isPlayerVerifiable(['BIRTH_CERTIFICATE']), false);
});

test('a photo ID alone is not enough (needs a birth certificate)', () => {
  assert.equal(isPlayerVerifiable(['PASSPORT']), false);
  assert.equal(isPlayerVerifiable(['NATIONAL_ID']), false);
});

test('two photo IDs without a birth certificate do not verify', () => {
  assert.equal(isPlayerVerifiable(['PASSPORT', 'NATIONAL_ID']), false);
});

test('empty / unknown documents do not verify', () => {
  assert.equal(isPlayerVerifiable([]), false);
  assert.equal(isPlayerVerifiable(), false);
  assert.equal(isPlayerVerifiable(['MEDICAL', 'OTHER']), false);
});

// REGRESSION (issue K12): verification once required passport AND national ID,
// making it effectively unreachable. Either photo ID must be sufficient.
test('regression: EITHER photo ID suffices — both are never required together', () => {
  assert.equal(isPlayerVerifiable(['BIRTH_CERTIFICATE', 'PASSPORT']), true);
  assert.equal(isPlayerVerifiable(['BIRTH_CERTIFICATE', 'NATIONAL_ID']), true);
  // The full set still verifies (superset of the requirement).
  assert.equal(isPlayerVerifiable(['BIRTH_CERTIFICATE', 'PASSPORT', 'NATIONAL_ID']), true);
});
