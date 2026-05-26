const express = require('express');
const { getActivityLogs } = require('../controllers/activity.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('SUPERADMIN'), getActivityLogs);

module.exports = router;
