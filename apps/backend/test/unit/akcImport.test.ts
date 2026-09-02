/**
 * Unit tests for the Amashuri bulk-import rules — no server, no database.
 * Run via `npm run test:unit` (node:test through tsx).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  missingColumns,
  unknownColumns,
  normalizeName,
  parseDob,
  ageIssue,
  normalizeRow,
  teamKey,
  athleteKey,
} = require('../../src/services/akc3/import.rules');

const REF_YEAR = 2026;

// A row that passes every rule; individual tests override one field at a time.
const validRow = (over = {}) => ({
  schoolCode: 'ESB-04',
  sportId: '1',
  gender: 'MALE',
  ageCategory: 'U17',
  playerFullName: 'Jean Bosco Mugisha',
  dob: '2010-04-15',
  position: 'Midfielder',
  jersey: '8',
  idType: 'BIRTH_CERT',
  idNumber: '1201080012345678',
  ...over,
});

const ok = (row: any, refYear = REF_YEAR) => {
  const r = normalizeRow(row, refYear);
  assert.equal(r.ok, true, `expected valid, got: ${(r as any).reason}`);
  return (r as any).value;
};

const reason = (row: any, refYear = REF_YEAR) => {
  const r = normalizeRow(row, refYear);
  assert.equal(r.ok, false, 'expected the row to be rejected');
  return (r as any).reason;
};

// ── columns ──

test('missingColumns names every absent required heading', () => {
  assert.deepEqual(missingColumns(['schoolCode', 'sportId']), ['gender', 'ageCategory', 'playerFullName']);
  assert.deepEqual(
    missingColumns(['schoolCode', 'sportId', 'gender', 'ageCategory', 'playerFullName']),
    []
  );
});

test('unknownColumns flags typos but ignores optional and blank headings', () => {
  assert.deepEqual(unknownColumns(['schoolCode', 'dob', 'nickname', '']), ['nickname']);
});

// ── dates ──

test('parseDob reads ISO dates', () => {
  assert.equal(parseDob('2010-04-15').toISOString().slice(0, 10), '2010-04-15');
});

test('parseDob reads slash dates as day-first', () => {
  assert.equal(parseDob('15/04/2010').toISOString().slice(0, 10), '2010-04-15');
});

test('parseDob resolves an unambiguous month-first date', () => {
  // 04/15/2010 can only be M/D — 15 is not a month.
  assert.equal(parseDob('04/15/2010').toISOString().slice(0, 10), '2010-04-15');
});

test('parseDob returns null for blank and undefined for junk', () => {
  assert.equal(parseDob(''), null);
  assert.equal(parseDob(null), null);
  assert.equal(parseDob('not a date'), undefined);
});

test('parseDob rejects a date that does not exist on the calendar', () => {
  // JS would roll 31 February forward into March if this were left to new Date().
  assert.equal(parseDob('2010-02-31'), undefined);
  assert.equal(parseDob('2010-13-01'), undefined);
});

// ── age caps ──

test('ageIssue: an under-age athlete is eligible', () => {
  assert.equal(ageIssue(new Date(Date.UTC(2010, 0, 1)), 'U17', 2026), null); // ~16
});

test('ageIssue: an over-age athlete is rejected with their age', () => {
  const issue = ageIssue(new Date(Date.UTC(2008, 0, 1)), 'U17', 2026); // ~18
  assert.match(issue, /too old for U17/);
  assert.match(issue, /18/);
});

test('ageIssue: the cap is exclusive, matching the pro-league rule', () => {
  // age === cap is too old; age === cap - 1 is the oldest eligible year.
  assert.notEqual(ageIssue(new Date(Date.UTC(2009, 0, 1)), 'U17', 2026), null); // 17
  assert.equal(ageIssue(new Date(Date.UTC(2010, 0, 1)), 'U17', 2026), null); // 16
});

test('ageIssue: a date of birth is required for an age-capped category', () => {
  assert.match(ageIssue(null, 'U17', 2026), /dob is required/);
});

test('ageIssue: OPEN needs no date of birth', () => {
  assert.equal(ageIssue(null, 'OPEN', 2026), null);
});

test('ageIssue: implausible ages are caught even where no cap applies', () => {
  assert.match(ageIssue(new Date(Date.UTC(1970, 0, 1)), 'OPEN', 2026), /looks wrong/);
  assert.match(ageIssue(new Date(Date.UTC(2024, 0, 1)), 'U13', 2026), /looks wrong/);
});

test('ageIssue: a future date of birth is rejected', () => {
  assert.match(ageIssue(new Date(Date.UTC(2028, 0, 1)), 'OPEN', 2026), /future/);
});

// ── row validation ──

test('a well-formed row normalises to the shape the importer writes', () => {
  const v = ok(validRow());
  assert.equal(v.schoolCode, 'ESB-04');
  assert.equal(v.sportId, 1);
  assert.equal(v.gender, 'MALE');
  assert.equal(v.playerGender, 'MALE');
  assert.equal(v.ageCategory, 'U17');
  assert.equal(v.level, 'NATIONAL');
  assert.equal(v.jersey, 8);
  assert.equal(v.idType, 'BIRTH_CERT');
  assert.equal(v.dob.toISOString().slice(0, 10), '2010-04-15');
});

test('enum-ish fields are accepted case-insensitively', () => {
  const v = ok(validRow({ gender: 'male', ageCategory: 'u17', idType: 'birth_cert' }));
  assert.equal(v.gender, 'MALE');
  assert.equal(v.ageCategory, 'U17');
  assert.equal(v.idType, 'BIRTH_CERT');
});

test('required fields are enforced', () => {
  assert.match(reason(validRow({ schoolCode: '' })), /schoolCode is required/);
  assert.match(reason(validRow({ playerFullName: '  ' })), /playerFullName is required/);
});

test('sportId must be a whole number', () => {
  assert.match(reason(validRow({ sportId: 'football' })), /sportId must be a whole number/);
  assert.match(reason(validRow({ sportId: '1.5' })), /sportId must be a whole number/);
});

test('unknown enum values are named back with the valid set', () => {
  assert.match(reason(validRow({ gender: 'BOYS' })), /gender must be one of/);
  assert.match(reason(validRow({ ageCategory: 'U16' })), /ageCategory must be one of/);
  assert.match(reason(validRow({ idType: 'STUDENT_CARD' })), /idType must be one of/);
  assert.match(reason(validRow({ level: 'REGION' })), /level must be one of/);
});

test('regression: a MIXED team requires each athlete\'s own gender', () => {
  // The previous importer defaulted anything that was not FEMALE to MALE, so every
  // athlete on a mixed team was silently recorded as male.
  assert.match(reason(validRow({ gender: 'MIXED' })), /playerGender is required/);
  assert.equal(ok(validRow({ gender: 'MIXED', playerGender: 'FEMALE' })).playerGender, 'FEMALE');
  assert.equal(ok(validRow({ gender: 'MIXED', playerGender: 'FEMALE' })).gender, 'MIXED');
});

test('a playerGender that contradicts a single-gender team is rejected', () => {
  assert.match(reason(validRow({ gender: 'MALE', playerGender: 'FEMALE' })), /contradicts/);
});

test('jersey numbers must be whole and within 1–99', () => {
  assert.match(reason(validRow({ jersey: 'eight' })), /jersey must be a whole number/);
  assert.match(reason(validRow({ jersey: '0' })), /between 1 and 99/);
  assert.match(reason(validRow({ jersey: '100' })), /between 1 and 99/);
  assert.equal(ok(validRow({ jersey: '' })).jersey, null);
});

test('an unparseable date of birth is reported, not dropped', () => {
  assert.match(reason(validRow({ dob: '15 April 2010' })), /not a valid date/);
});

test('age is validated against the category during row normalisation', () => {
  assert.match(reason(validRow({ dob: '2005-04-15' })), /too old for U17/);
  assert.match(reason(validRow({ dob: '', ageCategory: 'U17' })), /dob is required/);
});

// ── keys ──

test('normalizeName ignores case and repeated spaces', () => {
  assert.equal(normalizeName('  Jean   BOSCO '), 'jean bosco');
  assert.equal(normalizeName('Jean Bosco'), normalizeName('jean  bosco'));
});

test('teamKey groups by school, sport, gender and age category', () => {
  const a = ok(validRow());
  const b = ok(validRow({ playerFullName: 'Someone Else', jersey: '9' }));
  assert.equal(teamKey(a), teamKey(b));
  assert.notEqual(teamKey(a), teamKey(ok(validRow({ ageCategory: 'U20', dob: '2008-04-15' }))));
});

test('athleteKey treats the same name in the same team as one athlete', () => {
  assert.equal(
    athleteKey(ok(validRow())),
    athleteKey(ok(validRow({ playerFullName: 'jean  bosco   mugisha' })))
  );
});

test('athleteKey keeps genuine namesakes apart by date of birth', () => {
  // The 2011 athlete is 15 in the reference year, so the art. 9 consent columns
  // are required for them — supplied here so the test exercises the key, not consent.
  const consented = { guardianName: 'A Guardian', guardianConsent: 'YES' };
  assert.notEqual(
    athleteKey(ok(validRow({ dob: '2010-04-15' }))),
    athleteKey(ok(validRow({ dob: '2011-04-15', ...consented })))
  );
});

// ── roster-form fields ──

const { normalizePhone, ROSTER_COLUMNS } = require('../../src/services/akc3/import.rules');

test('normalizePhone accepts every shape a school might submit', () => {
  // Excel drops the leading zero when it reads the column as a number.
  assert.equal(normalizePhone('0788123456'), '0788123456');
  assert.equal(normalizePhone('788123456'), '0788123456');
  assert.equal(normalizePhone('+250788123456'), '0788123456');
  assert.equal(normalizePhone('250788123456'), '0788123456');
  assert.equal(normalizePhone('078 812 3456'), '0788123456');
  assert.equal(normalizePhone('078-812-3456'), '0788123456');
  assert.equal(normalizePhone('(078) 812 3456'), '0788123456');
});

test('normalizePhone rejects what cannot be reached', () => {
  assert.equal(normalizePhone('12345'), undefined);
  assert.equal(normalizePhone('0688123456'), undefined); // not a mobile prefix
  assert.equal(normalizePhone('07881234567'), undefined); // too long
  assert.equal(normalizePhone('not a phone'), undefined);
});

test('normalizePhone treats blank as "not supplied", not invalid', () => {
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(null), null);
});

test('the roster form asks for the six agreed fields, plus the consent the law requires', () => {
  // The six columns the school agreed to collect, in order...
  assert.deepEqual(ROSTER_COLUMNS.slice(0, 6), [
    'fullName', 'nationality', 'dateOfBirth', 'guardianPhone', 'class', 'studentCode',
  ]);
  // ...and the two that record parental consent, without which an under-16's data
  // has no lawful basis (Law N° 058/2021 art. 9).
  assert.deepEqual(ROSTER_COLUMNS.slice(6), ['guardianName', 'guardianConsent']);
});

// A row as it comes off the school roster form: athlete columns only, with the
// team supplied by the form's header block.
const rosterRow = (over = {}) => ({
  fullName: 'Alice Uwase',
  nationality: 'Rwandan',
  dateOfBirth: '2010-06-02',
  guardianPhone: '0788123456',
  class: 'S4A',
  studentCode: 'ESB-2026-114',
  ...over,
});

const formDefaults = { schoolCode: 'ESB-04', sportId: '1', gender: 'FEMALE', ageCategory: 'U17' };

test('a roster row validates using the team from the form header', () => {
  const r = normalizeRow(rosterRow(), REF_YEAR, formDefaults);
  assert.equal(r.ok, true, (r as any).reason);
  const v = (r as any).value;
  assert.equal(v.schoolCode, 'ESB-04');
  assert.equal(v.sportId, 1);
  assert.equal(v.gender, 'FEMALE');
  assert.equal(v.playerGender, 'FEMALE');
  assert.equal(v.fullName, 'Alice Uwase');
  assert.equal(v.nationality, 'Rwandan');
  assert.equal(v.schoolClass, 'S4A');
  assert.equal(v.studentCode, 'ESB-2026-114');
  assert.equal(v.guardianPhone, '0788123456');
  assert.equal(v.dob.toISOString().slice(0, 10), '2010-06-02');
});

test('a row may override what the form header says', () => {
  const r = normalizeRow(rosterRow({ ageCategory: 'U20' }), REF_YEAR, formDefaults);
  assert.equal((r as any).value.ageCategory, 'U20');
});

test('roster rows are still age-checked against the form header category', () => {
  const r = normalizeRow(rosterRow({ dateOfBirth: '2004-06-02' }), REF_YEAR, formDefaults);
  assert.equal(r.ok, false);
  assert.match((r as any).reason, /too old for U17/);
});

test('a guardian phone that cannot be dialled is rejected', () => {
  const r = normalizeRow(rosterRow({ guardianPhone: '123' }), REF_YEAR, formDefaults);
  assert.equal(r.ok, false);
  assert.match((r as any).reason, /guardian phone/);
});

test('nationality defaults to Rwandan when the school leaves it blank', () => {
  const r = normalizeRow(rosterRow({ nationality: '' }), REF_YEAR, formDefaults);
  assert.equal((r as any).value.nationality, 'Rwandan');
});

test('missingColumns is satisfied by the form header, not just by columns', () => {
  const rosterHeaders = ['fullName', 'nationality', 'dateOfBirth', 'guardianPhone', 'class', 'studentCode'];
  // Without the header block, a roster file is missing the team-defining columns.
  assert.deepEqual(missingColumns(rosterHeaders), ['schoolCode', 'sportId', 'gender', 'ageCategory']);
  // With it, the file is complete.
  assert.deepEqual(missingColumns(rosterHeaders, formDefaults), []);
});

test('unknownColumns does not flag the roster form headings or aliases', () => {
  assert.deepEqual(
    unknownColumns(['fullName', 'dateOfBirth', 'class', 'studentCode', 'guardianPhone', 'nationality']),
    []
  );
});

// ── parent/guardian consent, Law N° 058/2021 art. 9 ──

const { parseConsent } = require('../../src/services/akc3/import.rules');
const { requiresGuardianConsent, CHILD_CONSENT_AGE } = require('../../src/services/privacy.service');

test('the child-consent threshold is 16, as the law sets it', () => {
  assert.equal(CHILD_CONSENT_AGE, 16);
});

test('requiresGuardianConsent follows the under-16 line', () => {
  assert.equal(requiresGuardianConsent(new Date(Date.UTC(2011, 0, 1)), 2026), true);  // ~15
  assert.equal(requiresGuardianConsent(new Date(Date.UTC(2010, 0, 1)), 2026), false); // ~16
  assert.equal(requiresGuardianConsent(new Date(Date.UTC(2000, 0, 1)), 2026), false); // adult
});

test('an athlete of unknown age is treated as a child', () => {
  // The safer default: this is a school roster, so assume the subject is a minor
  // rather than process their data with no lawful basis.
  assert.equal(requiresGuardianConsent(null, 2026), true);
  assert.equal(requiresGuardianConsent('not a date', 2026), true);
});

test('parseConsent reads the spellings a school might write', () => {
  for (const yes of ['YES', 'yes', 'Y', 'true', '1', 'Yego', 'oui']) {
    assert.equal(parseConsent(yes), true, `expected ${yes} to read as consent`);
  }
  for (const no of ['NO', 'n', 'false', '0', 'Oya', 'non']) {
    assert.equal(parseConsent(no), false, `expected ${no} to read as refusal`);
  }
  assert.equal(parseConsent(''), null);        // not answered
  assert.equal(parseConsent('maybe'), undefined); // unreadable
});

const childRow = (over = {}) => ({
  fullName: 'Aline Mukamana',
  dateOfBirth: '2012-05-12', // ~14 in 2026 — a child
  guardianPhone: '0788123456',
  class: 'S2A',
  studentCode: 'GSOB-2026-77',
  guardianName: 'Claudine Mukamana',
  guardianConsent: 'YES',
  ...over,
});
const childDefaults = { schoolCode: 'GSOB-01', sportId: '1', gender: 'FEMALE', ageCategory: 'U15' };

test('a child with recorded guardian consent is accepted', () => {
  const r = normalizeRow(childRow(), REF_YEAR, childDefaults);
  assert.equal(r.ok, true, (r as any).reason);
  assert.equal((r as any).value.guardianConsent, true);
  assert.equal((r as any).value.guardianName, 'Claudine Mukamana');
  assert.equal((r as any).value.isChild, true);
});

test('a child WITHOUT consent is refused — there is no lawful basis', () => {
  assert.match(
    (normalizeRow(childRow({ guardianConsent: 'NO' }), REF_YEAR, childDefaults) as any).reason,
    /consent is required for an athlete under 16/
  );
  assert.match(
    (normalizeRow(childRow({ guardianConsent: '' }), REF_YEAR, childDefaults) as any).reason,
    /consent is required for an athlete under 16/
  );
});

test('a child with consent but no named guardian is refused', () => {
  assert.match(
    (normalizeRow(childRow({ guardianName: '' }), REF_YEAR, childDefaults) as any).reason,
    /guardianName is required/
  );
});

test('an unreadable consent cell is reported, not guessed', () => {
  assert.match(
    (normalizeRow(childRow({ guardianConsent: 'probably' }), REF_YEAR, childDefaults) as any).reason,
    /guardianConsent must be YES or NO/
  );
});

test('an athlete of 16 or over does not need guardian consent recorded', () => {
  const r = normalizeRow(
    childRow({ dateOfBirth: '2008-05-12', guardianConsent: '', guardianName: '' }),
    REF_YEAR,
    { ...childDefaults, ageCategory: 'U20' }
  );
  assert.equal(r.ok, true, (r as any).reason);
  assert.equal((r as any).value.isChild, false);
  assert.equal((r as any).value.guardianConsent, false);
});
