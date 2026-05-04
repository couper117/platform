const express = require('express');
const router = express.Router();
const { getAll, getBySlug, create, update, remove } = require('../controllers/news.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:slug', getBySlug);
router.post('/', authenticate, requireAnyAdmin, create);
router.put('/:id', authenticate, requireAnyAdmin, update);
router.delete('/:id', authenticate, requireAnyAdmin, remove);

module.exports = router;