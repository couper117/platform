const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Get all public settings
// @route   GET /api/v1/settings
// @access  Public
const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.skey] = s.sval;
    });
    res.status(200).json({ success: true, data: settingsMap });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update settings
// @route   PUT /api/v1/settings
// @access  Private/Admin
const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body; // Expecting array of { skey, sval }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array of updates.' });
    }

    await prisma.$transaction(
      updates.map(u => prisma.setting.upsert({
        where: { skey: u.skey },
        update: { sval: String(u.sval) },
        create: { skey: u.skey, sval: String(u.sval) },
      }))
    );

    await logActivity({
      userId: req.user.id,
      action: 'Update Settings',
      detail: `Updated ${updates.length} settings`,
      module: 'settings',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
