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