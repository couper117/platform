const express = require('express');
const router = express.Router();
const { getAll, getBySlug } = require('../controllers/sports.controller');
const { create, update, remove } = require('../controllers/sports.controller');
const { authenticate, requireSuperadmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:slug', getBySlug);
router.post('/', authenticate, requireSuperadmin, create);
router.put('/:id', authenticate, requireSuperadmin, update);
router.delete('/:id', authenticate, requireSuperadmin, remove);

module.exports = router;