const express = require('express');
const { getPlayers, getPlayer, createPlayer, updatePlayer, deletePlayer } = require('../controllers/players.controller');
const { protect, attachUser, requireCapability } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', protect, requireCapability('players.read'), getPlayers);
router.get('/:id', attachUser, getPlayer);

router.post('/', protect, requireCapability('players.write'), upload.single('photo'), validate(schemas.createPlayer), createPlayer);
router.put('/:id', protect, requireCapability('players.write'), upload.single('photo'), updatePlayer);
router.delete('/:id', protect, requireCapability('players.write'), deletePlayer);

module.exports = router;
