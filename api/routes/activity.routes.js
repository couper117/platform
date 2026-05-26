const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/activity.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAnyAdmin, getAll);

module.exports = router;