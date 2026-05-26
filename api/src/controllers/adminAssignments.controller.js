const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Assign a user as a League Admin
// @route   POST /api/v1/admin/assign-league-admin
// @access  Private/SuperAdmin
const assignLeagueAdmin = async (req, res, next) => {
  try {
    const { email, leagueId } = req.body;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email not found' });
    }

    // Promote to League Admin if they are just Public
    if (user.role === 'PUBLIC') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'LEAGUE_ADMIN' },
      });
    }

    const assignment = await prisma.leagueAdminAssignment.upsert({
      where: {
        leagueId_userId: {
          leagueId: parseInt(leagueId),
          userId: user.id,
        },
      },
      update: {},
      create: {
        leagueId: parseInt(leagueId),
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
    const { email, fixtureId } = req.body;
    const leagueId = parseInt(req.params.leagueId);

    // Verify req.user is an admin for this league
    const isAdmin = await prisma.leagueAdminAssignment.findUnique({
      where: {
        leagueId_userId: { leagueId, userId: req.user.id }
      }
    });

    if (!isAdmin && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to assign reporters for this league' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email not found' });
    }

    // Promote to Match Reporter if they are just Public
    if (user.role === 'PUBLIC') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MATCH_REPORTER' },
      });
    }

    const assignment = await prisma.reporterAssignment.create({
      data: {
        leagueId: leagueId,
        fixtureId: fixtureId ? parseInt(fixtureId) : null,
        userId: user.id,
        assignedBy: req.user.id,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Assign Match Reporter',
      detail: `Assigned ${user.email} as reporter for ${fixtureId ? 'fixture ' + fixtureId : 'league ' + leagueId}`,
      module: 'league-admin',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignLeagueAdmin,
  assignReporter,
};
