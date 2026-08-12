const express = require('express');
const { assignLeagueAdmin, assignFederationAdmin } = require('../controllers/adminAssignments.controller');
const {
  getRoster, assignAmashuriAdmin, revokeAdmin,
  getUsers, updateUser, getSystemHealth, getMediaLibrary,
} = require('../controllers/admin.controller');
const { getStats } = require('../controllers/adminStats.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/stats', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), getStats);
router.get('/roster', protect, authorize('SUPERADMIN'), getRoster);
router.get('/users', protect, authorize('SUPERADMIN'), getUsers);
router.patch('/users/:id', protect, authorize('SUPERADMIN'), validate(schemas.updateUser), updateUser);
router.get('/system-health', protect, authorize('SUPERADMIN'), getSystemHealth);
router.get('/media', protect, authorize('SUPERADMIN'), getMediaLibrary);
router.post('/assign-league-admin', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), assignLeagueAdmin);
router.post('/assign-federation-admin', protect, authorize('SUPERADMIN'), assignFederationAdmin);
router.post('/assign-amashuri-admin', protect, authorize('SUPERADMIN'), assignAmashuriAdmin);
router.post('/revoke-admin', protect, authorize('SUPERADMIN'), revokeAdmin);

module.exports = router;
