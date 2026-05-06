const prisma = require('../config/db');

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

module.exports = { getAds };
