/**
 * Amashuri bulk athlete import.
 *
 * Takes rows already parsed from a CSV (see utils/csv.ts) and registers student
 * athletes, creating the school teams they belong to as needed.
 *
 * Three properties this is built around, because the records are children's:
 *  - Nothing is written until every row has been checked, and the writes then go
 *    in one transaction — a file never half-lands.
 *  - Duplicates are rejected both within the file and against what is already
 *    registered, so a re-uploaded file is a no-op rather than a second copy of
 *    every athlete.
 *  - Every input row comes back in the report with a status and, when skipped, a
 *    reason naming the line in the admin's own spreadsheet.
 *
 * Row-level validation lives in import.rules.ts; this module handles the database.
 */

const prisma = require('../../config/db');
const {
  REQUIRED_COLUMNS,
  missingColumns,
  unknownColumns,
  normalizeName,
  normalizeRow,
  pick,
  teamKey,
  athleteKey,
} = require('./import.rules');

// A single upload is capped so one file can't tie up the API or the database.
const MAX_ROWS = 5000;

type RowReport = {
  row: number;
  line: number;
  name: string;
  status: 'created' | 'skipped';
  reason?: string;
};

/**
 * @param rows      parsed CSV rows; each may carry `__line` from utils/csv.ts
 * @param options   { dryRun } validates and reports without writing anything;
 *                  { refYear } overrides the year age caps are measured against
 */
const importPlayersFromCSV = async (rows: any[], options: any = {}) => {
  const dryRun = options.dryRun === true;
  const refYear = options.refYear || new Date().getUTCFullYear();
  // Team context from a roster form's header block, or pinned by the caller (a
  // school coordinator may only ever import into their own school).
  const defaults = options.defaults || {};
  const lockedSchoolCode = options.lockedSchoolCode || null;

  if (!Array.isArray(rows)) {
    throw Object.assign(new Error('No rows to import.'), { statusCode: 400 });
  }
  if (rows.length === 0) {
    throw Object.assign(new Error('That file has no data rows.'), { statusCode: 400 });
  }
  if (rows.length > MAX_ROWS) {
    throw Object.assign(
      new Error(`That file has ${rows.length} rows — the limit is ${MAX_ROWS} per upload.`),
      { statusCode: 400 }
    );
  }

  // Headings come from the first row's keys when the caller passed objects.
  const headers = Object.keys(rows[0] || {}).filter((k) => k !== '__line');
  const missing = missingColumns(headers, defaults);
  if (missing.length) {
    throw Object.assign(
      new Error(`Missing required column(s): ${missing.join(', ')}. Expected: ${REQUIRED_COLUMNS.join(', ')}.`),
      { statusCode: 400 }
    );
  }

  const report: RowReport[] = [];
  const accepted: any[] = [];

  const skip = (index: number, row: any, name: string, reason: string) => {
    report.push({ row: index + 1, line: row?.__line ?? index + 2, name, status: 'skipped', reason });
  };

  // ── Pass 1: per-row shape, enums, dates, age caps ──
  const candidates: { index: number; row: any; value: any }[] = [];
  rows.forEach((row, index) => {
    const result = normalizeRow(row, refYear, defaults);
    if (!result.ok) {
      // Read the name through the aliases too — a roster form calls it fullName,
      // and a report that cannot name the athlete is no use to whoever fixes the file.
      skip(index, row, pick(row, 'playerFullName'), result.reason);
      return;
    }
    candidates.push({ index, row, value: result.value });
  });

  // ── Pass 2: resolve schools and sports in two queries, not two per row ──
  const schoolCodes = [...new Set(candidates.map((c) => c.value.schoolCode))];
  const sportIds = [...new Set(candidates.map((c) => c.value.sportId))];

  const [schools, sports] = await Promise.all([
    schoolCodes.length
      ? prisma.akcSchool.findMany({ where: { code: { in: schoolCodes } } })
      : Promise.resolve([]),
    sportIds.length
      ? prisma.sport.findMany({ where: { id: { in: sportIds } }, select: { id: true } })
      : Promise.resolve([]),
  ]);

  const schoolByCode = new Map<string, any>(schools.map((s: any) => [s.code, s] as [string, any]));
  const knownSportIds = new Set(sports.map((s: any) => s.id));

  // AkcSchool.code carries no unique constraint, so two schools can share one.
  // Importing against an ambiguous code would file children under whichever row
  // the query happened to return — refuse those rows instead.
  const ambiguousCodes = new Set(
    schools
      .filter((s: any, i: number) => schools.findIndex((o: any) => o.code === s.code) !== i)
      .map((s: any) => s.code)
  );

  const resolved: { index: number; row: any; value: any; school: any }[] = [];
  for (const c of candidates) {
    const school = schoolByCode.get(c.value.schoolCode);
    if (!school) {
      skip(c.index, c.row, c.value.fullName, `no school with code "${c.value.schoolCode}"`);
      continue;
    }
    if (ambiguousCodes.has(school.code)) {
      skip(c.index, c.row, c.value.fullName, `school code "${school.code}" matches more than one school`);
      continue;
    }
    if (!school.active) {
      skip(c.index, c.row, c.value.fullName, `school "${school.name}" is not active`);
      continue;
    }
    if (!knownSportIds.has(c.value.sportId)) {
      skip(c.index, c.row, c.value.fullName, `no sport with id ${c.value.sportId}`);
      continue;
    }
    // A coordinator's upload can never reach another school, whatever the file says.
    if (lockedSchoolCode && c.value.schoolCode !== lockedSchoolCode) {
      skip(c.index, c.row, c.value.fullName, `this form is for ${lockedSchoolCode}, not ${c.value.schoolCode}`);
      continue;
    }
    resolved.push({ ...c, school });
  }

  // ── Pass 3: match each row to an existing team, or note one to create ──
  const existingTeams = resolved.length
    ? await prisma.akcTeam.findMany({
        where: {
          schoolId: { in: [...new Set(resolved.map((r) => r.school.id))] },
          sportId: { in: [...new Set(resolved.map((r) => r.value.sportId))] },
        },
      })
    : [];

  const dbTeamKey = (t: any, code: string) => `${code}|${t.sportId}|${t.gender}|${t.ageCategory}`;
  const teamByKey = new Map<string, any>();
  const codeBySchoolId = new Map(resolved.map((r) => [r.school.id, r.value.schoolCode]));
  for (const t of existingTeams) {
    const code = codeBySchoolId.get(t.schoolId);
    if (code) teamByKey.set(dbTeamKey(t, code), t);
  }

  // Teams the file implies but that don't exist yet.
  const teamsToCreate = new Map<string, any>();
  for (const r of resolved) {
    const key = teamKey(r.value);
    if (teamByKey.has(key) || teamsToCreate.has(key)) continue;
    teamsToCreate.set(key, {
      schoolId: r.school.id,
      sportId: r.value.sportId,
      gender: r.value.gender,
      ageCategory: r.value.ageCategory,
      level: r.value.level,
    });
  }

  // ── Pass 4: dedupe against athletes already registered ──
  const existingTeamIds = [...teamByKey.values()].map((t) => t.id);
  const schoolIds = [...new Set(resolved.map((r) => r.school.id))];

  const [existingPlayers, schoolPlayers] = await Promise.all([
    existingTeamIds.length
      ? prisma.akcPlayer.findMany({
          where: { teamId: { in: existingTeamIds } },
          select: { teamId: true, fullName: true, dob: true, jersey: true, idNumber: true },
        })
      : Promise.resolve([]),
    // Student codes are issued by the school, so they collide school-wide rather
    // than per team — the same pupil must not be registered twice under two sports.
    schoolIds.length
      ? prisma.akcPlayer.findMany({
          where: { studentCode: { not: null }, team: { schoolId: { in: schoolIds } } },
          select: { studentCode: true, team: { select: { schoolId: true } } },
        })
      : Promise.resolve([]),
  ]);

  const teamKeyById = new Map([...teamByKey.entries()].map(([k, t]) => [t.id, k]));
  const seenAthletes = new Set<string>();
  const seenJerseys = new Set<string>();
  const seenIdNumbers = new Set<string>();
  const seenStudentCodes = new Set<string>();

  for (const p of schoolPlayers) {
    seenStudentCodes.add(`${p.team.schoolId}|${String(p.studentCode).trim().toLowerCase()}`);
  }

  for (const p of existingPlayers) {
    const key = teamKeyById.get(p.teamId);
    if (!key) continue;
    const dob = p.dob ? new Date(p.dob).toISOString().slice(0, 10) : '';
    seenAthletes.add(`${key}|${normalizeName(p.fullName)}|${dob}`);
    if (p.jersey != null) seenJerseys.add(`${key}|${p.jersey}`);
    if (p.idNumber) seenIdNumbers.add(`${key}|${String(p.idNumber).trim().toLowerCase()}`);
  }

  // ── Pass 5: cross-row dedupe, in file order so the first occurrence wins ──
  for (const r of resolved) {
    const v = r.value;
    const key = teamKey(v);
    const aKey = athleteKey(v);

    if (seenAthletes.has(aKey)) {
      skip(r.index, r.row, v.fullName, 'already registered in this team');
      continue;
    }
    if (v.jersey != null && seenJerseys.has(`${key}|${v.jersey}`)) {
      skip(r.index, r.row, v.fullName, `jersey ${v.jersey} is already taken in this team`);
      continue;
    }
    if (v.idNumber && seenIdNumbers.has(`${key}|${v.idNumber.toLowerCase()}`)) {
      skip(r.index, r.row, v.fullName, `ID number ${v.idNumber} is already used in this team`);
      continue;
    }
    const codeKey = v.studentCode ? `${r.school.id}|${v.studentCode.toLowerCase()}` : null;
    if (codeKey && seenStudentCodes.has(codeKey)) {
      skip(r.index, r.row, v.fullName, `student code ${v.studentCode} is already registered at this school`);
      continue;
    }

    seenAthletes.add(aKey);
    if (v.jersey != null) seenJerseys.add(`${key}|${v.jersey}`);
    if (v.idNumber) seenIdNumbers.add(`${key}|${v.idNumber.toLowerCase()}`);
    if (codeKey) seenStudentCodes.add(codeKey);
    accepted.push(r);
  }

  const teamsCreated = [...teamsToCreate.keys()].filter((k) =>
    accepted.some((r) => teamKey(r.value) === k)
  ).length;

  // ── Pass 6: write, unless this is a validation-only run ──
  if (!dryRun && accepted.length) {
    await prisma.$transaction(async (tx: any) => {
      // Create the missing teams first so every athlete has a teamId.
      for (const [key, data] of teamsToCreate) {
        if (!accepted.some((r) => teamKey(r.value) === key)) continue;
        const team = await tx.akcTeam.create({ data });
        teamByKey.set(key, team);
      }

      await tx.akcPlayer.createMany({
        data: accepted.map((r) => ({
          teamId: teamByKey.get(teamKey(r.value)).id,
          fullName: r.value.fullName,
          dob: r.value.dob,
          gender: r.value.playerGender,
          ageCategory: r.value.ageCategory,
          position: r.value.position,
          jersey: r.value.jersey,
          idType: r.value.idType,
          idNumber: r.value.idNumber,
          nationality: r.value.nationality,
          guardianPhone: r.value.guardianPhone,
          schoolClass: r.value.schoolClass,
          studentCode: r.value.studentCode,
          guardianName: r.value.guardianName,
          guardianConsent: r.value.guardianConsent,
          // Stamped at the moment the record is created, so the consent on file
          // is dated (Law N° 058/2021 art. 9).
          guardianConsentAt: r.value.guardianConsent ? new Date() : null,
        })),
      });
    }, { maxWait: 10_000, timeout: 30_000 }); // a full 5,000-row file in one go
  }

  for (const r of accepted) {
    report.push({
      row: r.index + 1,
      line: r.row?.__line ?? r.index + 2,
      name: r.value.fullName,
      status: 'created',
    });
  }
  report.sort((a, b) => a.row - b.row);

  const skipped = report.filter((r) => r.status === 'skipped');

  return {
    dryRun,
    refYear,
    totalRows: rows.length,
    created: accepted.length,
    skipped: skipped.length,
    teamsCreated,
    warnings: unknownColumns(headers).length
      ? [`Ignored unrecognised column(s): ${unknownColumns(headers).join(', ')}.`]
      : [],
    // Kept as `errors` so existing callers that read result.errors still work.
    errors: skipped.map((r) => ({ row: r.line, name: r.name, reason: r.reason })),
    report,
  };
};

module.exports = { importPlayersFromCSV, MAX_ROWS };
