const express = require('express');
const { assignLeagueAdmin, assignFederationAdmin } = require('../controllers/adminAssignments.controller');
const {
  getRoster, assignAmashuriAdmin, revokeAdmin,
  getUsers, updateUser, getCapabilityCatalogue,
  getSystemHealth,
  getActivityTrend, getMediaLibrary,
} = require('../controllers/admin.controller');
const { getStats } = require('../controllers/adminStats.controller');
const { protect, requireCapability } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/stats', protect, requireCapability('admin.stats'), getStats);
router.get('/roster', protect, requireCapability('users.read'), getRoster);
router.get('/users', protect, requireCapability('users.read'), getUsers);
router.patch('/users/:id', protect, requireCapability('users.write'), validate(schemas.updateUser), updateUser);
router.get('/capabilities', protect, requireCapability('users.write'), getCapabilityCatalogue);
router.get('/system-health', protect, requireCapability('system.health'), getSystemHealth);
// Real numbers for the dashboard chart, which used to draw a hard-coded array.
router.get('/activity-trend', protect, requireCapability('admin.stats'), getActivityTrend);
router.get('/media', protect, requireCapability('media.read'), getMediaLibrary);
router.post('/assign-league-admin', protect, requireCapability('leagues.admins'), assignLeagueAdmin);
router.post('/assign-federation-admin', protect, requireCapability('federations.admins'), assignFederationAdmin);
router.post('/assign-amashuri-admin', protect, requireCapability('federations.admins'), assignAmashuriAdmin);
router.post('/revoke-admin', protect, requireCapability('federations.admins'), revokeAdmin);

module.exports = router;
