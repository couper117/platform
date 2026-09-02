const express = require('express');
const { initiateSubscription, handleWebhook, verifyPayment } = require('../controllers/payments.controller');
const { protect, requireCapability } = require('../middleware/auth');

const router = express.Router();

router.post('/subscribe', protect, requireCapability('payments.subscribe'), initiateSubscription);

// Gateway webhook — public, but authenticated by the provider's `verif-hash`
// signature inside the handler (never trust an unverified webhook).
router.post('/webhook', handleWebhook);

// Manual admin verification — a fallback when a webhook is missed.
router.post('/verify/:reference', protect, requireCapability('payments.verify'), verifyPayment);

module.exports = router;
