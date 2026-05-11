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