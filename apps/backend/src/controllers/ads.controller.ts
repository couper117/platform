const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Get active ads by position
// @route   GET /api/v1/ads
// @access  Public
const getAds = async (req, res, next) => {
  try {
    const { position } = req.query;
    const now = new Date();

    // A campaign that has not started, or has finished, is not live — however the
    // `active` flag is set. Without dates the only way to end a sponsorship was
    // for somebody to switch it off by hand, which in practice means a campaign
    // that keeps running after it was paid for.
    const ads = await prisma.ad.findMany({
      where: {
        active: true,
        position: position || undefined,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
    });

    // Served means seen. Counted here rather than from a tracking pixel, because
    // a pixel is blocked for a large share of the audience and a sponsor's report
    // should not quietly under-count. Fire-and-forget: a metric must never delay
    // or fail the response that carries the advert.
    if (ads.length) {
      prisma.ad
        .updateMany({ where: { id: { in: ads.map((a) => a.id) } }, data: { impressions: { increment: 1 } } })
        .catch(() => { /* the advert was still served */ });
    }

    res.status(200).json({ success: true, data: ads });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a click and hand back where to go
// @route   POST /api/v1/ads/:id/click
// @access  Public
const recordClick = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const ad = await prisma.ad.findUnique({ where: { id }, select: { id: true, targetUrl: true } });
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

    await prisma.ad.update({ where: { id }, data: { clicks: { increment: 1 } } });
    res.status(200).json({ success: true, data: { targetUrl: ad.targetUrl } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create ad banner
// @route   POST /api/v1/ads
// @access  Private/Admin
const createAd = async (req, res, next) => {
  try {
    const { title, imageUrl, targetUrl, position, startsAt, endsAt } = req.body;

    const ad = await prisma.ad.create({
      data: {
        title,
        imageUrl,
        targetUrl: targetUrl || null,
        position,
        // A sponsorship has dates. Null means unbounded at that end.
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Ad',
      detail: `Created ad banner: ${title}`,
      module: 'ads',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ad banner (edit / restore)
// @route   PUT /api/v1/ads/:id
// @access  Private/Admin
const updateAd = async (req, res, next) => {
  try {
    const { title, imageUrl, targetUrl, position, active, startsAt, endsAt } = req.body;
    const ad = await prisma.ad.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: title ?? undefined,
        imageUrl: imageUrl ?? undefined,
        targetUrl: targetUrl !== undefined ? (targetUrl || null) : undefined,
        position: position ?? undefined,
        active: active !== undefined ? !!active : undefined,
        startsAt: startsAt === undefined ? undefined : (startsAt ? new Date(startsAt) : null),
        endsAt: endsAt === undefined ? undefined : (endsAt ? new Date(endsAt) : null)
      },
    });
    await logActivity({ userId: req.user.id, action: 'Update Ad', detail: `Updated ad banner: ${ad.title}`, module: 'ads', ip: req.ip });
    res.status(200).json({ success: true, data: ad });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (deactivate) ad banner
// @route   DELETE /api/v1/ads/:id
// @access  Private/Admin
const deleteAd = async (req, res, next) => {
  try {
    const ad = await prisma.ad.update({
      where: { id: parseInt(req.params.id) },
      data: { active: false },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Delete Ad',
      detail: `Deleted ad banner: ${ad.title}`,
      module: 'ads',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Ad banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordClick, getAds, createAd, updateAd, deleteAd };
