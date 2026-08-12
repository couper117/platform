const prisma = require('../config/db');
const { uniqueSlug } = require('../utils/slug');
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

    // Fixtures belong to leagues, which belong to a sport — so a sport's match
    // count is derived (the landing's sport cards show "N matches"). Small N of
    // sports, so a count per sport is fine.
    const withMatches = await Promise.all(
      sports.map(async (s) => ({
        ...s,
        _count: { ...s._count, matches: await prisma.fixture.count({ where: { league: { sportId: s.id } } }) },
      }))
    );

    res.status(200).json({ success: true, count: withMatches.length, data: withMatches });
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
    let coverImage = null;

    if (req.file) {
      coverImage = await uploadImage(req.file, 'sports', 800, 450);
    }

    const sport = await prisma.sport.create({
      data: {
        name,
        slug: await uniqueSlug('sport', name),
        icon,
        description,
        category,
        sortOrder: parseInt(sortOrder) || 0,
        coverImage,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Sport',
      detail: `Created sport ${name}`,
      module: 'sports',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: sport });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sport
// @route   PUT /api/v1/sports/:id
// @access  Private/Admin
const updateSport = async (req, res, next) => {
  try {
    const { name, icon, description, category, sortOrder, active } = req.body;
    let sport = await prisma.sport.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }

    let coverImage = sport.coverImage;
    if (req.file) {
      if (sport.coverImage) await deleteImage(sport.coverImage);
      coverImage = await uploadImage(req.file, 'sports', 800, 450);
    }

    sport = await prisma.sport.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        slug: name ? await uniqueSlug('sport', name, parseInt(req.params.id)) : undefined,
        icon,
        description,
        category,
        sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
        active: active !== undefined ? (active === 'true' || active === true) : undefined,
        coverImage,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Update Sport',
      detail: `Updated sport ${sport.name}`,
      module: 'sports',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: sport });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete sport (soft delete)
// @route   DELETE /api/v1/sports/:id
// @access  Private/Admin
const deleteSport = async (req, res, next) => {
  try {
    const sport = await prisma.sport.update({
      where: { id: parseInt(req.params.id) },
      data: { active: false },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Delete Sport',
      detail: `Soft-deleted sport ${sport.name}`,
      module: 'sports',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Sport deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSports,
  getSport,
  createSport,
  updateSport,
  deleteSport,
};
