const express = require('express');
const { assignLeagueAdmin } = require('../controllers/adminAssignments.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/assign-league-admin', protect, authorize('SUPERADMIN'), assignLeagueAdmin);

module.exports = router;
