const express = require('express');
const { getActivityLogs } = require('../controllers/activity.controller');
const { protect, requireCapability } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireCapability('audit.read'), getActivityLogs);

module.exports = router;
