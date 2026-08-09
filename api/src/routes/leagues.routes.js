const express = require('express');
const {
  getLeagues, getLeague, createLeague, updateLeague,
  deleteLeague, addTeamToLeague, removeTeamFromLeague,
  getLeagueStandings, getLeagueScorers
} = require('../controllers/leagues.controller');
const { assignReporter } = require('../controllers/adminAssignments.controller');
const { generateFixtures } = require('../controllers/fixtures.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getLeagues);
router.get('/:id/standings', getLeagueStandings);
router.get('/:id/scorers', getLeagueScorers);
router.get('/:id', getLeague);

router.post('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), validate(schemas.createLeague), createLeague);
router.put('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), updateLeague);
router.delete('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), deleteLeague);

router.post('/:id/teams/:teamId', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), addTeamToLeague);
router.delete('/:id/teams/:teamId', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), removeTeamFromLeague);

router.post('/:id/generate-fixtures', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), generateFixtures);

router.post('/:leagueId/assign-reporter', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), assignReporter);

module.exports = router;
