const express = require('express');
const { getSettings, getAllSettings, updateSettings } = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSettings);
router.get('/all', protect, authorize('SUPERADMIN'), getAllSettings);
router.put('/', protect, authorize('SUPERADMIN'), updateSettings);

module.exports = router;
