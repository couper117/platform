const express = require('express');
const { assignLeagueAdmin, assignFederationAdmin } = require('../controllers/adminAssignments.controller');
const { getStats } = require('../controllers/adminStats.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN', 'FEDERATION_ADMIN'), getStats);
router.post('/assign-league-admin', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), assignLeagueAdmin);
router.post('/assign-federation-admin', protect, authorize('SUPERADMIN'), assignFederationAdmin);

module.exports = router;
