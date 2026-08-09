const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Get active ads by position
// @route   GET /api/v1/ads
// @access  Public
const getAds = async (req, res, next) => {
  try {
    const { position } = req.query;
    const ads = await prisma.ad.findMany({
      where: {
        active: true,
        position: position || undefined
      },
    });
    res.status(200).json({ success: true, data: ads });
  } catch (error) {
    next(error);
  }
};

// @desc    Create ad banner
// @route   POST /api/v1/ads
// @access  Private/Admin
const createAd = async (req, res, next) => {
  try {
    const { title, imageUrl, targetUrl, position } = req.body;

    const ad = await prisma.ad.create({
      data: { title, imageUrl, targetUrl: targetUrl || null, position },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Ad',
      detail: `Created ad banner: ${title}`,
      module: 'ads',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (deactivate) ad banner
// @route   DELETE /api/v1/ads/:id
// @access  Private/Admin
const deleteAd = async (req, res, next) => {
  try {
    const ad = await prisma.ad.update({
      where: { id: parseInt(req.params.id) },
      data: { active: false },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Delete Ad',
      detail: `Deleted ad banner: ${ad.title}`,
      module: 'ads',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Ad banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAds, createAd, deleteAd };
