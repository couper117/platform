const express = require('express');
const { getTeams, getTeam, createTeam, updateTeam, updateTeamStatus } = require('../controllers/teams.controller');
const { protect, requireCapability } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getTeams);
router.get('/:id', protect, getTeam);

router.post('/', protect, requireCapability('teams.create'), upload.single('logo'), validate(schemas.createTeam), createTeam);
router.put('/:id', protect, requireCapability('teams.write'), upload.single('logo'), updateTeam);
router.put('/:id/status', protect, requireCapability('teams.write'), validate(schemas.updateTeamStatus), updateTeamStatus);

module.exports = router;
