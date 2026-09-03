const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const { ensureRuleSettings } = require('../services/eligibility.service');

// Everything the AI assistant owns is namespaced `ai.`, and the sealed provider
// credentials sit under `ai.apiKey.`. Both are named here so this generic
// settings editor can keep its hands off them — see getAllSettings/updateSettings.
const AI_PREFIX = 'ai.';
const AI_KEY_PREFIX = 'ai.apiKey.';

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

    // AI provider credentials live in this table too, sealed. They are not
    // settings anyone edits from here — AI Configuration owns them, and it never
    // shows a key either — so the ciphertext is dropped rather than handed to a
    // generic editor that would happily write it back as plain text.
    const safe = settings.map((s) =>
      s.skey.startsWith(AI_KEY_PREFIX) ? { ...s, sval: null, label: s.label || 'Managed in AI Configuration' } : s
    );

    res.status(200).json({ success: true, data: safe });
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

    // This endpoint writes whatever key it is given, as plain text. The AI
    // settings are validated (temperature bounds, known providers) and their
    // credentials encrypted by AI Configuration, so letting them through here
    // would be a way to store an unencrypted API key or an out-of-range value.
    if (updates.some((u) => String(u.skey || '').startsWith(AI_PREFIX))) {
      return res.status(400).json({
        success: false,
        message: 'AI settings are managed in AI Configuration, not here.',
      });
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
