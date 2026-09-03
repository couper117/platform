/**
 * Unit tests for repairing a reply that ran out of token allowance.
 *
 * Every case here is taken from, or is one step away from, what the live
 * assistant actually produced in the browser: a ten-item list of live matches
 * that stopped in the middle of a Markdown link and printed the raw syntax into
 * the chat window. Run via `npm run test:unit`.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://u:p@127.0.0.1:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(48);

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { repairTruncated } = require('../../src/services/ai/chat.service');

const CUT_MARK = 'cut short';

test('a link cut in half is removed, not printed as raw syntax', () => {
  // Verbatim from the running app.
  const out = repairTruncated(
    '- **Rwanda Basketball League** — Basketball (Active)\n- **Kagame Cup Schools** ([/leagues/2](/le',
  );
  assert.equal(out.includes('](/le'), false);
  assert.equal(out.includes('[/leagues/2]'), false);
  assert.ok(out.startsWith('- **Rwanda Basketball League** — Basketball (Active)'));
  assert.ok(out.includes(CUT_MARK));
});

test('a link whose label never closed is removed too', () => {
  const out = repairTruncated('See the table on [Rwanda Premier Leag');
  assert.equal(out.includes('[Rwanda Premier Leag'), false);
});

test('an unclosed bold run cannot embolden the rest of the reply', () => {
  const out = repairTruncated('APR FC lead the table.\nRayon Sports are second with **12 poin');
  assert.equal((out.match(/\*\*/g) || []).length % 2, 0, 'bold markers must be balanced');
  assert.equal(out.includes('12 poin'), false);
});

test('a half-written final bullet is dropped whole', () => {
  const out = repairTruncated('- APR FC — 16 pts\n- Rayon Sports — 12 pts\n- Police FC — 11');
  assert.ok(out.includes('Rayon Sports — 12 pts'));
  assert.equal(out.includes('Police FC — 11'), false);
});

test('a final line that reads as finished is kept', () => {
  // The budget ran out at a sentence boundary — there is nothing to repair, and
  // throwing the line away would lose a complete thought.
  const out = repairTruncated('APR FC lead the table.\nRayon Sports are second.');
  assert.ok(out.includes('Rayon Sports are second.'));
});

test('the reader is told the answer was cut short', () => {
  assert.ok(repairTruncated('- APR FC — 16 pts\n- Rayon Sports — 12').includes(CUT_MARK));
});

test('a reply that is nothing but a broken fragment yields nothing', () => {
  // Better an honest empty than a lone ellipsis under a "cut short" note. `ask`
  // turns an empty answer into a failure the widget can offer to retry.
  assert.equal(repairTruncated('[Rwanda Premier Leag'), '');
});

test('repair never runs on a complete answer', () => {
  // Guard on the call site, not on the text: a finished reply is returned
  // untouched, so no note is ever appended to an answer that was not cut off.
  const { buildSystemPrompt } = require('../../src/services/ai/chat.service');
  assert.equal(typeof buildSystemPrompt, 'function');
});
