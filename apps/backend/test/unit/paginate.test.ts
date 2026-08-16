/**
 * Unit tests for the pagination query parser — no server, no database.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPagination } = require('../../src/utils/paginate');

test('no page/limit → unbounded, backward compatible (take undefined)', () => {
  const p = getPagination({});
  assert.equal(p.active, false);
  assert.equal(p.take, undefined);
  assert.equal(p.skip, 0);
  assert.equal(p.limit, null);
});

test('page and limit compute skip/take', () => {
  const p = getPagination({ page: '2', limit: '10' });
  assert.equal(p.active, true);
  assert.equal(p.page, 2);
  assert.equal(p.limit, 10);
  assert.equal(p.take, 10);
  assert.equal(p.skip, 10); // (2 - 1) * 10
});

test('only limit supplied → page defaults to 1', () => {
  const p = getPagination({ limit: '25' });
  assert.equal(p.active, true);
  assert.equal(p.page, 1);
  assert.equal(p.skip, 0);
  assert.equal(p.take, 25);
});

test('limit is clamped to the max (default 100)', () => {
  assert.equal(getPagination({ limit: '9999' }).take, 100);
  assert.equal(getPagination({ limit: '9999' }, 20, 50).take, 50);
});

test('limit and page floor at 1', () => {
  const p = getPagination({ page: '0', limit: '0' });
  assert.equal(p.page, 1);
  assert.equal(p.take, 20); // 0 → default limit
});

test('junk page/limit fall back to sane defaults', () => {
  const p = getPagination({ page: 'abc', limit: 'xyz' });
  assert.equal(p.page, 1);
  assert.equal(p.take, 20);
});
