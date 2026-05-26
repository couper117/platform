const express = require('express');
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

module.exports = router;
