const express = require('express');
const prisma = require('../../config/db');
const { getSchools, createSchool, updateSchool, setSchoolActive } = require('../../controllers/akc3/schools.controller');
const { getTeams, createTeam, updateTeam, setTeamActive } = require('../../controllers/akc3/akc3Teams.controller');
const { getFixtures, createFixture, enterResult } = require('../../controllers/akc3/fixtures.controller');
const { importPlayersFromCSV } = require('../../services/akc3/import.service');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const schemas = require('../../validators/schemas');

const router = express.Router();

// Public Routes
router.get('/schools', getSchools);
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
router.get('/athletes', async (req, res, next) => {
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
router.post('/admin/teams', protect, amashuri, validate(schemas.akcCreateTeam), createTeam);
router.put('/admin/teams/:id', protect, amashuri, validate(schemas.akcUpdateTeam), updateTeam);
router.patch('/admin/teams/:id/active', protect, amashuri, setTeamActive);
router.post('/admin/fixtures', protect, amashuri, validate(schemas.akcCreateFixture), createFixture);
router.post('/admin/results/:fixtureId', protect, amashuri, enterResult);

router.post('/admin/import/players', protect, authorize('SUPERADMIN', 'AMASHURI_ADMIN'), async (req, res, next) => {
  try {
    const { rows } = req.body; // In production, use a proper CSV parser middleware
    const result = await importPlayersFromCSV(rows);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

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
