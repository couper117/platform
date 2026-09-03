/**
 * Unit tests for the sealing of AI provider credentials — no server, no
 * database, no network. Run via `npm run test:unit`.
 *
 * The environment is set before the module is required, and deliberately not
 * read from a .env file: config/env.ts exits the process when DATABASE_URL or
 * JWT_SECRET is missing, and CI has neither.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://u:p@127.0.0.1:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(48);
process.env.AI_SECRET_KEY = 'test-secret-for-sealing-ai-credentials-0123456789';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { encryptSecret, decryptSecret, maskSecret, isSealed } = require('../../src/services/ai/secrets');

const KEY = 'AIzaSyD-EXAMPLE-not-a-real-key-000000001';

test('a sealed key comes back exactly as it went in', () => {
  const sealed = encryptSecret(KEY);
  assert.notEqual(sealed, KEY);
  assert.equal(isSealed(sealed), true);
  assert.equal(decryptSecret(sealed), KEY);
});

test('the plaintext never appears in the stored value', () => {
  const sealed = encryptSecret(KEY);
  assert.equal(sealed.includes(KEY), false);
  assert.equal(sealed.includes('AIzaSy'), false);
});

test('the same key seals differently every time', () => {
  // A fresh IV per write, so two providers holding the same key do not produce
  // identical rows — which would tell a reader of the table they match.
  assert.notEqual(encryptSecret(KEY), encryptSecret(KEY));
});

test('a tampered ciphertext refuses to open rather than returning rubbish', () => {
  const sealed = encryptSecret(KEY);
  const flipped = `${sealed.slice(0, -4)}${sealed.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA'}`;
  assert.equal(decryptSecret(flipped), null);
});

test('a truncated row opens as nothing, not as a partial key', () => {
  assert.equal(decryptSecret('enc.v1:onlyonepart'), null);
  assert.equal(decryptSecret('enc.v1:'), null);
});

test('nothing in, nothing out', () => {
  assert.equal(encryptSecret(''), null);
  assert.equal(encryptSecret(null), null);
  assert.equal(encryptSecret(undefined), null);
  assert.equal(decryptSecret(''), null);
  assert.equal(decryptSecret(null), null);
});

test('a value written before encryption existed is still readable', () => {
  // Not a hypothetical: it is what a row hand-inserted into Setting looks like.
  assert.equal(isSealed('plain-old-key'), false);
  assert.equal(decryptSecret('plain-old-key'), 'plain-old-key');
});

test('the mask identifies a key without revealing it', () => {
  const masked = maskSecret(KEY);
  assert.equal(masked.endsWith(KEY.slice(-4)), true);
  assert.equal(masked.includes('AIzaSy'), false);
  assert.equal(masked.length, 12);
});

test('a key too short to mask safely is hidden completely', () => {
  // Four visible characters out of six would be most of the secret.
  assert.equal(maskSecret('abc123'), '••••••');
  assert.equal(maskSecret(''), null);
  assert.equal(maskSecret(null), null);
});
