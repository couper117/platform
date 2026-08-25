/**
 * Roster-form generation and roster import.
 *
 * Both an Amashuri admin and a school coordinator do the same two things — take a
 * form for a team, and send the filled one back — so the work lives here once and
 * the two routers differ only in how they resolve *which* school is in play.
 */

const prisma = require('../../config/db');
const { buildRosterForm, rosterFormFilename } = require('../../services/akc3/rosterForm.service');
const { importPlayersFromCSV } = require('../../services/akc3/import.service');
const { TEAM_GENDERS, AGE_CATEGORIES, LEVELS } = require('../../services/akc3/import.rules');
const { parseCsv } = require('../../utils/csv');
const {
  outstandingForSchool, outstandingBySchool,
  buildConsentForm, consentFormFilename, applyConsentForm,
} = require('../../services/akc3/consentBackfill.service');
const logActivity = require('../../utils/activityLogger');

const upper = (v: any) => String(v ?? '').trim().toUpperCase();

/**
 * Resolve the team a form is for from the query string.
 * Returns { error } with a ready-to-send message, or { team }.
 */
const resolveTeamContext = async (query: any) => {
  const sportId = parseInt(query?.sportId, 10);
  if (Number.isNaN(sportId)) return { error: 'Choose a sport for this roster form.' };

  const sport = await prisma.sport.findUnique({ where: { id: sportId }, select: { id: true, name: true } });
  if (!sport) return { error: `No sport with id ${sportId}.` };

  const gender = upper(query?.gender) || 'MALE';
  if (!TEAM_GENDERS.includes(gender)) {
    return { error: `gender must be one of ${TEAM_GENDERS.join(', ')}.` };
  }

  const ageCategory = upper(query?.ageCategory) || 'U17';
  if (!AGE_CATEGORIES.includes(ageCategory)) {
    return { error: `ageCategory must be one of ${AGE_CATEGORIES.join(', ')}.` };
  }

  const level = upper(query?.level) || 'NATIONAL';
  if (!LEVELS.includes(level)) {
    return { error: `level must be one of ${LEVELS.join(', ')}.` };
  }

  return { team: { sportId: sport.id, sportName: sport.name, gender, ageCategory, level } };
};

/** Send the CSV registration form for `school` as a file download. */
const sendRosterForm = async (req, res, school) => {
  const { error, team } = await resolveTeamContext(req.query);
  if (error) return res.status(400).json({ success: false, message: error });

  const csv = buildRosterForm(school, team, { rows: req.query.rows });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${rosterFormFilename(school, team)}"`);
  return res.status(200).send(csv);
};

/**
 * Import a filled form (or any athlete CSV).
 *
 * `lockedSchool`, when given, pins the import to that school — a coordinator's
 * upload can never create athletes anywhere else, whatever the file's header says.
 */
const runRosterImport = async (req, res, lockedSchool = null) => {
  let rows;
  let meta: any = {};

  if (req.file) {
    const text = req.file.buffer.toString('utf8');
    let parsed;
    try {
      parsed = parseCsv(text);
    } catch (parseError) {
      return res.status(400).json({ success: false, message: parseError.message });
    }
    rows = parsed.rows;
    meta = parsed.meta || {};
  } else if (Array.isArray(req.body?.rows)) {
    rows = req.body.rows;
  } else {
    return res.status(400).json({
      success: false,
      message: 'Attach a .csv file in the "file" field, or post a rows array.',
    });
  }

  // A coordinator handed the wrong school's form must be told so. Silently
  // re-homing those rows under their own school would register another school's
  // pupils as theirs, and the file would look like it imported correctly.
  if (lockedSchool && meta.schoolCode && meta.schoolCode !== lockedSchool.code) {
    return res.status(400).json({
      success: false,
      // Name the codes, not the display names: the code is the field actually
      // compared, and a hand-edited form can carry a name that no longer matches it.
      message: `This form was issued to school ${meta.schoolCode}, not ${lockedSchool.name} (${lockedSchool.code}). Download a form for your own school and fill that one in.`,
    });
  }

  // The form's own header supplies the team; explicit form fields (an admin
  // overriding on the upload screen) win over it.
  const defaults: any = {
    schoolCode: req.body?.schoolCode || meta.schoolCode,
    sportId: req.body?.sportId || meta.sportId,
    gender: req.body?.gender || meta.gender,
    ageCategory: req.body?.ageCategory || meta.ageCategory,
    level: req.body?.level || meta.level,
  };
  // Rows that name no school at all fall back to the coordinator's own; rows that
  // name a different one are rejected downstream by lockedSchoolCode.
  if (lockedSchool && !defaults.schoolCode) defaults.schoolCode = lockedSchool.code;

  const dryRun = req.body?.dryRun === true || req.body?.dryRun === 'true';

  const result = await importPlayersFromCSV(rows, {
    dryRun,
    defaults,
    lockedSchoolCode: lockedSchool ? lockedSchool.code : null,
  });

  if (!dryRun && result.created > 0) {
    await logActivity({
      userId: req.user.id,
      action: 'Import AKC Athletes',
      detail: `${lockedSchool ? `[${lockedSchool.code}] ` : ''}Imported ${result.created} athlete(s), ${result.skipped} skipped, ${result.teamsCreated} team(s) created`,
      module: 'akc3',
      ip: req.ip,
    });
  }

  return res.status(200).json({
    success: true,
    data: { ...result, form: { school: meta.school, sport: meta.sport, gender: meta.gender, ageCategory: meta.ageCategory } },
  });
};

module.exports = { resolveTeamContext, sendRosterForm, runRosterImport };

// ── Retrospective consent (Law N° 058/2021 art. 9) ──
//
// Athletes registered before consent was required. New registrations already
// refuse without it, so this set only shrinks.

const refYearNow = () => new Date().getUTCFullYear();

/** Per-school totals of athletes still awaiting consent. */
const getConsentBacklog = async (req, res, next) => {
  try {
    const data = await outstandingBySchool(refYearNow());
    res.status(200).json({
      success: true,
      totalOutstanding: data.reduce((n, r) => n + r.outstanding, 0),
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/** The athletes at one school still awaiting consent. */
const getSchoolConsentStatus = async (req, res, school) => {
  const athletes = await outstandingForSchool(school.id, refYearNow());
  return res.status(200).json({
    success: true,
    data: { school: { id: school.id, name: school.name, code: school.code }, outstanding: athletes.length, athletes },
  });
};

/** A consent form for one school, pre-filled with the children it concerns. */
const sendConsentForm = async (req, res, school) => {
  const athletes = await outstandingForSchool(school.id, refYearNow());
  if (athletes.length === 0) {
    return res.status(400).json({
      success: false,
      message: `Every athlete at ${school.name} already has consent on file.`,
    });
  }
  const csv = buildConsentForm(school, athletes);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${consentFormFilename(school)}"`);
  return res.status(200).send(csv);
};

/** Apply a returned consent form. `lockedSchool` pins it to one school. */
const runConsentImport = async (req, res, lockedSchool = null) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Attach the filled consent .csv in the "file" field.' });
  }

  let parsed;
  try {
    parsed = parseCsv(req.file.buffer.toString('utf8'));
  } catch (parseError) {
    return res.status(400).json({ success: false, message: parseError.message });
  }

  const meta = parsed.meta || {};
  if (lockedSchool && meta.schoolCode && meta.schoolCode !== lockedSchool.code) {
    return res.status(400).json({
      success: false,
      message: `This consent form was issued to school ${meta.schoolCode}, not ${lockedSchool.name} (${lockedSchool.code}).`,
    });
  }

  const dryRun = req.body?.dryRun === true || req.body?.dryRun === 'true';
  const result = await applyConsentForm(parsed.rows, {
    dryRun,
    lockedSchoolId: lockedSchool ? lockedSchool.id : null,
  });

  if (!dryRun && (result.consented > 0 || result.refused > 0)) {
    await logActivity({
      userId: req.user.id,
      action: 'Record Guardian Consent',
      detail: `${lockedSchool ? `[${lockedSchool.code}] ` : ''}${result.consented} consent(s) recorded, ${result.refused} refused, ${result.skipped} skipped (art. 9 backfill)`,
      module: 'privacy',
      ip: req.ip,
    });
  }

  return res.status(200).json({ success: true, data: { ...result, form: { school: meta.school } } });
};

module.exports.getConsentBacklog = getConsentBacklog;
module.exports.getSchoolConsentStatus = getSchoolConsentStatus;
module.exports.sendConsentForm = sendConsentForm;
module.exports.runConsentImport = runConsentImport;
