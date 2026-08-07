const express = require('express');
const { getPlayers, getPlayer, createPlayer, updatePlayer } = require('../controllers/players.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'), getPlayers);
router.get('/:id', getPlayer);

router.post('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'), upload.single('photo'), validate(schemas.createPlayer), createPlayer);
router.put('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'), upload.single('photo'), updatePlayer);

module.exports = router;
