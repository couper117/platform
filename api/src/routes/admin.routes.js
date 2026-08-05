const express = require('express');
const { assignLeagueAdmin, assignFederationAdmin } = require('../controllers/adminAssignments.controller');
const { getAdminStats, getRoster, assignAmashuriAdmin, revokeAdmin } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), getAdminStats);
router.get('/roster', protect, authorize('SUPERADMIN'), getRoster);
router.post('/assign-league-admin', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), assignLeagueAdmin);
router.post('/assign-federation-admin', protect, authorize('SUPERADMIN'), assignFederationAdmin);
router.post('/assign-amashuri-admin', protect, authorize('SUPERADMIN'), assignAmashuriAdmin);
router.post('/revoke-admin', protect, authorize('SUPERADMIN'), revokeAdmin);

module.exports = router;
