/**
 * Unit tests for the data-residency check — no server, no database.
 * Law N° 058/2021 arts. 48–50. Run via `npm run test:unit`.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyDatabase, assessResidency } = require('../../src/services/dataResidency.service');

// The connection string that shipped in .env.example: Supabase, Frankfurt.
const FRANKFURT = 'postgresql://postgres.abc:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
const LOCAL = 'postgresql://postgres:postgres@127.0.0.1:5432/rnsp';

const assess = (over = {}) =>
  assessResidency({ databaseUrl: LOCAL, declared: 'rwanda', certificate: '', nodeEnv: 'production', ...over });

test('classifyDatabase recognises a local database', () => {
  assert.equal(classifyDatabase(LOCAL).placement, 'local');
  assert.equal(classifyDatabase('postgresql://u:p@localhost:5432/db').placement, 'local');
});

test('classifyDatabase names the provider and region of an offshore host', () => {
  const c = classifyDatabase(FRANKFURT);
  assert.equal(c.placement, 'offshore');
  assert.equal(c.provider, 'Supabase');
  assert.equal(c.region, 'eu-central-1');
});

test('classifyDatabase will not vouch for an unknown remote host', () => {
  // A .rw domain is a signal, not proof — the check must not claim certainty.
  assert.equal(classifyDatabase('postgresql://u:p@db.example.rw:5432/db').placement, 'unverified');
});

test('classifyDatabase survives a malformed connection string', () => {
  assert.equal(classifyDatabase('not a url').placement, 'unverified');
  assert.equal(classifyDatabase(undefined).placement, 'unverified');
});

test('local development is never a residency question', () => {
  const r = assess({ declared: undefined });
  assert.equal(r.level, 'ok');
  assert.deepEqual(r.messages, []);
});

test('regression: the shipped Frankfurt config is blocked in production', () => {
  // This is the exact combination the repo shipped — offshore host, no declaration.
  const r = assess({ databaseUrl: FRANKFURT, declared: undefined });
  assert.equal(r.level, 'block');
  assert.equal(r.ok, false);
  assert.match(r.messages[0], /[Aa]rt\. 50/);
});

test('declaring rwanda while pointing at Frankfurt is a contradiction', () => {
  const r = assess({ databaseUrl: FRANKFURT, declared: 'rwanda' });
  assert.equal(r.level, 'block');
  assert.match(r.messages[0], /contradicts/);
  assert.match(r.messages[0], /eu-central-1/);
});

test('offshore without a certificate is blocked — art. 50 requires one', () => {
  const r = assess({ databaseUrl: FRANKFURT, declared: 'offshore', certificate: '' });
  assert.equal(r.level, 'block');
  assert.match(r.messages[0], /NCSA_REGISTRATION_NUMBER is empty/);
});

test('offshore WITH a certificate is allowed, but still flags the contract duty', () => {
  const r = assess({ databaseUrl: FRANKFURT, declared: 'offshore', certificate: 'NCSA/DP/2026/0142' });
  assert.equal(r.level, 'warn');
  assert.equal(r.ok, true);
  assert.match(r.messages[0], /NCSA\/DP\/2026\/0142/);
  assert.match(r.messages[0], /[Aa]rt\. 49/); // written processor contract
});

test('a remote host declared as Rwanda is allowed but not taken on trust', () => {
  const r = assess({ databaseUrl: 'postgresql://u:p@db.example.rw:5432/db', declared: 'rwanda' });
  assert.equal(r.level, 'warn');
  assert.equal(r.ok, true);
  assert.match(r.messages[0], /Confirm with the hosting provider/);
});

test('outside production the same problems warn instead of blocking', () => {
  // A developer pointing at a staging database should not be unable to boot.
  const r = assess({ databaseUrl: FRANKFURT, declared: undefined, nodeEnv: 'development' });
  assert.equal(r.level, 'warn');
  assert.equal(r.ok, true);
});

test('an unrecognised residency value is refused rather than assumed', () => {
  const r = assess({ databaseUrl: FRANKFURT, declared: 'somewhere' });
  assert.equal(r.level, 'block');
  assert.match(r.messages[0], /not recognised/);
});
