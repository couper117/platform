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
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
      
      team = await prisma.team.findUnique({
        where: { id },
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
    }

    if (!team || !team.active) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

// @desc    Create team (Admin only)
// @route   POST /api/v1/teams
// @access  Private/Admin
const createTeam = async (req, res, next) => {
  try {
    const { name, shortName, sportId, foundedYear, homeVenue, city, province, description, email, phone, website, managerUserId } = req.body;
    let logo = null;

    if (req.file) {
      logo = await uploadImage(req.file, 'teams', 200, 200);
    }

    const team = await prisma.team.create({
      data: {
        name,
        shortName,
        slug: slugify(name, { lower: true }),
        sportId: sportId ? parseInt(sportId) : null,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        homeVenue,
        city,
        province,
        description,
        email,
        phone,
        website,
        managerUserId: managerUserId ? parseInt(managerUserId) : null,
        status: 'VERIFIED',
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Team',
      detail: `Created team ${name}`,
      module: 'teams',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team
// @route   PUT /api/v1/teams/:id
// @access  Private/Admin or Owner
const updateTeam = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id);
    let team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Authorization check: Admin or Team Manager
    if (req.user.role !== 'SUPERADMIN' && req.user.id !== team.managerUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this team' });
    }

    const { name, shortName, sportId, foundedYear, homeVenue, city, province, description, email, phone, website, active } = req.body;

    let logo = team.logo;
    if (req.file) {
      if (team.logo) await deleteImage(team.logo);
      logo = await uploadImage(req.file, 'teams', 200, 200);
    }

    team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        shortName,
        slug: name ? slugify(name, { lower: true }) : undefined,
        sportId: sportId ? parseInt(sportId) : undefined,
        foundedYear: foundedYear ? parseInt(foundedYear) : undefined,
        homeVenue,
        city,
        province,
        description,
        email,
        phone,
        website,