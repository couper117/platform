const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// Ownership rule: SUPERADMIN and LEAGUE_ADMIN may manage any team's officials.
// A TEAM_MANAGER may only manage officials of their OWN team.
const canManageTeam = (user, teamId) => {
  if (!user) return false;
  if (user.role === 'SUPERADMIN' || user.role === 'LEAGUE_ADMIN') return true;
  return user.role === 'TEAM_MANAGER' && user.managedTeam?.id === teamId;
};

// @desc    Get officials for a team
// @route   GET /api/v1/officials?teamId=1
// @access  Public
const getOfficials = async (req, res, next) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'teamId is required' });
    }

    const officials = await prisma.teamOfficial.findMany({
      where: { teamId: parseInt(teamId) },
      orderBy: { role: 'asc' },
    });

    res.status(200).json({ success: true, data: officials });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a team official
// @route   POST /api/v1/officials
// @access  Private (own team or admin)
const createOfficial = async (req, res, next) => {
  try {
    const { teamId, role, fullName, phone, email, idNumber } = req.body;

    if (!teamId || !fullName) {
      return res.status(400).json({ success: false, message: 'teamId and fullName are required' });
    }

    const tid = parseInt(teamId);

    if (!canManageTeam(req.user, tid)) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this team' });
    }

    const official = await prisma.teamOfficial.create({
      data: {
        teamId: tid,
        role: role || 'OTHER',
        fullName,
        phone,
        email,
        idNumber,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Team Official',
      detail: `${fullName} for team ${teamId}`,
      module: 'officials',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: official });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a team official
// @route   PATCH /api/v1/officials/:id
// @access  Private (own team or admin)
const updateOfficial = async (req, res, next) => {
  try {
    const official = await prisma.teamOfficial.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!official) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    if (!canManageTeam(req.user, official.teamId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this team' });
    }

    const { role, fullName, phone, email, idNumber } = req.body;
    const data: any = {};
    if (role !== undefined) data.role = role;
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (idNumber !== undefined) data.idNumber = idNumber;

    const updated = await prisma.teamOfficial.update({
      where: { id: official.id },
      data,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a team official (hard delete)
// @route   DELETE /api/v1/officials/:id
// @access  Private (own team or admin)
const deleteOfficial = async (req, res, next) => {
  try {
    const official = await prisma.teamOfficial.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!official) {
      return res.status(404).json({ success: false, message: 'Official not found' });
    }

    if (!canManageTeam(req.user, official.teamId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this team' });
    }

    await prisma.teamOfficial.delete({ where: { id: official.id } });

    res.status(200).json({ success: true, message: 'Official removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOfficials, createOfficial, updateOfficial, deleteOfficial };
