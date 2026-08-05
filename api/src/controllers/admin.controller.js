const prisma = require('../config/db');

// @desc    Aggregate dashboard counters + recent activity
// @route   GET /api/v1/admin/stats
// @access  Private (SUPERADMIN | LEAGUE_ADMIN | FEDERATION_ADMIN)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      leagues, teams, players, pendingTeams, pendingDocs,
      liveFixtures, unreadContacts, recentActivity, upcomingFixtures,
    ] = await Promise.all([
      prisma.league.count({ where: { active: true } }),
      prisma.team.count({ where: { active: true } }),
      prisma.player.count({ where: { active: true } }),
      prisma.team.count({ where: { status: 'PENDING' } }),
      prisma.playerDocument.count({ where: { status: 'PENDING' } }),
      prisma.fixture.count({ where: { status: 'LIVE' } }),
      prisma.contact.count({ where: { status: 'NEW' } }),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.fixture.findMany({
        where: { status: 'SCHEDULED' },
        take: 5,
        orderBy: { matchDate: 'asc' },
        include: { homeTeam: true, awayTeam: true, league: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        leagues, teams, players, pendingTeams, pendingDocs,
        liveFixtures, unreadContacts, recentActivity, upcomingFixtures,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminStats };
