const prisma = require('../config/db');

// Middleware to log every request (Visitor Tracking)
const visitorTracker = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const pagePath = req.originalUrl;

    await prisma.activityLog.create({
      data: {
        action: 'PAGE_VIEW',
        module: 'VISITOR_TRACKING',
        detail: `Visited: ${pagePath}`,