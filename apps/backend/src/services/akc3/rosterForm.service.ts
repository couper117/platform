/**
 * Builds the athlete registration form a school fills in and hands back.
 *
 * The form is a CSV so it opens in Excel and Google Sheets with nothing installed,
 * and so the returned file can be read straight back by the importer.
 *
 * It is *self-describing*: a `# key: value` block above the headings records the
 * school and the team the rows belong to. That is what lets a coordinator type only
 * athlete details — name, nationality, date of birth, guardian phone, class, student
 * code — while the importer still knows which team to file them under. The admin
 * chooses the team once, when generating the form, and never again.
 */

const { ROSTER_COLUMNS } = require('./import.rules');

// Excel splits a cell on commas unless it is quoted; school names routinely contain
// one ("Groupe Scolaire Officiel, Butare").
const cell = (value: any) => {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * @param school   AkcSchool row (name + code)
 * @param team     { sportId, sportName, gender, ageCategory, level }
 * @param options  { rows } how many blank athlete lines to leave (default 25)
 */
const buildRosterForm = (school: any, team: any, options: any = {}) => {
  const blankRows = Math.min(Math.max(parseInt(options.rows, 10) || 25, 1), 200);

  // A mixed or inclusive team needs each athlete's own gender; a single-sex team
  // takes it from the header, so the column is left off rather than asked for twice.
  const needsGender = team.gender === 'MIXED' || team.gender === 'INCLUSIVE';
  const columns = needsGender
    ? [...ROSTER_COLUMNS.slice(0, 1), 'gender', ...ROSTER_COLUMNS.slice(1)]
    : [...ROSTER_COLUMNS];

  const meta = [
    ['form', 'Amashuri Games — Athlete Registration'],
    ['school', school.name],
    ['schoolCode', school.code],
    ['sport', team.sportName],
    ['sportId', team.sportId],
    ['gender', team.gender],
    ['ageCategory', team.ageCategory],
    ['level', team.level || 'NATIONAL'],
    ['generated', new Date().toISOString().slice(0, 10)],
  ];

  const notes = [
    '',
    'HOW TO FILL THIS FORM',
    'Fill one row per athlete, under the column headings below.',
    'Do NOT edit the lines starting with #, or the heading row — they tell the',
    'system which school and team these athletes belong to.',
    '',
    'fullName      Full name as it appears on the birth certificate.',
    'nationality   e.g. Rwandan. Leave blank for Rwandan.',
    'dateOfBirth   YYYY-MM-DD, e.g. 2010-04-15. Required for every age category',
    `              except OPEN — this team is ${team.ageCategory}.`,
    'guardianPhone Parent or guardian phone, e.g. 0788123456.',
    'class         The athlete\'s class this year, e.g. S4A or P6B.',
    'studentCode   The school\'s own student number for this athlete.',
    'guardianName  The parent or guardian who consented to this registration.',
    'guardianConsent  YES or NO. Required for any athlete under 16.',
  ];

  if (needsGender) {
    notes.push(`gender        MALE or FEMALE — required because this is a ${team.gender} team.`);
  }

  notes.push(
    '',
    'PARENT / GUARDIAN CONSENT — REQUIRED BY LAW',
    'Rwandan law N° 058/2021 on the protection of personal data and privacy',
    '(article 9) allows the data of a child under 16 to be processed only with the',
    'consent of a parent or guardian, given in the child\'s interest.',
    'Before entering an athlete under 16, obtain that consent, write the parent or',
    'guardian\'s name in guardianName, and put YES in guardianConsent. Rows for a',
    'child without recorded consent are refused.',
    'The parent or guardian may withdraw consent at any time by contacting the',
    'school or the Amashuri Games data protection contact; the athlete is then',
    'removed from the register.',
    '',
    'WHAT THE DATA IS USED FOR',
    'These details are used to run school competitions: to confirm an athlete is',
    'eligible for their age category, to produce team sheets and results, and to',
    'reach a parent or guardian in an emergency. They are not published — the',
    'public site shows only an athlete\'s name, position and shirt number.',
    '',
    'Save as CSV when you are done, then send the file back or upload it in the',
    'school portal. Rows with a problem are reported back line by line; nothing is',
    'saved until the import is confirmed.',
    ''
  );

  const lines = [
    ...meta.map(([k, v]) => `# ${k}: ${v}`),
    ...notes.map((n) => (n ? `# ${n}` : '#')),
    columns.join(','),
    ...Array.from({ length: blankRows }, () => columns.map(() => '').join(',')),
  ];

  // A UTF-8 BOM makes Excel open the file as UTF-8, so Kinyarwanda names survive the
  // round trip. The importer strips it again on the way back in.
  return `﻿${lines.join('\r\n')}\r\n`;
};

/** Filename that tells a coordinator at a glance which team the form is for. */
const rosterFormFilename = (school: any, team: any) => {
  const slug = (v: any) => String(v ?? '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `amashuri-roster-${slug(school.code || school.name)}-${slug(team.sportName)}-${slug(team.gender)}-${slug(team.ageCategory)}.csv`;
};

module.exports = { buildRosterForm, rosterFormFilename };
