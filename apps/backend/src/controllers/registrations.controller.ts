const prisma = require('../config/db');
const { enforceLeagueScope } = require('../utils/scope');
const logActivity = require('../utils/activityLogger');

// @desc    List team registrations (newest first), optional leagueId / status filters
// @route   GET /api/v1/registrations
// @access  Private (SUPERADMIN, LEAGUE_ADMIN, FEDERATION_ADMIN)
const getRegistrations = async (req, res, next) => {
  try {
    const where: any = {};
    if (req.query.leagueId) where.leagueId = parseInt(String(req.query.leagueId));
    if (req.query.status) {
      const status = String(req.query.status);
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        where.status = status;
      }
    }

    const registrations = await prisma.teamRegistration.findMany({
      where,
      include: {
        team: { select: { id: true, name: true } },
        league: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    next(error);
  }
};

// @desc    A team requests to join a league (status PENDING)
// @route   POST /api/v1/registrations
// @access  Private (ownership enforced in controller)
const createRegistration = async (req, res, next) => {
  try {
    const { teamId, leagueId, notes } = req.body;

    if (!teamId || !leagueId) {
      return res.status(400).json({ success: false, message: 'teamId and leagueId are required' });
    }

    const parsedTeamId = parseInt(teamId);
    const parsedLeagueId = parseInt(leagueId);

    // Ownership: a TEAM_MANAGER may only register their own team.
    // SUPERADMIN / LEAGUE_ADMIN may register any team.
    if (req.user.role === 'TEAM_MANAGER') {
      if (req.user.managedTeam?.id !== parsedTeamId) {
        return res.status(403).json({ success: false, message: 'You may only register your own team' });
      }
    } else if (!['SUPERADMIN', 'LEAGUE_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to register a team' });
    }

    try {
      const registration = await prisma.teamRegistration.create({
        data: {
          teamId: parsedTeamId,
          leagueId: parsedLeagueId,
          status: 'PENDING',
          notes: notes ?? null,
        },
      });

      await logActivity({
        userId: req.user.id,
        action: 'Submit Registration',
        detail: `Team ${teamId} → league ${leagueId}`,
        module: 'registrations',
        ip: req.ip,
      });

      res.status(201).json({ success: true, data: registration });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'This team is already registered for that league' });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a registration; on approval, admit the team into the league
// @route   PATCH /api/v1/registrations/:id/review
// @access  Private (SUPERADMIN, LEAGUE_ADMIN)
const reviewRegistration = async (req, res, next) => {
  try {
    const { decision, notes } = req.body;

    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      return res.status(400).json({ success: false, message: "decision must be 'APPROVED' or 'REJECTED'" });
    }

    const id = parseInt(req.params.id);

    const registration = await prisma.teamRegistration.findUnique({ where: { id } });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Accepting a club into a competition is that competition's decision.
    if (!(await enforceLeagueScope(req, res, registration.leagueId))) return;

    const [updated] = await prisma.$transaction([
      prisma.teamRegistration.update({
        where: { id },
        data: {
          status: decision,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          notes: notes ?? registration.notes,
        },
      }),
      ...(decision === 'APPROVED'
        ? [
            prisma.leagueTeam.upsert({
              where: {
                leagueId_teamId: {
                  leagueId: registration.leagueId,
                  teamId: registration.teamId,
                },
              },
              create: {
                leagueId: registration.leagueId,
                teamId: registration.teamId,
              },
              update: {},
            }),
          ]
        : []),
    ]);

    await logActivity({
      userId: req.user.id,
      action: `Registration ${decision}`,
      detail: `Registration ${req.params.id}`,
      module: 'registrations',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRegistrations, createRegistration, reviewRegistration };
