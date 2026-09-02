/**
 * Scheduled work, triggered over HTTP.
 *
 * On a long-running host the stalled-match sweep is a timer in server.ts. A
 * serverless deployment has no process to hold a timer, so the schedule lives in
 * vercel.json and calls in here instead — same service, same rules, a different
 * trigger.
 *
 * Not part of the public API. Every route is gated on a shared secret, because an
 * unauthenticated URL that ends live matches is an unauthenticated URL that ends
 * live matches.
 */

const express = require('express');
const env = require('../config/env');
const { endStalledMatches } = require('../services/staleMatches.service');

const router = express.Router();

/**
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on scheduled invocations.
 *
 * With no secret configured this refuses everything rather than defaulting to
 * open: a cron that never fires is a missed sweep, but an open one is a stranger
 * ending your matches.
 */
const cronOnly = (req, res, next) => {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({
      success: false,
      message: 'CRON_SECRET is not configured, so scheduled work is refused.',
    });
  }
  const offered = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (offered !== secret) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  return next();
};

// @desc    Close matches a reporter left live
// @route   POST|GET /api/v1/internal/cron/end-stalled-matches
// @access  Cron secret only
router.all('/cron/end-stalled-matches', cronOnly, async (req, res, next) => {
  try {
    // Honours AUTO_END_STALLED_MATCHES exactly as the in-process sweep does, so
    // adding the schedule cannot by itself start ending matches on a deployment
    // that never opted in.
    if (!env.AUTO_END_STALLED_MATCHES) {
      return res.status(200).json({
        success: true,
        skipped: 'AUTO_END_STALLED_MATCHES is off',
        data: await endStalledMatches({ dryRun: true }),
      });
    }
    const result = await endStalledMatches();
    for (const c of result.closed) console.log(`Auto-ended fixture ${c.fixtureId}: ${c.reason}`);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
