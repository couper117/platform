/**
 * Unit tests for the RFC 4180 CSV parser — no server, no database.
 * Run via `npm run test:unit` (node:test through tsx).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv } = require('../../src/utils/csv');

test('parses a plain header + rows file', () => {
  const { headers, rows } = parseCsv('a,b\n1,2\n3,4\n');
  assert.deepEqual(headers, ['a', 'b']);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].a, '1');
  assert.equal(rows[1].b, '4');
});

test('regression: a quoted comma stays inside one field', () => {
  // The old browser-side splitter turned this into two cells and shifted every
  // later column — the reason schools with commas in their name broke imports.
  const { rows } = parseCsv('name,code\n"Groupe Scolaire Officiel, Butare",GSO\n');
  assert.equal(rows[0].name, 'Groupe Scolaire Officiel, Butare');
  assert.equal(rows[0].code, 'GSO');
});

test('doubled quotes unescape to a single quote', () => {
  const { rows } = parseCsv('name\n"He said ""hi"""\n');
  assert.equal(rows[0].name, 'He said "hi"');
});

test('a newline inside a quoted field does not split the row', () => {
  const { rows } = parseCsv('name,code\n"Line one\nLine two",X\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Line one\nLine two');
  assert.equal(rows[0].code, 'X');
});

test('handles CRLF, bare CR and a missing trailing newline', () => {
  assert.equal(parseCsv('a,b\r\n1,2\r\n').rows.length, 1);
  assert.equal(parseCsv('a,b\r1,2\r3,4').rows.length, 2);
  assert.equal(parseCsv('a,b\n1,2').rows[0].b, '2');
});

test('strips the UTF-8 BOM Excel writes, so the first column is still findable', () => {
  const { headers, rows } = parseCsv('﻿schoolCode,name\nESB,Alice\n');
  assert.deepEqual(headers, ['schoolCode', 'name']);
  assert.equal(rows[0].schoolCode, 'ESB');
});

test('blank lines are ignored rather than becoming empty athletes', () => {
  const { rows } = parseCsv('a,b\n1,2\n\n   \n3,4\n');
  assert.equal(rows.length, 2);
});

test('cells are trimmed and short rows fill with empty strings', () => {
  const { rows } = parseCsv('a,b,c\n  1  , 2 \n');
  assert.equal(rows[0].a, '1');
  assert.equal(rows[0].b, '2');
  assert.equal(rows[0].c, '');
});

test('__line points at the real line in the file, not the array index', () => {
  const { rows } = parseCsv('a\n1\n\n\n2\n');
  assert.equal(rows[0].__line, 2);
  assert.equal(rows[1].__line, 5); // the blank lines still count in the file
});

test('__line survives a quoted multi-line field', () => {
  const { rows } = parseCsv('a,b\n"x\ny",1\n2,3\n');
  assert.equal(rows[0].__line, 2);
  assert.equal(rows[1].__line, 4);
});

test('rejects an unterminated quote instead of silently truncating', () => {
  assert.throws(() => parseCsv('a,b\n"oops,2\n'), /Unterminated quoted field/);
});

test('rejects duplicate headings, which would otherwise shadow each other', () => {
  assert.throws(() => parseCsv('a,a\n1,2\n'), /Duplicate column heading/);
});

test('rejects an empty file', () => {
  assert.throws(() => parseCsv(''), /empty/);
  assert.throws(() => parseCsv('   \n\n'), /empty/);
});

test('a header-only file parses to zero rows rather than throwing', () => {
  const { headers, rows } = parseCsv('a,b\n');
  assert.deepEqual(headers, ['a', 'b']);
  assert.equal(rows.length, 0);
});

// ── roster-form metadata block ──

test('reads the "# key: value" header a roster form carries', () => {
  const { meta, headers, rows } = parseCsv(
    '# form: Amashuri Games — Athlete Registration\n' +
    '# schoolCode: ESB-04\n' +
    '# sportId: 1\n' +
    '# gender: MALE\n' +
    '# ageCategory: U17\n' +
    'fullName,class\n' +
    'Alice Uwase,S4A\n'
  );
  assert.equal(meta.schoolCode, 'ESB-04');
  assert.equal(meta.sportId, '1');
  assert.equal(meta.ageCategory, 'U17');
  assert.deepEqual(headers, ['fullName', 'class']);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].fullName, 'Alice Uwase');
});

test('prose instruction lines in the header block are skipped, not parsed as keys', () => {
  const { meta, rows } = parseCsv(
    '# schoolCode: ESB-04\n' +
    '# Fill one row per athlete.\n' +
    '#\n' +
    'fullName\nAlice\n'
  );
  assert.equal(meta.schoolCode, 'ESB-04');
  assert.equal(Object.keys(meta).length, 1);
  assert.equal(rows.length, 1);
});

test('an instruction line containing a comma survives being re-joined', () => {
  const { meta } = parseCsv('# note: dates are YYYY-MM-DD, e.g. 2010-04-15\nfullName\nAlice\n');
  assert.equal(meta.note, 'dates are YYYY-MM-DD, e.g. 2010-04-15');
});

test('__line still points past the header block', () => {
  const { rows } = parseCsv('# schoolCode: ESB-04\n# sportId: 1\nfullName\nAlice\nBob\n');
  assert.equal(rows[0].__line, 4);
  assert.equal(rows[1].__line, 5);
});

test('only the LEADING block is metadata — a later # is ordinary data', () => {
  const { rows, meta } = parseCsv('# schoolCode: ESB-04\nfullName\nAlice\n#2 Bob\n');
  assert.equal(meta.schoolCode, 'ESB-04');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].fullName, '#2 Bob');
});

test('a file with no header block still parses, with empty meta', () => {
  const { meta, rows } = parseCsv('a,b\n1,2\n');
  assert.deepEqual(meta, {});
  assert.equal(rows.length, 1);
});
