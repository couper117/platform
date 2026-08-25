/**
 * Pure validation + normalisation rules for the Amashuri bulk athlete import.
 *
 * No database, no IO — import.service composes these with Prisma so the decision
 * logic can be unit-tested on its own (see test/unit/akcImport.test.ts). Same
 * split as eligibility.rules.ts / eligibility.service.ts.
 */

const { ageCap } = require('../eligibility.rules');
const { requiresGuardianConsent, CHILD_CONSENT_AGE } = require('../privacy.service');

const REQUIRED_COLUMNS = ['schoolCode', 'sportId', 'gender', 'ageCategory', 'playerFullName'];

const OPTIONAL_COLUMNS = [
  'dob', 'position', 'jersey', 'idType', 'idNumber', 'playerGender', 'level',
  // Collected on the school roster form.
  'nationality', 'guardianPhone', 'class', 'studentCode',
  // Law N° 058/2021 art. 9 — parental consent for a child under 16.
  'guardianName', 'guardianConsent',
];

/**
 * The columns a school fills on the roster form. The team a row belongs to comes
 * from the form's `# key: value` header instead of being repeated on every line,
 * so a coordinator only ever types athlete data.
 */
const ROSTER_COLUMNS = [
  'fullName', 'nationality', 'dateOfBirth', 'guardianPhone', 'class', 'studentCode',
  // Law N° 058/2021 art. 9 requires the consent of a holder of parental
  // responsibility before a under-16's data may be processed. The school records
  // who gave it, so each child's record carries its own lawful basis.
  'guardianName', 'guardianConsent',
];

// Accepted spellings for the same field, so a form-shaped file and a generic
// export both import without the school having to rename anything.
const ALIASES: Record<string, string[]> = {
  playerFullName: ['fullName', 'name', 'athleteName'],
  dob: ['dateOfBirth', 'birthDate', 'dateofbirth'],
  guardianPhone: ['parentPhone', 'parentsNumber', 'guardianNumber'],
  schoolClass: ['class', 'className', 'grade'],
  guardianName: ['parentName', 'guardian', 'parentOrGuardian'],
  guardianConsent: ['consent', 'parentConsent', 'guardianConsentGiven'],
};

// Spellings a school might reasonably write in a yes/no column.
const AFFIRMATIVE = ['YES', 'Y', 'TRUE', '1', 'YEGO', 'OUI', 'CONSENTED', 'SIGNED'];
const NEGATIVE = ['NO', 'N', 'FALSE', '0', 'OYA', 'NON'];

/** Read a consent cell. Returns true/false, or undefined when it is unreadable. */
const parseConsent = (value: any) => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === '') return null;
  if (AFFIRMATIVE.includes(raw)) return true;
  if (NEGATIVE.includes(raw)) return false;
  return undefined;
};

// First non-empty value among a field and its accepted aliases.
const pick = (row: any, field: string) => {
  const names = [field, ...(ALIASES[field] || [])];
  for (const n of names) {
    const v = row?.[n];
    if (v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

const TEAM_GENDERS = ['MALE', 'FEMALE', 'MIXED', 'INCLUSIVE'];
const PLAYER_GENDERS = ['MALE', 'FEMALE'];
const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U20', 'OPEN'];
const ID_TYPES = ['NATIONAL_ID', 'BIRTH_CERT', 'PASSPORT'];
const LEVELS = ['CELL', 'SECTOR', 'DISTRICT', 'PROVINCE', 'NATIONAL'];

// Plausible age band for a school athlete, primary through TVET. Guards against a
// mistyped or misparsed year (a 1900 default, or a birth year typed as this year)
// quietly entering the register — an "under-13" cap alone would accept both.
const MAX_PLAUSIBLE_AGE = 30;
const MIN_PLAUSIBLE_AGE = 5;

const upper = (v: any) => String(v ?? '').trim().toUpperCase();

// Names are compared for duplicates case- and spacing-insensitively: "Jean  Bosco"
// and "jean bosco" are the same child registered twice.
const normalizeName = (name: any) =>
  String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Normalise a Rwandan guardian phone number to its national 07XXXXXXXX form.
 *
 * Excel treats a phone column as a number and drops the leading zero, so the same
 * number comes back as 788123456, 0788123456, +250788123456 or 250788123456
 * depending on how the school filled and saved the form. All four are the same
 * person to reach in an emergency, so all four are accepted.
 *
 * Returns the normalised string, or undefined when it cannot be a Rwandan mobile.
 */
const normalizePhone = (value: any) => {
  const raw = String(value ?? '').trim();
  if (raw === '') return null;

  const digits = raw.replace(/[\s()+.-]/g, '');
  if (!/^\d+$/.test(digits)) return undefined;

  let national = digits;
  if (national.startsWith('250')) national = national.slice(3); // +250 / 250 country code
  if (national.length === 9 && national.startsWith('7')) national = `0${national}`; // Excel ate the 0

  if (!/^07\d{8}$/.test(national)) return undefined;
  return national;
};

/**
 * Which required headings are absent from the uploaded file.
 *
 * A column counts as present if the file carries it under any accepted spelling,
 * or if `defaults` already supplies it — which is how a roster form gets away with
 * six athlete columns and no schoolCode/sportId/gender/ageCategory on every row.
 */
const missingColumns = (headers: any[], defaults: any = {}) => {
  const present = new Set((headers || []).map((h) => String(h).trim()));
  const has = (field: string) =>
    [field, ...(ALIASES[field] || [])].some((n) => present.has(n));

  return REQUIRED_COLUMNS.filter((c) => {
    if (has(c)) return false;
    const key = c === 'playerFullName' ? 'fullName' : c;
    return defaults[key] === undefined || defaults[key] === null || defaults[key] === '';
  });
};

/** Headings we don't recognise — surfaced as a warning, never a hard failure. */
const unknownColumns = (headers: any[]) => {
  const known = new Set([
    ...REQUIRED_COLUMNS,
    ...OPTIONAL_COLUMNS,
    ...ROSTER_COLUMNS,
    ...Object.values(ALIASES).flat(),
  ]);
  return (headers || [])
    .map((h) => String(h).trim())
    .filter((h) => h !== '' && !known.has(h));
};

/**
 * Parse a date-of-birth cell. Accepts ISO (YYYY-MM-DD) and the D/M/Y and M/D/Y
 * forms spreadsheets produce. Ambiguous slash dates are read as D/M/Y, the
 * convention in Rwanda; an unambiguous day (>12) settles it either way.
 */
const parseDob = (value: any) => {
  const raw = String(value ?? '').trim();
  if (raw === '') return null;

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return buildDate(+y, +m, +d);
  }

  const slash = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (slash) {
    let [, a, b, y] = slash as any;
    let day = +a;
    let month = +b;
    if (day > 12 && month <= 12) {
      // already D/M
    } else if (month > 12 && day <= 12) {
      [day, month] = [month, day]; // clearly M/D
    }
    return buildDate(+y, month, day);
  }

  return undefined; // unparseable — the caller reports it as an error
};

// Build a UTC date and reject impossible calendar dates (e.g. 31 February), which
// JS would otherwise roll forward into the next month.
const buildDate = (y: number, m: number, d: number) => {
  if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return undefined;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return undefined;
  }
  return date;
};

/**
 * Age check against an "under-N" category.
 *
 * Uses the same birth-year convention as the pro-league rules in
 * eligibility.rules.ts: age = refYear - birthYear, and `age >= cap` is too old.
 * So U17 in 2026 admits anyone born 2010 or later.
 *
 * Returns an error string, or null when the athlete is eligible.
 */
const ageIssue = (dob: Date | null, ageCategory: string, refYear: number) => {
  const cap = ageCap(ageCategory);

  if (!dob) {
    return cap ? `dob is required for ${ageCategory}` : null;
  }

  const birthYear = dob.getUTCFullYear();
  if (dob.getTime() > Date.UTC(refYear, 11, 31)) return 'dob is in the future';

  const age = refYear - birthYear;
  if (age > MAX_PLAUSIBLE_AGE || age < MIN_PLAUSIBLE_AGE) {
    return `dob looks wrong (age ~${age} in ${refYear})`;
  }
  if (cap && age >= cap) return `too old for ${ageCategory} (age ~${age} in ${refYear})`;

  return null;
};

/**
 * Validate and normalise one CSV row into the shape import.service writes.
 *
 * Returns { ok: true, value } or { ok: false, reason }. Everything here is
 * decided from the row alone — school/sport existence and cross-row duplicates
 * are the service's job.
 */
const normalizeRow = (row: any, refYear: number, defaults: any = {}) => {
  const fail = (reason: string) => ({ ok: false as const, reason });

  // A roster form supplies the team context once in its header; a generic export
  // repeats it on every row. Either way the row's own value wins.
  const withDefault = (field: string, key = field) => pick(row, field) || String(defaults?.[key] ?? '').trim();

  const schoolCode = withDefault('schoolCode');
  if (!schoolCode) return fail('schoolCode is required');

  const fullName = pick(row, 'playerFullName');
  if (!fullName) return fail('playerFullName is required');
  if (fullName.length > 200) return fail('playerFullName is longer than 200 characters');

  const sportRaw = withDefault('sportId');
  if (!/^\d+$/.test(sportRaw)) return fail('sportId must be a whole number');
  const sportId = parseInt(sportRaw, 10);

  const gender = upper(withDefault('gender'));
  if (!TEAM_GENDERS.includes(gender)) {
    return fail(`gender must be one of ${TEAM_GENDERS.join(', ')}`);
  }

  // A MIXED or INCLUSIVE team still needs each athlete's own gender, which the
  // old importer silently defaulted to MALE.
  const playerGenderRaw = upper(row?.playerGender);
  let playerGender = playerGenderRaw || (PLAYER_GENDERS.includes(gender) ? gender : '');
  if (!playerGender) {
    return fail(`playerGender is required when the team gender is ${gender}`);
  }
  if (!PLAYER_GENDERS.includes(playerGender)) {
    return fail(`playerGender must be one of ${PLAYER_GENDERS.join(', ')}`);
  }
  if (PLAYER_GENDERS.includes(gender) && playerGenderRaw && playerGenderRaw !== gender) {
    return fail(`playerGender ${playerGenderRaw} contradicts the ${gender} team`);
  }

  const ageCategory = upper(withDefault('ageCategory'));
  if (!AGE_CATEGORIES.includes(ageCategory)) {
    return fail(`ageCategory must be one of ${AGE_CATEGORIES.join(', ')}`);
  }

  const dobParsed = parseDob(pick(row, 'dob'));
  if (dobParsed === undefined) return fail('date of birth is not a valid date (use YYYY-MM-DD)');
  const dob = dobParsed;

  const issue = ageIssue(dob, ageCategory, refYear);
  if (issue) return fail(issue);

  let jersey: number | null = null;
  const jerseyRaw = pick(row, 'jersey');
  if (jerseyRaw !== '') {
    if (!/^\d+$/.test(jerseyRaw)) return fail('jersey must be a whole number');
    jersey = parseInt(jerseyRaw, 10);
    if (jersey < 1 || jersey > 99) return fail('jersey must be between 1 and 99');
  }

  const idType = upper(pick(row, 'idType')) || 'NATIONAL_ID';
  if (!ID_TYPES.includes(idType)) {
    return fail(`idType must be one of ${ID_TYPES.join(', ')}`);
  }

  const level = upper(withDefault('level')) || 'NATIONAL';
  if (!LEVELS.includes(level)) {
    return fail(`level must be one of ${LEVELS.join(', ')}`);
  }

  // Guardian contact: the one field a school is asked for that has to be reachable,
  // so a number that cannot be a Rwandan mobile is refused rather than stored broken.
  const guardianPhone = normalizePhone(pick(row, 'guardianPhone'));
  if (guardianPhone === undefined) {
    return fail("parent/guardian phone isn't a valid Rwandan number (e.g. 0788123456)");
  }

  const idNumber = pick(row, 'idNumber') || null;
  const position = pick(row, 'position') || null;
  const studentCode = pick(row, 'studentCode') || null;
  const schoolClass = pick(row, 'schoolClass') || null;
  // Unstated nationality is Rwandan, matching the pro-side Player default.
  const nationality = pick(row, 'nationality') || 'Rwandan';

  // Law N° 058/2021 art. 9: without the consent of a holder of parental
  // responsibility there is no lawful basis to process an under-16's data, so the
  // row is refused rather than registered and cleaned up later. An athlete whose
  // age is unknown is treated as a child.
  const guardianName = pick(row, 'guardianName') || null;
  const consent = parseConsent(pick(row, 'guardianConsent'));
  if (consent === undefined) {
    return fail('guardianConsent must be YES or NO');
  }
  const isChild = requiresGuardianConsent(dob, refYear);
  if (isChild) {
    if (consent !== true) {
      return fail(`parent/guardian consent is required for an athlete under ${CHILD_CONSENT_AGE} (guardianConsent = YES)`);
    }
    if (!guardianName) {
      return fail('guardianName is required — record who gave consent for this child');
    }
  }
  const guardianConsent = consent === true;

  return {
    ok: true as const,
    value: {
      schoolCode,
      sportId,
      gender,
      playerGender,
      ageCategory,
      level,
      fullName,
      dob,
      position,
      jersey,
      idType,
      idNumber,
      nationality,
      guardianPhone,
      schoolClass,
      studentCode,
      guardianName,
      guardianConsent,
      isChild,
    },
  };
};

// A team is identified by school + sport + gender + age group; the importer
// reuses an existing one and only creates what's genuinely new.
const teamKey = (v: any) => `${v.schoolCode}|${v.sportId}|${v.gender}|${v.ageCategory}`;

// Two rows describe the same athlete when the same name appears in the same team.
// A date of birth, where present, distinguishes genuine namesakes.
const athleteKey = (v: any) =>
  `${teamKey(v)}|${normalizeName(v.fullName)}|${v.dob ? v.dob.toISOString().slice(0, 10) : ''}`;

module.exports = {
  REQUIRED_COLUMNS,
  OPTIONAL_COLUMNS,
  ROSTER_COLUMNS,
  ALIASES,
  pick,
  normalizePhone,
  parseConsent,
  TEAM_GENDERS,
  PLAYER_GENDERS,
  AGE_CATEGORIES,
  ID_TYPES,
  LEVELS,
  MAX_PLAUSIBLE_AGE,
  MIN_PLAUSIBLE_AGE,
  missingColumns,
  unknownColumns,
  normalizeName,
  parseDob,
  ageIssue,
  normalizeRow,
  teamKey,
  athleteKey,
};
