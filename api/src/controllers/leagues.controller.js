const prisma = require('../config/db');
const slugify = require('slugify');
const logActivity = require('../utils/activityLogger');

// @desc    Get all active leagues
// @route   GET /api/v1/leagues
// @access  Public
const getLeagues = async (req, res, next) => {
  try {
    const { sportId, gender, level, status } = req.query;
    
    const where = { active: true };
    if (sportId) where.sportId = parseInt(sportId);
    if (gender) where.gender = gender;
    if (level) where.level = level;
    if (status) where.status = status;

    const leagues = await prisma.league.findMany({
      where,
      include: {
        sport: true,
        federation: true,
        _count: {
          select: { teams: true, fixtures: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, count: leagues.length, data: leagues });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single league
// @route   GET /api/v1/leagues/:id
// @access  Public
const getLeague = async (req, res, next) => {
  try {
    const league = await prisma.league.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sport: true,
        federation: true,
        teams: {
          include: { team: true },
        },
      },
    });

    if (!league || !league.active) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    res.status(200).json({ success: true, data: league });
  } catch (error) {
    next(error);
  }
};

// @desc    Create league
// @route   POST /api/v1/leagues
// @access  Private/Admin