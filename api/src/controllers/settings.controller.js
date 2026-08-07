const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const { ensureRuleSettings } = require('../services/eligibility.service');

// @desc    Get all public settings
// @route   GET /api/v1/settings
// @access  Public
const getSettings = async (req, res, next) => {
  try {
    // Only expose settings flagged public on this unauthenticated endpoint.
    const settings = await prisma.setting.findMany({ where: { isPublic: true } });
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.skey] = s.sval;
    });
    res.status(200).json({ success: true, data: settingsMap });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all settings (incl. private, e.g. competition rules) for admins
// @route   GET /api/v1/settings/all
// @access  Private/Admin
const getAllSettings = async (req, res, next) => {
  try {
    await ensureRuleSettings(); // make sure the rule rows exist to edit
    const settings = await prisma.setting.findMany({ orderBy: [{ grp: 'asc' }, { skey: 'asc' }] });
    res.status(200).json({ success: true, data: settings });
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

module.exports = { getSettings, getAllSettings, updateSettings };
