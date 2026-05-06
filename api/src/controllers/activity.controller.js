const prisma = require('../config/db');

// @desc    Get activity logs
// @route   GET /api/v1/activity
// @access  Private/Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const { userId, module, action, ip, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (userId) where.userId = parseInt(userId);
    if (module) where.module = module;
    if (action) where.action = action;
    if (ip) where.ip = ip;

    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { fullName: true, username: true } } },