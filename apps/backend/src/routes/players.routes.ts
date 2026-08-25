const express = require('express');
const { getPlayers, getPlayer, createPlayer, updatePlayer, deletePlayer } = require('../controllers/players.controller');
const { protect, attachUser, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'), getPlayers);
router.get('/:id', attachUser, getPlayer);

router.post('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'), upload.single('photo'), validate(schemas.createPlayer), createPlayer);
router.put('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'), upload.single('photo'), updatePlayer);
router.delete('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'), deletePlayer);

module.exports = router;
