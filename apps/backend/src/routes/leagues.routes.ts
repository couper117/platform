const express = require('express');
const prisma = require('../config/db');
const {
  getLeagues, getLeague, createLeague, updateLeague,
  deleteLeague, addTeamToLeague, removeTeamFromLeague,
  getLeagueStandings, getLeagueScorers
} = require('../controllers/leagues.controller');
const { assignReporter } = require('../controllers/adminAssignments.controller');
const { generateFixtures } = require('../controllers/fixtures.controller');
const { protect, requireCapability } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getLeagues);
router.get('/:id/standings', getLeagueStandings);
router.get('/:id/scorers', getLeagueScorers);
router.get('/:id', getLeague);

router.post('/', protect, requireCapability('leagues.write'), validate(schemas.createLeague), createLeague);
router.put('/:id', protect, requireCapability('leagues.write'), updateLeague);
router.delete('/:id', protect, requireCapability('leagues.delete'), deleteLeague);

router.post('/:id/teams/:teamId', protect, requireCapability('leagues.write'), addTeamToLeague);
router.delete('/:id/teams/:teamId', protect, requireCapability('leagues.write'), removeTeamFromLeague);

router.post('/:id/generate-fixtures', protect, requireCapability('leagues.write'), generateFixtures);

router.post('/:leagueId/assign-reporter', protect, requireCapability('reporters.assign'), assignReporter);

// Reporters assigned to a league (the League Admin "Reporters" view).
router.get('/:leagueId/reporters', protect, requireCapability('reporters.read'), async (req, res, next) => {
  try {
    const leagueId = parseInt(req.params.leagueId);
    const assignments = await prisma.reporterAssignment.findMany({
      where: { OR: [{ leagueId }, { fixture: { leagueId } }] },
      include: {
        user: { select: { id: true, fullName: true, email: true, username: true } },
        fixture: { include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
      },
      orderBy: { assignedAt: 'desc' },
    });
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
