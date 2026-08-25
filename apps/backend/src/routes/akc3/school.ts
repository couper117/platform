/**
 * School coordinator portal — mounted at /api/v1/akc3/school.
 *
 * Every route here is scoped to the one school on the signed-in user's account. The
 * school is never taken from the URL, the query string or the uploaded file, so a
 * coordinator cannot read or register athletes anywhere but their own school.
 */

const express = require('express');
const prisma = require('../../config/db');
const { protect, authorize } = require('../../middleware/auth');
const uploadCsv = require('../../middleware/uploadCsv');
const {
  sendRosterForm, runRosterImport,
  getSchoolConsentStatus, sendConsentForm, runConsentImport,
} = require('../../controllers/akc3/roster.controller');

const router = express.Router();

// Fields a coordinator may see about their own pupils. Deliberately narrow.
const ATHLETE_FIELDS = {
  id: true,
  fullName: true,
  nationality: true,
  dob: true,
  gender: true,
  ageCategory: true,
  position: true,
  jersey: true,
  schoolClass: true,
  studentCode: true,
  guardianPhone: true,
  docVerified: true,
  active: true,
  createdAt: true,
  team: { select: { id: true, sportId: true, gender: true, ageCategory: true } },
};

/**
 * Load the coordinator's school onto the request. A SCHOOL_COORDINATOR with no
 * school attached can do nothing until an admin links one — say so plainly rather
 * than failing later with an empty list.
 */
const withOwnSchool = async (req, res, next) => {
  try {
    if (!req.user.akcSchoolId) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not linked to a school yet. Ask an Amashuri admin to link it.',
      });
    }
    const school = await prisma.akcSchool.findUnique({ where: { id: req.user.akcSchoolId } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'The linked school no longer exists.' });
    }
    if (!school.active) {
      return res.status(403).json({ success: false, message: `${school.name} is not active.` });
    }
    req.school = school;
    next();
  } catch (error) {
    next(error);
  }
};

// SUPERADMIN and AMASHURI_ADMIN are deliberately NOT included: this portal is the
// coordinator's own scoped view, and admins have the full school pages instead.
router.use(protect, authorize('SCHOOL_COORDINATOR'), withOwnSchool);

/** The coordinator's school, its teams, and how many athletes each holds. */
router.get('/me', async (req, res, next) => {
  try {
    const teams = await prisma.akcTeam.findMany({
      where: { schoolId: req.school.id },
      include: { _count: { select: { players: true } } },
      orderBy: [{ sportId: 'asc' }, { ageCategory: 'asc' }],
    });

    const [total, verified] = await Promise.all([
      prisma.akcPlayer.count({ where: { team: { schoolId: req.school.id } } }),
      prisma.akcPlayer.count({ where: { team: { schoolId: req.school.id }, docVerified: true } }),
    ]);

    res.status(200).json({
      success: true,
      data: { school: req.school, teams, athletes: { total, verified, pending: total - verified } },
    });
  } catch (error) {
    next(error);
  }
});

/** Athletes registered at this school, newest first. */
router.get('/athletes', async (req, res, next) => {
  try {
    const where: any = { team: { schoolId: req.school.id } };
    if (req.query.teamId) where.teamId = parseInt(req.query.teamId, 10);
    if (req.query.verified === 'true') where.docVerified = true;
    if (req.query.verified === 'false') where.docVerified = false;

    const athletes = await prisma.akcPlayer.findMany({
      where,
      select: ATHLETE_FIELDS,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    res.status(200).json({ success: true, count: athletes.length, data: athletes });
  } catch (error) {
    next(error);
  }
});

/** Download the blank registration form for one of this school's teams. */
router.get('/roster-form', (req, res, next) => {
  sendRosterForm(req, res, req.school).catch(next);
});

/** Upload the filled form. `dryRun` checks it and reports without saving. */
router.post(
  '/import',
  (req, res, next) => {
    uploadCsv.single('file')(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'That file is larger than the 5MB limit.'
        : err.message;
      return res.status(400).json({ success: false, message });
    });
  },
  (req, res, next) => {
    runRosterImport(req, res, req.school).catch(next);
  }
);

// ── Guardian consent for this school's already-registered athletes (art. 9) ──

router.get('/consent', (req, res, next) => {
  getSchoolConsentStatus(req, res, req.school).catch(next);
});

router.get('/consent-form', (req, res, next) => {
  sendConsentForm(req, res, req.school).catch(next);
});

router.post(
  '/consent/import',
  (req, res, next) => {
    uploadCsv.single('file')(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'That file is larger than the 5MB limit.' : err.message;
      return res.status(400).json({ success: false, message });
    });
  },
  (req, res, next) => { runConsentImport(req, res, req.school).catch(next); }
);

module.exports = router;
