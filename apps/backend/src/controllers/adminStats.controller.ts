const prisma = require('../config/db');

// @desc    Get platform-wide summary stats for the admin dashboard
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
  try {
    const [activeLeagues, totalTeams, totalPlayers, pendingDocuments] = await prisma.$transaction([
      prisma.league.count({ where: { status: 'ACTIVE' } }),
      prisma.team.count(),
      prisma.player.count({ where: { active: true } }),
      prisma.playerDocument.count({ where: { status: 'PENDING' } }),
    ]);

    res.status(200).json({
      success: true,
      data: { activeLeagues, totalTeams, totalPlayers, pendingDocuments },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
