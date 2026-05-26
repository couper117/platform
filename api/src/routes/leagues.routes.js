const express = require('express');
const { 
  getLeagues, getLeague, createLeague, updateLeague, 
  deleteLeague, addTeamToLeague, removeTeamFromLeague 
} = require('../controllers/leagues.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getLeagues);
router.get('/:id', getLeague);

router.post('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), createLeague);
router.put('/:id', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), updateLeague);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteLeague);

router.post('/:id/teams/:teamId', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), addTeamToLeague);
router.delete('/:id/teams/:teamId', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), removeTeamFromLeague);

module.exports = router;
