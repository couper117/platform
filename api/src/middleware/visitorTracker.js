const prisma = require('../config/db');

// Fire-and-forget visitor tracking. Never blocks the request and never throws
// into the pipeline. Skips API sub-resources / health so we only log real page
// views coming from the frontend (X-Page-Path header) or top-level GETs.
const visitorTracker = (req, res, next) => {
  try {
    const pagePath = req.get('X-Page-Path') || req.originalUrl;
    const isNoise = req.method !== 'GET'
      || pagePath.startsWith('/api/v1/health')
      || pagePath.startsWith('/uploads');

    if (!isNoise) {
      prisma.activityLog.create({
        data: {
          action: 'PAGE_VIEW',
          module: 'VISITOR_TRACKING',
          detail: `Visited: ${pagePath}`,
          userId: req.user ? req.user.id : null,
          ip: req.ip || req.connection?.remoteAddress,
          sessionId: req.get('X-Session-Id') || 'anonymous',
          pagePath,
          userAgent: req.get('User-Agent'),
        },
      }).catch((error) => console.error('Visitor logging failed:', error.message));
    }
  } catch (error) {
    console.error('Visitor logging failed:', error.message);
  }
  next();
};

module.exports = visitorTracker;
