const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getStatus, postChat, getProviders, getConfig, updateConfig, listModels, testProvider,
} = require('../controllers/ai.controller');
const { protect, attachUser, requireCapability } = require('../middleware/auth');

const router = express.Router();

/**
 * The chat endpoint spends money on someone else's API every time it is called,
 * so it gets a tighter limit than the platform-wide 300/15min: enough for a real
 * conversation, not enough to be worth scripting. Anonymous callers are limited
 * by IP; a signed-in account by its own id, so one office behind one NAT address
 * is not one shared budget.
 */
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `u:${req.user.id}` : req.ip),
  handler: (req, res) => res.status(429).json({
    success: false,
    message: 'You have asked a lot of questions in a short time. Please wait a few minutes and try again.',
    code: 'RATE_LIMITED',
  }),
});

/**
 * Listing models and testing a connection also call the provider, from an
 * authenticated console. Limited anyway — a stuck "Test" button in a browser tab
 * should not be able to hammer a paid endpoint.
 */
const adminProviderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    success: false,
    message: 'Too many provider requests. Wait a moment and try again.',
  }),
});

// ── Public: what the floating assistant needs to render and to ask ──────────
// attachUser rather than protect: the assistant works for visitors, but tailors
// its answer when it knows who is asking.
router.get('/status', getStatus);
router.post('/chat', attachUser, chatLimiter, postChat);

// ── Admin: AI Configuration ────────────────────────────────────────────────
// One capability guards all of it. Anyone who can change the provider can also
// read which keys are configured, so splitting the two would be theatre.
router.get('/providers', protect, requireCapability('ai.configure'), getProviders);
router.get('/config', protect, requireCapability('ai.configure'), getConfig);
router.put('/config', protect, requireCapability('ai.configure'), updateConfig);
router.post('/models', protect, requireCapability('ai.configure'), adminProviderLimiter, listModels);
router.post('/test', protect, requireCapability('ai.configure'), adminProviderLimiter, testProvider);

module.exports = router;
