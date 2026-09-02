/**
 * Collecting parent/guardian consent for athletes registered before consent was
 * required (Law N° 058/2021 art. 9).
 *
 * New registrations are refused without consent, so this only ever concerns the
 * historic set. Two things are needed to clear it: a form a school can actually
 * fill — pre-filled with the children it concerns, so nobody re-types a roster —
 * and an import that *updates* those athletes rather than creating new ones.
 *
 * The matching is by athlete id, carried on the form. A consent record attached
 * to the wrong child is worse than no record, so the form is not matched on name.
 */

const prisma = require('../../config/db');
const { missingConsentWhere } = require('../privacy.service');
const { parseConsent, normalizeName } = require('./import.rules');

const CONSENT_COLUMNS = ['athleteId', 'fullName', 'class', 'dateOfBirth', 'guardianName', 'guardianConsent'];

const cell = (value: any) => {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const iso = (d: any) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** Athletes at a school still awaiting consent, oldest registration first. */
const outstandingForSchool = async (schoolId: number, refYear: number) =>
  prisma.akcPlayer.findMany({
    where: { ...missingConsentWhere(refYear), team: { schoolId } },
    select: {
      id: true, fullName: true, schoolClass: true, dob: true, studentCode: true,
      team: { select: { id: true, sportId: true, gender: true, ageCategory: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

/** Per-school totals for the admin worklist. */
const outstandingBySchool = async (refYear: number) => {
  const grouped = await prisma.akcPlayer.groupBy({
    by: ['teamId'],
    where: missingConsentWhere(refYear),
    _count: { _all: true },
  });
  if (grouped.length === 0) return [];

  const teams = await prisma.akcTeam.findMany({
    where: { id: { in: grouped.map((g: any) => g.teamId) } },
    select: { id: true, schoolId: true, school: { select: { id: true, name: true, code: true } } },
  });
  const teamById = new Map<number, any>(teams.map((t: any) => [t.id, t] as [number, any]));

  const bySchool = new Map<number, any>();
  for (const g of grouped) {
    const team = teamById.get(g.teamId);
    if (!team) continue;
    const row = bySchool.get(team.schoolId) || { school: team.school, outstanding: 0 };
    row.outstanding += g._count._all;
    bySchool.set(team.schoolId, row);
  }
  return [...bySchool.values()].sort((a, b) => b.outstanding - a.outstanding);
};

/**
 * A consent form for one school, pre-filled with the children it concerns.
 *
 * The school adds two columns per row and sends it back. Nothing else on the form
 * is editable in a way that matters — the athlete id is what binds a consent to a
 * child, and a row whose id is missing or unknown is reported, never guessed at.
 */
const buildConsentForm = (school: any, athletes: any[]) => {
  const meta = [
    ['form', 'Amashuri Games — Parent/Guardian Consent'],
    ['school', school.name],
    ['schoolCode', school.code],
    ['athletes', athletes.length],
    ['generated', new Date().toISOString().slice(0, 10)],
  ];

  const notes = [
    '',
    'WHY YOU ARE RECEIVING THIS',
    'These athletes were registered for the Amashuri Games before parent/guardian',
    'consent was recorded. Rwandan law N° 058/2021 on the protection of personal',
    'data and privacy (article 9) allows the data of a child under 16 to be',
    'processed only with the consent of a parent or guardian, given in the',
    'child\'s interest.',
    '',
    'Until consent is recorded these athletes are withheld from published team',
    'sheets. If consent is refused, or not returned, their records are erased.',
    '',
    'WHAT TO DO',
    'For each row, contact the parent or guardian, then fill in the last two',
    'columns only:',
    '  guardianName     the parent or guardian who gave consent',
    '  guardianConsent  YES or NO',
    'Do NOT change athleteId, fullName, class or dateOfBirth — athleteId is what',
    'attaches each consent to the right child.',
    '',
    'Consent may be withdrawn at any time by contacting the school or the',
    'Amashuri Games data protection contact.',
    '',
  ];

  const rows = athletes.map((a) => [
    a.id,
    a.fullName,
    a.schoolClass || '',
    iso(a.dob),
    '',
    '',
  ].map(cell).join(','));

  const lines = [
    ...meta.map(([k, v]) => `# ${k}: ${v}`),
    ...notes.map((n) => (n ? `# ${n}` : '#')),
    CONSENT_COLUMNS.join(','),
    ...rows,
  ];

  return `﻿${lines.join('\r\n')}\r\n`;
};

const consentFormFilename = (school: any) => {
  const slug = (v: any) => String(v ?? '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `amashuri-consent-${slug(school.code || school.name)}.csv`;
};

/**
 * Apply a returned consent form.
 *
 * Updates existing athletes only — it never creates one, so a stray row cannot
 * quietly add a child to the register. `lockedSchoolId` pins the run to a single
 * school, so a coordinator's upload cannot touch another school's records.
 *
 * A row answering NO is not an error: it is a refusal, recorded as such. The
 * athlete keeps `guardianConsent = false` and is reported so an administrator can
 * erase them.
 */
const applyConsentForm = async (rows: any[], options: any = {}) => {
  const dryRun = options.dryRun === true;
  const lockedSchoolId = options.lockedSchoolId ?? null;

  if (!Array.isArray(rows) || rows.length === 0) {
    throw Object.assign(new Error('That file has no data rows.'), { statusCode: 400 });
  }

  const report: any[] = [];
  const toConsent: number[] = [];
  const refused: any[] = [];

  const ids = rows
    .map((r) => parseInt(String(r?.athleteId ?? '').trim(), 10))
    .filter((n) => !Number.isNaN(n));

  const athletes = ids.length
    ? await prisma.akcPlayer.findMany({
        where: { id: { in: [...new Set(ids)] } },
        select: {
          id: true, fullName: true, guardianConsent: true,
          team: { select: { schoolId: true } },
        },
      })
    : [];
  const byId = new Map<number, any>(athletes.map((a: any) => [a.id, a] as [number, any]));

  rows.forEach((row, index) => {
    const line = row?.__line ?? index + 2;
    const name = String(row?.fullName ?? '').trim();
    const add = (status: string, reason?: string) => report.push({ row: index + 1, line, name, status, reason });

    const idRaw = String(row?.athleteId ?? '').trim();
    if (!/^\d+$/.test(idRaw)) {
      return add('skipped', 'athleteId is missing or not a number — do not edit that column');
    }
    const athlete = byId.get(parseInt(idRaw, 10));
    if (!athlete) {
      return add('skipped', `no athlete with id ${idRaw}`);
    }
    if (lockedSchoolId !== null && athlete.team.schoolId !== lockedSchoolId) {
      return add('skipped', 'that athlete belongs to another school');
    }
    // The name is not used for matching, but a mismatch means the form was
    // reordered or edited, and the consent may be against the wrong child.
    if (name && normalizeName(name) !== normalizeName(athlete.fullName)) {
      return add('skipped', `name does not match athlete ${athlete.id} (${athlete.fullName}) — form may have been re-sorted`);
    }

    const consent = parseConsent(row?.guardianConsent);
    if (consent === undefined) return add('skipped', 'guardianConsent must be YES or NO');
    if (consent === null) return add('skipped', 'guardianConsent is blank — no decision recorded');

    if (consent === false) {
      refused.push({ id: athlete.id, name: athlete.fullName });
      return add('refused', 'consent refused — this athlete must be erased');
    }

    const guardianName = String(row?.guardianName ?? '').trim();
    if (!guardianName) return add('skipped', 'guardianName is required — record who gave consent');

    if (athlete.guardianConsent) return add('skipped', 'consent was already on file');

    toConsent.push(athlete.id);
    report.push({ row: index + 1, line, athleteId: athlete.id, name: athlete.fullName, status: 'consented', guardianName });
  });

  if (!dryRun && toConsent.length) {
    const now = new Date();
    // One statement per distinct guardian name, batched by id.
    const byGuardian = new Map<string, number[]>();
    for (const entry of report.filter((r) => r.status === 'consented')) {
      const list = byGuardian.get(entry.guardianName) || [];
      list.push(entry.athleteId); // carried on the entry — never re-matched by name
      byGuardian.set(entry.guardianName, list);
    }
    await prisma.$transaction(
      [...byGuardian.entries()].map(([guardianName, list]) =>
        prisma.akcPlayer.updateMany({
          where: { id: { in: list } },
          data: { guardianConsent: true, guardianConsentAt: now, guardianName },
        })
      )
    );
  }

  return {
    dryRun,
    totalRows: rows.length,
    consented: toConsent.length,
    refused: refused.length,
    skipped: report.filter((r) => r.status === 'skipped').length,
    refusedAthletes: refused,
    report,
  };
};

module.exports = {
  CONSENT_COLUMNS,
  outstandingForSchool,
  outstandingBySchool,
  buildConsentForm,
  consentFormFilename,
  applyConsentForm,
};
