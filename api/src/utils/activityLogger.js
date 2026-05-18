const prisma = require('../config/db');

const logActivity = async ({ userId, action, detail, module, ip }) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        detail,
        module,
        ip,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = logActivity;
