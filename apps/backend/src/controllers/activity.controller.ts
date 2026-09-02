const prisma = require('../config/db');

// @desc    Get activity logs
// @route   GET /api/v1/activity
// @access  Private/Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const { userId, module, excludeModule, action, ip, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (userId) where.userId = parseInt(userId);
    if (module) where.module = module;
    if (action) where.action = action;
    if (ip) where.ip = ip;

    // The visitor tracker writes a row per request, so an unfiltered feed is
    // almost entirely "PAGE_VIEW /api/v1/ads" — which drowns the 77 real audit
    // entries the controllers write (assignments, publishes, deletions). A caller
    // that wants the audit trail rather than the traffic log asks for
    // ?excludeModule=VISITOR_TRACKING; comma-separated for more than one.
    const excluded = String(excludeModule || '').split(',').map((m) => m.trim()).filter(Boolean);
    if (excluded.length && !module) where.module = { notIn: excluded };

    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { fullName: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivityLogs };
