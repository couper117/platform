const express = require('express');
const router = express.Router();
const { getAll, getBySlug, getPlayers, getFixtures, create, update, remove } = require('../controllers/teams.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:slug', getBySlug);
router.get('/:id/players', getPlayers);
router.get('/:id/fixtures', getFixtures);
router.post('/', authenticate, create);
router.put('/:id', authenticate, requireAnyAdmin, update);
router.delete('/:id', authenticate, requireAnyAdmin, remove);

module.exports = router;