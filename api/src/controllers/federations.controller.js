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

    const federation = await prisma.federation.create({
      data: {
        name,
        abbreviation,
        sportId: sportId ? parseInt(sportId) : null,
        description,
        website,
        email,
        logo,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Federation',
      detail: `Created federation ${name}`,
      module: 'federations',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: federation });
  } catch (error) {
    next(error);
  }
};

// @desc    Update federation
// @route   PUT /api/v1/federations/:id
// @access  Private/Admin
const updateFederation = async (req, res, next) => {
  try {
    const { name, abbreviation, sportId, description, website, email, active } = req.body;
    let federation = await prisma.federation.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!federation) {
      return res.status(404).json({ success: false, message: 'Federation not found' });
    }

    let logo = federation.logo;
    if (req.file) {
      if (federation.logo) await deleteImage(federation.logo);
      logo = await uploadImage(req.file, 'federations', 200, 200);
    }

    federation = await prisma.federation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        abbreviation,
        sportId: sportId ? parseInt(sportId) : undefined,
        description,
        website,