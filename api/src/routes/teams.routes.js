const express = require('express');
const { getTeams, getTeam, createTeam, updateTeam, updateTeamStatus } = require('../controllers/teams.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getTeams);
router.get('/:id', protect, getTeam);

router.post('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), upload.single('logo'), validate(schemas.createTeam), createTeam);
router.put('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'TEAM_MANAGER'), upload.single('logo'), updateTeam);
router.put('/:id/status', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), validate(schemas.updateTeamStatus), updateTeamStatus);

module.exports = router;
