const express = require('express');
const {
  getRegistrations,
  createRegistration,
  reviewRegistration,
} = require('../controllers/registrations.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN', 'FEDERATION_ADMIN'), getRegistrations);
router.post('/', protect, createRegistration);
router.patch('/:id/review', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), reviewRegistration);

module.exports = router;
