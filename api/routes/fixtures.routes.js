const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, enterResult, setLive, remove } = require('../controllers/fixtures.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authenticate, requireAnyAdmin, create);
router.put('/:id', authenticate, requireAnyAdmin, update);
router.put('/:id/result', authenticate, requireAnyAdmin, enterResult);
router.put('/:id/live', authenticate, requireAnyAdmin, setLive);
router.delete('/:id', authenticate, requireAnyAdmin, remove);

module.exports = router;