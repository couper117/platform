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