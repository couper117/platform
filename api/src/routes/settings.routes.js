const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, authorize('SUPERADMIN'), updateSettings);

module.exports = router;
