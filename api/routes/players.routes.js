const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/players.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, requireAnyAdmin, update);
router.delete('/:id', authenticate, requireAnyAdmin, remove);

module.exports = router;