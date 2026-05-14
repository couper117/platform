const express = require('express');
const prisma = require('../../config/db');
const { getSchools, createSchool } = require('../../controllers/akc3/schools.controller');
const { getTeams, createTeam } = require('../../controllers/akc3/akc3Teams.controller');
const { getFixtures, createFixture, enterResult } = require('../../controllers/akc3/fixtures.controller');
const { importPlayersFromCSV } = require('../../services/akc3/import.service');
const { protect, authorize } = require('../../middleware/auth');

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
    const where = {};
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

// Admin Routes (SUPERADMIN only for AKC3 management)
router.post('/admin/schools', protect, authorize('SUPERADMIN'), createSchool);
router.post('/admin/teams', protect, authorize('SUPERADMIN'), createTeam);
router.post('/admin/fixtures', protect, authorize('SUPERADMIN'), createFixture);
router.post('/admin/results/:fixtureId', protect, authorize('SUPERADMIN'), enterResult);

router.post('/admin/import/players', protect, authorize('SUPERADMIN'), async (req, res, next) => {
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
const buildCompetitionData = (body = {}) => {
  const data = {};
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

router.post('/admin/competitions', protect, authorize('SUPERADMIN'), async (req, res, next) => {
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

router.put('/admin/competitions/:id', protect, authorize('SUPERADMIN'), async (req, res, next) => {
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

router.delete('/admin/competitions/:id', protect, authorize('SUPERADMIN'), async (req, res, next) => {
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
