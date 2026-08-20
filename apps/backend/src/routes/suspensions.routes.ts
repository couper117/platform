const express = require('express');
const {
  getSuspensions,
  createSuspension,
  liftSuspension,
} = require('../controllers/suspensions.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN', 'FEDERATION_ADMIN'), getSuspensions);
router.post('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), createSuspension);
router.patch('/:id/lift', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), liftSuspension);

module.exports = router;
