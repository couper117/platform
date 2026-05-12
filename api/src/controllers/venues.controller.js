const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Get all active venues
// @route   GET /api/v1/venues
// @access  Public
const getVenues = async (req, res, next) => {
  try {
    const venues = await prisma.venue.findMany({
      where: { active: true },
    });
    res.status(200).json({ success: true, data: venues });
  } catch (error) {
    next(error);
  }
};

// @desc    Create venue
// @route   POST /api/v1/venues
// @access  Private/Admin
const createVenue = async (req, res, next) => {
  try {
    const { name, city, province, capacity, surface } = req.body;
    const venue = await prisma.venue.create({
      data: { name, city, province, capacity: parseInt(capacity), surface },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Venue',
      detail: `Created venue ${venue.name}`,
      module: 'venues',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: venue });
  } catch (error) {
    next(error);
  }
};

// @desc    Update venue
// @route   PUT /api/v1/venues/:id
// @access  Private/Admin
const updateVenue = async (req, res, next) => {
  try {
    const { name, city, province, capacity, surface, active } = req.body;
    const venue = await prisma.venue.update({
      where: { id: parseInt(req.params.id) },