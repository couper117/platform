const express = require('express');
const { initiateSubscription, verifyPayment } = require('../controllers/payments.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/subscribe', protect, authorize('TEAM_MANAGER'), initiateSubscription);
router.post('/verify/:reference', verifyPayment);

module.exports = router;
