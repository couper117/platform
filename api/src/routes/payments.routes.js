const express = require('express');
const { initiateSubscription, verifyPayment } = require('../controllers/payments.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/subscribe', protect, authorize('TEAM_MANAGER'), initiateSubscription);
// Admin-confirmed verification. A production gateway webhook would live on a
// separate route that validates a provider signature instead of requiring auth.
router.post('/verify/:reference', protect, authorize('SUPERADMIN'), verifyPayment);

module.exports = router;
