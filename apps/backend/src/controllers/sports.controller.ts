const prisma = require('../config/db');
const { can } = require('../services/capabilities.rules');
const { uniqueSlug } = require('../utils/slug');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all active sports
// @route   GET /api/v1/sports
// @access  Public
const getSports = async (req, res, next) => {
  try {
    // The public list is the active sports. Whoever manages them needs to see the
    // ones that are switched off too — otherwise deactivating a sport hides it
    // from the only page that could switch it back on.
    const includeInactive =
      String(req.query.includeInactive || '') === 'true' && can(req.user, 'sports.write');

    const sports = await prisma.sport.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        // A sport is governed by its federation, so the list has to say which
        // one — presenting sports as an unowned registry hides the body actually
        // responsible for each.
        federations: { select: { id: true, name: true, abbreviation: true }, take: 3 },
        _count: {
          select: { leagues: true, teams: true, federations: true },
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
      coverImage = await uploadImage(req.file, 'sports', 800, 450, { uploadedById: req.user?.id, purpose: 'cover' });
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
/**
 * Fields a federation may maintain for the sport it governs.
 *
 * A sport is run by its federation, so how that sport is described and
 * presented is theirs to keep current rather than something to route through the
 * ministry. What stays central is the sport's existence and its `type`: that
 * decides the terminology, competition formats and result handling every other
 * admin page derives from it, so changing it reshapes the platform rather than
 * describing one sport.
 */
const FEDERATION_EDITABLE = ['description', 'icon', 'coverImage'];

const updateSport = async (req, res, next) => {
  try {
    if (req.user?.role === 'FEDERATION_ADMIN') {
      const id = parseInt(req.params.id);
      if (req.user.sportId == null || Number(req.user.sportId) !== id) {
        return res.status(403).json({ success: false, message: 'Not authorized for this sport' });
      }
      const attempted = Object.keys(req.body || {}).filter(
        (k) => !FEDERATION_EDITABLE.includes(k) && req.body[k] !== undefined,
      );
      if (attempted.length) {
        return res.status(403).json({
          success: false,
          message: `A federation maintains how its sport is described. ${attempted.join(', ')} ${attempted.length === 1 ? 'is' : 'are'} set centrally.`,
        });
      }
    }

    const { name, icon, description, category, sortOrder, active } = req.body;
    let sport = await prisma.sport.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }

    let coverImage = sport.coverImage;
    if (req.file) {
      if (sport.coverImage) await deleteImage(sport.coverImage);
      coverImage = await uploadImage(req.file, 'sports', 800, 450, { uploadedById: req.user?.id, purpose: 'cover' });
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
