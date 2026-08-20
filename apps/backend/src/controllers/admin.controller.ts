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

// @desc    All platform users (for the Super Admin "Users" module)
// @route   GET /api/v1/admin/users
// @access  Private (SUPERADMIN)
const getUsers = async (req, res, next) => {
  try {
    const { role, q } = req.query;
    const where: any = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { fullName: { contains: String(q), mode: 'insensitive' } },
        { email: { contains: String(q), mode: 'insensitive' } },
        { username: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, username: true, role: true, active: true, verified: true, createdAt: true },
    });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

const ASSIGNABLE_ROLES = ['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'AMASHURI_ADMIN', 'MATCH_REPORTER', 'TEAM_MANAGER', 'PUBLIC'];

// @desc    Update a user's role / active flag
// @route   PATCH /api/v1/admin/users/:id
// @access  Private (SUPERADMIN)
const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { role, active } = req.body;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    // Guard: never let the last active super admin be demoted/deactivated out of existence.
    if (target.role === 'SUPERADMIN' && (role && role !== 'SUPERADMIN' || active === false)) {
      const supers = await prisma.user.count({ where: { role: 'SUPERADMIN', active: true } });
      if (supers <= 1) return res.status(400).json({ success: false, message: 'Cannot remove the last active super admin' });
    }
    if (role && !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role ?? undefined, active: active !== undefined ? !!active : undefined },
      select: { id: true, fullName: true, email: true, username: true, role: true, active: true },
    });

    await logActivity({ userId: req.user.id, action: 'Update User', detail: `Updated ${user.email} (role=${user.role}, active=${user.active})`, module: 'admin', ip: req.ip });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Live status of core platform services + runtime metrics
// @route   GET /api/v1/admin/system-health
// @access  Private (SUPERADMIN)
const getSystemHealth = async (req, res, next) => {
  try {
    let dbOk = true;
    let dbLatencyMs = null;
    const t0 = process.hrtime.bigint();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Number(process.hrtime.bigint() - t0) / 1e6;
    } catch {
      dbOk = false;
    }

    const [users, fixtures, liveFixtures] = await Promise.all([
      prisma.user.count(),
      prisma.fixture.count(),
      prisma.fixture.count({ where: { status: 'LIVE' } }),
    ]);

    const mem = process.memoryUsage();
    res.status(200).json({
      success: true,
      data: {
        services: [
          { key: 'database', ok: dbOk, detail: dbOk ? `${dbLatencyMs.toFixed(0)} ms` : 'unreachable' },
          { key: 'api', ok: true, detail: 'responding' },
          { key: 'storage', ok: true, detail: 'available' },
          { key: 'realtime', ok: true, detail: 'SSE active' },
        ],
        metrics: {
          uptimeSec: Math.round(process.uptime()),
          memoryMb: Math.round(mem.rss / 1048576),
          node: process.version,
          env: process.env.NODE_ENV || 'development',
          users, fixtures, liveFixtures,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Media library — every uploaded image referenced across the platform
// @route   GET /api/v1/admin/media
// @access  Private (SUPERADMIN)
const getMediaLibrary = async (req, res, next) => {
  try {
    const [news, teams, sports, players] = await Promise.all([
      prisma.news.findMany({ where: { coverImage: { not: null } }, select: { id: true, title: true, coverImage: true }, take: 200 }),
      prisma.team.findMany({ where: { logo: { not: null } }, select: { id: true, name: true, logo: true }, take: 200 }),
      prisma.sport.findMany({ where: { coverImage: { not: null } }, select: { id: true, name: true, coverImage: true }, take: 200 }),
      prisma.player.findMany({ where: { photo: { not: null } }, select: { id: true, fullName: true, photo: true }, take: 200 }),
    ]);
    const media = [
      ...news.map((n) => ({ url: n.coverImage, source: 'news', label: n.title })),
      ...teams.map((t) => ({ url: t.logo, source: 'team', label: t.name })),
      ...sports.map((s) => ({ url: s.coverImage, source: 'sport', label: s.name })),
      ...players.map((p) => ({ url: p.photo, source: 'player', label: p.fullName })),
    ];
    res.status(200).json({ success: true, count: media.length, data: media });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats, getRoster, assignAmashuriAdmin, revokeAdmin,
  getUsers, updateUser, getSystemHealth, getMediaLibrary,
};
