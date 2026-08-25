const express = require('express');
const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const { getSchools, getSchool, createSchool, updateSchool, setSchoolActive } = require('../../controllers/akc3/schools.controller');
const {
  sendRosterForm, runRosterImport,
  getConsentBacklog, getSchoolConsentStatus, sendConsentForm, runConsentImport,
} = require('../../controllers/akc3/roster.controller');
const schoolPortalRoutes = require('./school');
const { getTeams, createTeam, updateTeam, setTeamActive } = require('../../controllers/akc3/akc3Teams.controller');
const { getFixtures, createFixture, enterResult } = require('../../controllers/akc3/fixtures.controller');
const { REQUIRED_COLUMNS, OPTIONAL_COLUMNS } = require('../../services/akc3/import.rules');
const logActivity = require('../../utils/activityLogger');
const { PUBLIC_ATHLETE_SELECT } = require('../../services/privacy.service');
const { protect, attachUser, authorize } = require('../../middleware/auth');
const uploadCsv = require('../../middleware/uploadCsv');
const validate = require('../../middleware/validate');
const schemas = require('../../validators/schemas');

const router = express.Router();

// School coordinator portal (scoped to the signed-in user's own school).
router.use('/school', schoolPortalRoutes);

// Public Routes
router.get('/schools', getSchools);
// School detail — the controller existed but was never routed, so the public
// school profile page and every "Manage school" link 404'd.
// It nests the school's athletes, so the controller projects them down to the
// public fields for anyone without a duty to see more.
router.get('/schools/:id', attachUser, getSchool);
router.get('/teams', getTeams);
router.get('/fixtures', getFixtures);
router.get('/fixtures/:id', async (req, res, next) => {
  try {
    const fixture = await prisma.akcFixture.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        homeTeam: { include: { school: true } },
        awayTeam: { include: { school: true } },
        competition: true,
      },
    });
    if (!fixture) {
      return res.status(404).json({ success: false, message: 'Fixture not found' });
    }
    res.status(200).json({ success: true, data: fixture });
  } catch (error) {
    next(error);
  }
});
router.get('/standings', async (req, res, next) => {
  try {
    const { competitionId } = req.query;
    const standings = await prisma.akcStanding.findMany({
      where: { competitionId: competitionId ? parseInt(competitionId) : undefined },
      include: { team: { include: { school: true } } },
      orderBy: { points: 'desc' },
    });
    res.status(200).json({ success: true, data: standings });
  } catch (error) {
    next(error);
  }
});

// List all school championships (the umbrella for "Amashuri Games", incl. the Kagame Cup)
router.get('/competitions', async (req, res, next) => {
  try {
    const { status, level } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (level) where.level = level;

    const competitions = await prisma.akcCompetition.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      include: {
        _count: { select: { fixtures: true, standings: true } },
      },
    });
    res.status(200).json({ success: true, count: competitions.length, data: competitions });
  } catch (error) {
    next(error);
  }
});

// Sport tiles for the school hub — the sports that actually have school
// competitions, each with a live competition count (derived, never hardcoded).
router.get('/sports', async (req, res, next) => {
  try {
    const grouped = await prisma.akcCompetition.groupBy({
      by: ['sportId'],
      where: { sportId: { not: null } },
      _count: { _all: true },
    });
    const sportIds = grouped.map((g) => g.sportId).filter((id) => id != null);
    const sports = await prisma.sport.findMany({ where: { id: { in: sportIds } } });
    const byId = Object.fromEntries(sports.map((s) => [s.id, s]));
    const data = grouped
      .filter((g) => byId[g.sportId])
      .map((g) => {
        const s = byId[g.sportId];
        return { slug: s.slug, name: s.name, icon: s.icon, competitions: g._count._all };
      })
      .sort((a, b) => b.competitions - a.competitions);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

// School-sports news feed — pinned first, then newest.
router.get('/announcements', async (req, res, next) => {
  try {
    const data = await prisma.akcAnnouncement.findMany({
      where: { published: true },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

// Athletes (AkcPlayer) across all school teams — the Amashuri "Athletes" admin
// view. `verified=false` narrows to those pending document approval.
//
// Behind auth: these are schoolchildren's records, including dates of birth,
// guardian phone numbers, student codes and disability status. Publishing them
// would breach Law N° 058/2021 art. 9 (children), art. 11 (sensitive data) and
// art. 47 (safeguards). The route was always described as an admin view; it was
// simply never placed behind `protect`.
router.get('/athletes', protect, authorize('SUPERADMIN', 'AMASHURI_ADMIN'), async (req, res, next) => {
  try {
    const { verified, schoolId } = req.query;
    const where: any = {};
    if (verified === 'true') where.docVerified = true;
    if (verified === 'false') where.docVerified = false;
    if (schoolId) where.team = { schoolId: parseInt(schoolId) };
    const athletes = await prisma.akcPlayer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { team: { include: { school: { select: { id: true, name: true, logo: true } } } } },
    });
    res.status(200).json({ success: true, count: athletes.length, data: athletes });
  } catch (error) {
    next(error);
  }
});

// Approve an athlete's documents (the Amashuri "Pending Approvals" action).
router.patch('/admin/athletes/:id/verify', protect, authorize('SUPERADMIN', 'AMASHURI_ADMIN'), async (req, res, next) => {
  try {
    const athlete = await prisma.akcPlayer.update({
      where: { id: parseInt(req.params.id) },
      data: { docVerified: req.body.docVerified !== false },
    });
    res.status(200).json({ success: true, data: athlete });
  } catch (error) {
    next(error);
  }
});

const amashuri = authorize('SUPERADMIN', 'AMASHURI_ADMIN');

// Create a single athlete (the per-athlete alternative to the CSV import).
router.post('/admin/athletes', protect, amashuri, validate(schemas.akcCreateAthlete), async (req, res, next) => {
  try {
    const { teamId, fullName, gender, ageCategory, position, jersey, idNumber, idType, hasDisability, disabilityType } = req.body;
    if (!teamId || !fullName) return res.status(400).json({ success: false, message: 'teamId and fullName are required' });
    const athlete = await prisma.akcPlayer.create({
      data: {
        teamId: parseInt(teamId), fullName,
        gender: gender || undefined, ageCategory: ageCategory || undefined,
        position: position || null, jersey: jersey ? parseInt(jersey) : null,
        idNumber: idNumber || null, idType: idType || undefined,
        hasDisability: !!hasDisability, disabilityType: disabilityType || null,
      },
    });
    res.status(201).json({ success: true, data: athlete });
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/athletes/:id/active', protect, amashuri, async (req, res, next) => {
  try {
    const athlete = await prisma.akcPlayer.update({ where: { id: parseInt(req.params.id) }, data: { active: req.body.active !== false } });
    res.status(200).json({ success: true, data: athlete });
  } catch (error) {
    next(error);
  }
});

// Admin Routes (SUPERADMIN / AMASHURI_ADMIN)
router.post('/admin/schools', protect, amashuri, validate(schemas.akcCreateSchool), createSchool);
router.put('/admin/schools/:id', protect, amashuri, validate(schemas.akcUpdateSchool), updateSchool);
router.patch('/admin/schools/:id/active', protect, amashuri, setSchoolActive);

// The blank registration form an admin hands to a school for one of its teams.
router.get('/admin/schools/:id/roster-form', protect, amashuri, async (req, res, next) => {
  try {
    const school = await prisma.akcSchool.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    await sendRosterForm(req, res, school);
  } catch (error) {
    next(error);
  }
});

// ── Retrospective guardian consent (Law N° 058/2021 art. 9) ──
// Athletes registered before consent was required. They are withheld from public
// team sheets until a guardian's consent is on file or the record is erased.

router.get('/admin/consent/backlog', protect, amashuri, getConsentBacklog);

router.get('/admin/schools/:id/consent', protect, amashuri, async (req, res, next) => {
  try {
    const school = await prisma.akcSchool.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    await getSchoolConsentStatus(req, res, school);
  } catch (error) {
    next(error);
  }
});

router.get('/admin/schools/:id/consent-form', protect, amashuri, async (req, res, next) => {
  try {
    const school = await prisma.akcSchool.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    await sendConsentForm(req, res, school);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/admin/consent/import',
  protect,
  amashuri,
  (req, res, next) => {
    uploadCsv.single('file')(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'That file is larger than the 5MB limit.' : err.message;
      return res.status(400).json({ success: false, message });
    });
  },
  (req, res, next) => { runConsentImport(req, res).catch(next); }
);

// ── School coordinator accounts ──
// The login a school uses to submit its own roster. Created by an admin and bound
// to exactly one school; the portal reads that binding, never a URL parameter.

const COORDINATOR_FIELDS = {
  id: true, username: true, fullName: true, email: true, phone: true,
  active: true, lastLogin: true, createdAt: true,
};

router.get('/admin/schools/:id/coordinators', protect, amashuri, async (req, res, next) => {
  try {
    const coordinators = await prisma.user.findMany({
      where: { akcSchoolId: parseInt(req.params.id), role: 'SCHOOL_COORDINATOR' },
      select: COORDINATOR_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json({ success: true, count: coordinators.length, data: coordinators });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/schools/:id/coordinators', protect, amashuri, async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.id);
    const school = await prisma.akcSchool.findUnique({ where: { id: schoolId } });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    const username = String(req.body?.username || '').trim().toLowerCase();
    const fullName = String(req.body?.fullName || '').trim();
    const password = String(req.body?.password || '');
    const email = String(req.body?.email || '').trim() || null;
    const phone = String(req.body?.phone || '').trim() || null;

    if (username.length < 3) return res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' });
    if (fullName.length < 2) return res.status(400).json({ success: false, message: 'Full name is required.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const clash = await prisma.user.findFirst({
      where: { OR: [{ username }, ...(email ? [{ email }] : [])] },
      select: { id: true },
    });
    if (clash) return res.status(409).json({ success: false, message: 'That username or email is already taken.' });

    const coordinator = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        phone,
        password: await bcrypt.hash(password, 12),
        role: 'SCHOOL_COORDINATOR',
        akcSchoolId: schoolId,
        active: true,
        verified: true,
      },
      select: COORDINATOR_FIELDS,
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create School Coordinator',
      detail: `Created coordinator ${username} for ${school.name}`,
      module: 'akc3',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: coordinator });
  } catch (error) {
    next(error);
  }
});

// Suspend or restore a coordinator's login without deleting the athletes they added.
router.patch('/admin/coordinators/:userId/active', protect, amashuri, async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: parseInt(req.params.userId) } });
    if (!target || target.role !== 'SCHOOL_COORDINATOR') {
      return res.status(404).json({ success: false, message: 'Coordinator not found' });
    }
    const coordinator = await prisma.user.update({
      where: { id: target.id },
      data: { active: req.body?.active !== false },
      select: COORDINATOR_FIELDS,
    });
    await logActivity({
      userId: req.user.id,
      action: coordinator.active ? 'Restore School Coordinator' : 'Suspend School Coordinator',
      detail: `Coordinator ${coordinator.username}`,
      module: 'akc3',
      ip: req.ip,
    });
    res.status(200).json({ success: true, data: coordinator });
  } catch (error) {
    next(error);
  }
});
router.post('/admin/teams', protect, amashuri, validate(schemas.akcCreateTeam), createTeam);
router.put('/admin/teams/:id', protect, amashuri, validate(schemas.akcUpdateTeam), updateTeam);
router.patch('/admin/teams/:id/active', protect, amashuri, setTeamActive);
router.post('/admin/fixtures', protect, amashuri, validate(schemas.akcCreateFixture), createFixture);
router.post('/admin/results/:fixtureId', protect, amashuri, enterResult);

// A blank CSV with the exact headings the importer expects, plus one example row.
// Served from the backend so the column list has a single source of truth
// (import.rules.ts) rather than a copy in the frontend that can drift.
router.get('/admin/import/template', protect, amashuri, (req, res) => {
  const columns = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
  const example: any = {
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
    playerGender: 'MALE',
    level: 'NATIONAL',
  };
  const body = `${columns.join(',')}\n${columns.map((c) => example[c] ?? '').join(',')}\n`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="amashuri-athletes-template.csv"');
  res.status(200).send(body);
});

// Bulk athlete registration. Takes a multipart .csv upload in `file`; a JSON
// `rows` array is still accepted so older clients keep working.
//
// `dryRun` validates the whole file and returns the same report without writing
// anything — the intended first step, since these are children's records and a
// committed import creates them all at once.
router.post(
  '/admin/import/players',
  protect,
  authorize('SUPERADMIN', 'AMASHURI_ADMIN'),
  (req, res, next) => {
    uploadCsv.single('file')(req, res, (err) => {
      if (!err) return next();
      // Multer rejections are the admin's mistake, not a server fault.
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'That file is larger than the 5MB limit.'
        : err.message;
      return res.status(400).json({ success: false, message });
    });
  },
  (req, res, next) => {
    runRosterImport(req, res).catch(next);
  }
);

// --- Championships (AkcCompetition) admin CRUD ---

// Pick + coerce only the fields the AkcCompetition model accepts.
const buildCompetitionData = (body: any = {}) => {
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.edition !== undefined) data.edition = body.edition || null;
  if (body.gender !== undefined) data.gender = body.gender || 'mixed';
  if (body.ageCategory !== undefined) data.ageCategory = body.ageCategory || 'Open';
  if (body.level !== undefined) data.level = body.level;
  if (body.status !== undefined) data.status = body.status;
  if (body.venue !== undefined) data.venue = body.venue || null;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.sportId !== undefined) data.sportId = body.sportId ? parseInt(body.sportId) : null;
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  return data;
};

router.post('/admin/competitions', protect, authorize('SUPERADMIN', 'AMASHURI_ADMIN'), validate(schemas.akcCreateCompetition), async (req, res, next) => {
  try {
    if (!req.body?.name) {
      return res.status(400).json({ success: false, message: 'Championship name is required' });
    }
    const competition = await prisma.akcCompetition.create({ data: buildCompetitionData(req.body) });
    res.status(201).json({ success: true, data: competition });
  } catch (error) {
    next(error);
  }
});

router.put('/admin/competitions/:id', protect, authorize('SUPERADMIN', 'AMASHURI_ADMIN'), async (req, res, next) => {
  try {
    const competition = await prisma.akcCompetition.update({
      where: { id: parseInt(req.params.id) },
      data: buildCompetitionData(req.body),
    });
    res.status(200).json({ success: true, data: competition });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Championship not found' });
    }
    next(error);
  }
});

router.delete('/admin/competitions/:id', protect, authorize('SUPERADMIN', 'AMASHURI_ADMIN'), async (req, res, next) => {
  try {
    await prisma.akcCompetition.delete({ where: { id: parseInt(req.params.id) } });
    res.status(200).json({ success: true, message: 'Championship deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Championship not found' });
    }
    next(error);
  }
});

module.exports = router;
