const express = require('express');
const { assignLeagueAdmin, assignFederationAdmin } = require('../controllers/adminAssignments.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/assign-league-admin', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), assignLeagueAdmin);
router.post('/assign-federation-admin', protect, authorize('SUPERADMIN'), assignFederationAdmin);

module.exports = router;
