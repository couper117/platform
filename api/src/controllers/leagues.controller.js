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
const createLeague = async (req, res, next) => {
  try {
    const { 
      name, sportId, federationId, season, gender, 
      ageCategory, level, format, status, maxTeams, 
      description, startDate, endDate 
    } = req.body;

    const league = await prisma.league.create({
      data: {
        name,
        slug: slugify(name, { lower: true }),
        sportId: parseInt(sportId),
        federationId: federationId ? parseInt(federationId) : null,
        season,
        gender,
        ageCategory,
        level,
        format,
        status,
        maxTeams: parseInt(maxTeams) || 16,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create League',
      detail: `Created league ${name}`,
      module: 'leagues',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: league });
  } catch (error) {
    next(error);
  }
};

// @desc    Update league
// @route   PUT /api/v1/leagues/:id
// @access  Private/Admin
const updateLeague = async (req, res, next) => {
  try {
    const { 
      name, sportId, federationId, season, gender, 
      ageCategory, level, format, status, maxTeams, 
      description, startDate, endDate, active 
    } = req.body;

    const league = await prisma.league.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        slug: name ? slugify(name, { lower: true }) : undefined,
        sportId: sportId ? parseInt(sportId) : undefined,
        federationId: federationId ? parseInt(federationId) : undefined,
        season,
        gender,
        ageCategory,
        level,