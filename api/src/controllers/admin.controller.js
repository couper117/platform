const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Federations (each = a sport) with their assigned admins + the Amashuri admins
// @route   GET /api/v1/admin/roster
// @access  Private (SUPERADMIN)
const getRoster = async (req, res, next) => {
  try {
    const federations = await prisma.federation.findMany({
      orderBy: { name: 'asc' },
      include: {
        sport: { select: { id: true, name: true, slug: true, icon: true } },
        admins: {
          include: { user: { select: { id: true, fullName: true, email: true, username: true } } },
        },
      },
    });
    const amashuriAdmins = await prisma.user.findMany({
      where: { role: 'AMASHURI_ADMIN' },
      select: { id: true, fullName: true, email: true, username: true },
    });
    res.status(200).json({ success: true, data: { federations, amashuriAdmins } });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a user as the Amashuri (inter-school games) admin
// @route   POST /api/v1/admin/assign-amashuri-admin
// @access  Private (SUPERADMIN)
const assignAmashuriAdmin = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'SUPERADMIN') {
      return res.status(400).json({ success: false, message: 'User is already a super admin' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'AMASHURI_ADMIN' },
      select: { id: true, fullName: true, email: true, username: true, role: true },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Assign Amashuri Admin',
      detail: `Assigned ${user.email} as Amashuri admin`,
      module: 'admin',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an admin assignment (federation admin or Amashuri admin) → back to PUBLIC
// @route   POST /api/v1/admin/revoke-admin
// @access  Private (SUPERADMIN)
const revokeAdmin = async (req, res, next) => {
  try {
    const { userId, federationId } = req.body;
    const uid = parseInt(userId);
    if (federationId) {
      await prisma.federationAdminAssignment.deleteMany({ where: { userId: uid, federationId: parseInt(federationId) } });
    }
    // If the user has no remaining federation/amashuri privileges, drop to PUBLIC.
    const remaining = await prisma.federationAdminAssignment.count({ where: { userId: uid } });
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (user && user.role !== 'SUPERADMIN' && remaining === 0) {
      await prisma.user.update({ where: { id: uid }, data: { role: 'PUBLIC' } });
    }
    res.status(200).json({ success: true, message: 'Admin access revoked' });
  } catch (error) {
    next(error);
  }
};

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

module.exports = { getAdminStats, getRoster, assignAmashuriAdmin, revokeAdmin };
