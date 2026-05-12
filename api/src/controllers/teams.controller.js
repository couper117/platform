const prisma = require('../config/db');
const slugify = require('slugify');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all active teams
// @route   GET /api/v1/teams
// @access  Public
const getTeams = async (req, res, next) => {
  try {
    const { sportId, status, province } = req.query;
    
    const where = { active: true };
    if (sportId) where.sportId = parseInt(sportId);
    if (status) where.status = status;
    if (province) where.province = province;

    const teams = await prisma.team.findMany({
      where,
      include: {
        sport: true,
        _count: {
          select: { players: true, leagues: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single team
// @route   GET /api/v1/teams/:id
// @access  Public
const getTeam = async (req, res, next) => {
  try {
    let team;
    if (req.params.id === 'my') {
      if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
      team = await prisma.team.findFirst({
        where: { managerUserId: req.user.id, active: true },
        include: {
          sport: true,
          managerUser: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          players: {
            where: { active: true },
            include: { documents: true },
          },
          leagues: {
            include: { league: true },
          },
        },
      });
    } else {