const express = require('express');
const { getSettings, getAllSettings, updateSettings } = require('../controllers/settings.controller');
const { protect, requireCapability } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSettings);
router.get('/all', protect, requireCapability('settings.write'), getAllSettings);
router.put('/', protect, requireCapability('settings.write'), updateSettings);

module.exports = router;
