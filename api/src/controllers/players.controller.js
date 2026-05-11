const prisma = require('../config/db');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all players
// @route   GET /api/v1/players
// @access  Private (Admin)
const getPlayers = async (req, res, next) => {
  try {
    const { teamId, status } = req.query;
    const where = { active: true };
    if (teamId) where.teamId = parseInt(teamId);
    if (status) where.status = status;

    const players = await prisma.player.findMany({
      where,
      include: {
        team: true,
        documents: true,
      },
      orderBy: { fullName: 'asc' },
    });

    res.status(200).json({ success: true, count: players.length, data: players });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single player
// @route   GET /api/v1/players/:id
// @access  Public
const getPlayer = async (req, res, next) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        team: true,
        documents: true,
      },
    });

    if (!player || !player.active) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    res.status(200).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

// @desc    Add player to team
// @route   POST /api/v1/players
// @access  Private (Team Manager or Admin)
const createPlayer = async (req, res, next) => {
  try {
    const { teamId, fullName, dateOfBirth, nationality, position, jerseyNumber, skillLevel, gender, height, weight, bio } = req.body;
    
    // Auth check
    const team = await prisma.team.findUnique({ where: { id: parseInt(teamId) } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    
    if (req.user.role !== 'SUPERADMIN' && req.user.id !== team.managerUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to add players to this team' });
    }

    let photo = null;
    if (req.file) {
      photo = await uploadImage(req.file, 'players', 400, 400);
    }

    const player = await prisma.player.create({
      data: {
        teamId: parseInt(teamId),
        fullName,
        photo,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality,
        position,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
        skillLevel,
        gender,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        bio,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Player',
      detail: `Created player ${fullName} in team ${team.name}`,
      module: 'players',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

// @desc    Update player
// @route   PUT /api/v1/players/:id
// @access  Private (Team Manager or Admin)
const updatePlayer = async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id);
    let player = await prisma.player.findUnique({ 
      where: { id: playerId },
      include: { team: true }
    });

    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

    if (req.user.role !== 'SUPERADMIN' && req.user.id !== player.team.managerUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this player' });
    }

    const { fullName, dateOfBirth, nationality, position, jerseyNumber, skillLevel, gender, height, weight, bio, active } = req.body;

    let photo = player.photo;
    if (req.file) {
      if (player.photo) await deleteImage(player.photo);
      photo = await uploadImage(req.file, 'players', 400, 400);
    }

    player = await prisma.player.update({
      where: { id: playerId },
      data: {
        fullName,
        photo,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        nationality,
        position,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
        skillLevel,
        gender,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        bio,
        active: active !== undefined ? (active === 'true' || active === true) : undefined,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Update Player',
      detail: `Updated player ${player.fullName}`,
      module: 'players',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
};
