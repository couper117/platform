const express = require('express');
const router = express.Router();
const { getAll, update } = require('../controllers/settings.controller');
const { authenticate, requireSuperadmin } = require('../middleware/auth');

router.get('/', getAll);
router.put('/', authenticate, requireSuperadmin, update);

module.exports = router;