/**
 * Unit tests for how a question is turned into database lookups — no server, no
 * queries. `searchTerms` decides what the assistant goes looking for, so getting
 * it wrong means either six pointless queries per question or a club the person
 * named going unfound. Run via `npm run test:unit`.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://u:p@127.0.0.1:5432/test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { searchTerms, PLATFORM_GUIDE } = require('../../src/services/ai/knowledge.service');

test('names survive and sport vocabulary does not', () => {
  // "match", "next" and "the" would each match half a table and find nothing
  // useful; the names are the whole point of the lookup.
  assert.deepEqual(
    searchTerms('What is the next APR FC match at Amahoro Stadium?'),
    ['apr', 'amahoro', 'stadium'],
  );
});

test('a question made entirely of generic words asks for no lookup', () => {
  // The standing snapshot already answers these, so six wildcard queries would
  // be pure cost.
  assert.deepEqual(searchTerms('show me the fixtures for next week'), []);
  assert.deepEqual(searchTerms('what are the current standings?'), []);
});

test('punctuation and casing do not change what is searched for', () => {
  assert.deepEqual(searchTerms('"Rayon Sports", please!'), ['rayon']);
  assert.deepEqual(searchTerms('RAYON'), searchTerms('rayon'));
});

test('a repeated word is looked up once', () => {
  assert.deepEqual(searchTerms('Kigali Kigali kigali'), ['kigali']);
});

test('no more than six terms, however long the question', () => {
  const terms = searchTerms('Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliet');
  assert.equal(terms.length, 6);
});

test('non-English questions are searched too', () => {
  // Accented and Kinyarwanda words must survive the punctuation strip — the
  // platform is used in three languages.
  // "Où" is two letters and falls under the three-character floor, like "is".
  assert.deepEqual(searchTerms('Où joue Amagaju?'), ['joue', 'amagaju']);
  assert.deepEqual(searchTerms('Le décès du président'), ['décès', 'président']);
  assert.deepEqual(searchTerms('Umukino wa Mukura uzaba ryari?'), ['umukino', 'mukura', 'uzaba', 'ryari']);
});

test('an empty or missing question is safe', () => {
  assert.deepEqual(searchTerms(''), []);
  assert.deepEqual(searchTerms(null), []);
  assert.deepEqual(searchTerms(undefined), []);
});

test('the platform guide only describes routes the app actually has', () => {
  for (const path of ['/fixtures', '/leagues', '/amashuri', '/teams', '/auth/team/register']) {
    assert.ok(PLATFORM_GUIDE.includes(path), `the guide should mention ${path}`);
  }
  // Every role the authorisation policy defines must be described, or the
  // assistant will confidently tell someone their account cannot do something
  // it can. Compared with spacing and case removed, so "SUPERADMIN" matches the
  // "Super Admin" a reader should actually see.
  const { ROLE_CAPABILITIES } = require('../../src/services/capabilities.rules');
  const flat = PLATFORM_GUIDE.toLowerCase().replace(/[^a-z]/g, '');
  for (const role of Object.keys(ROLE_CAPABILITIES)) {
    if (role === 'PUBLIC') continue; // a signed-in visitor holds nothing to describe
    assert.ok(
      flat.includes(role.toLowerCase().replace(/[^a-z]/g, '')),
      `the guide should describe the ${role} role`,
    );
  }
});
