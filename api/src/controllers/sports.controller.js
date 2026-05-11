const prisma = require('../config/db');
const slugify = require('slugify');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all active sports
// @route   GET /api/v1/sports
// @access  Public
const getSports = async (req, res, next) => {
  try {
    const sports = await prisma.sport.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { leagues: true, teams: true },
        },
      },
    });

    res.status(200).json({ success: true, count: sports.length, data: sports });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sport by slug
// @route   GET /api/v1/sports/:slug
// @access  Public
const getSport = async (req, res, next) => {
  try {
    const sport = await prisma.sport.findFirst({
      where: { slug: req.params.slug, active: true },
      include: {
        leagues: {
          where: { active: true },
        },
      },
    });

    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }

    res.status(200).json({ success: true, data: sport });
  } catch (error) {
    next(error);
  }
};

// @desc    Create sport
// @route   POST /api/v1/sports
// @access  Private/Admin
const createSport = async (req, res, next) => {
  try {
    const { name, icon, description, category, sortOrder } = req.body;