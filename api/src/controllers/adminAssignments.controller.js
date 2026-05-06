const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Assign a user as a Federation Admin
// @route   POST /api/v1/admin/assign-federation-admin
// @access  Private/SuperAdmin
const assignFederationAdmin = async (req, res, next) => {
  try {
    const { email, federationId } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'PUBLIC') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'FEDERATION_ADMIN' },
      });
    }

    const assignment = await prisma.federationAdminAssignment.upsert({
      where: { federationId_userId: { federationId: parseInt(federationId), userId: user.id } },
      update: {},
      create: {
        federationId: parseInt(federationId),
        userId: user.id,
        assignedBy: req.user.id,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Assign Federation Admin',
      detail: `Assigned ${user.email} to federation ${federationId}`,
      module: 'admin',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a user as a League Admin
// @route   POST /api/v1/admin/assign-league-admin
// @access  Private/SuperAdmin or FederationAdmin
const assignLeagueAdmin = async (req, res, next) => {
  try {
    const { email, leagueId } = req.body;
    const lId = parseInt(leagueId);

    // Auth check for FEDERATION_ADMIN
    if (req.user.role === 'FEDERATION_ADMIN') {
      const league = await prisma.league.findUnique({ where: { id: lId } });
      if (!league || !league.federationId) return res.status(404).json({ success: false, message: 'League or Federation not found' });
      
      const isAssigned = await prisma.federationAdminAssignment.findUnique({
        where: { federationId_userId: { federationId: league.federationId, userId: req.user.id } }
      });
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not authorized for this federation' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'PUBLIC') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'LEAGUE_ADMIN' },
      });
    }

    const assignment = await prisma.leagueAdminAssignment.upsert({
      where: { leagueId_userId: { leagueId: lId, userId: user.id } },
      update: {},
      create: {
        leagueId: lId,
        userId: user.id,
        assignedBy: req.user.id,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Assign League Admin',
      detail: `Assigned ${user.email} to league ${leagueId}`,
      module: 'admin',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a user as a Match Reporter
// @route   POST /api/v1/leagues/:leagueId/assign-reporter
// @access  Private/LeagueAdmin
const assignReporter = async (req, res, next) => {
  try {