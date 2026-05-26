const express = require('express');
const { getTeams, getTeam, createTeam, updateTeam, updateTeamStatus } = require('../controllers/teams.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getTeams);
router.get('/:id', getTeam);

router.post('/', protect, authorize('SUPERADMIN'), upload.single('logo'), createTeam);
router.put('/:id', protect, upload.single('logo'), updateTeam);
router.put('/:id/status', protect, authorize('SUPERADMIN'), updateTeamStatus);

module.exports = router;
