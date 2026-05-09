const prisma = require('../config/db');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all active federations
// @route   GET /api/v1/federations
// @access  Public
const getFederations = async (req, res, next) => {
  try {
    const federations = await prisma.federation.findMany({
      where: { active: true },
      include: { sport: true },
    });

    res.status(200).json({ success: true, count: federations.length, data: federations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single federation
// @route   GET /api/v1/federations/:id
// @access  Public
const getFederation = async (req, res, next) => {
  try {
    const federation = await prisma.federation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { sport: true, leagues: true },
    });

    if (!federation || !federation.active) {
      return res.status(404).json({ success: false, message: 'Federation not found' });
    }

    res.status(200).json({ success: true, data: federation });
  } catch (error) {
    next(error);
  }
};

// @desc    Create federation
// @route   POST /api/v1/federations
// @access  Private/Admin
const createFederation = async (req, res, next) => {
  try {
    const { name, abbreviation, sportId, description, website, email } = req.body;
    let logo = null;

    if (req.file) {
      logo = await uploadImage(req.file, 'federations', 200, 200);
    }
