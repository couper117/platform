const express = require('express');
const {
  getRegistrations,
  createRegistration,
  reviewRegistration,
} = require('../controllers/registrations.controller');
const { protect, requireCapability } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireCapability('registrations.read'), getRegistrations);
router.post('/', protect, createRegistration);
router.patch('/:id/review', protect, requireCapability('registrations.review'), reviewRegistration);

module.exports = router;
