const express = require('express');
const router = express.Router();
const { getAll, getBySlug, getStandings, getTopScorers, create, update, remove } = require('../controllers/leagues.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:slug', getBySlug);
router.get('/:slug/standings', getStandings);
router.get('/:slug/top-scorers', getTopScorers);
router.post('/', authenticate, requireAnyAdmin, create);
router.put('/:id', authenticate, requireAnyAdmin, update);
router.delete('/:id', authenticate, requireAnyAdmin, remove);

module.exports = router;