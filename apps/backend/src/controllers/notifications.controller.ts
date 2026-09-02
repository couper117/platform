/**
 * Reading your notifications.
 *
 * Same identity rule as favourites: a signed-in account, or this browser's
 * anonymous token. See favorites.controller.ts for why the anonymous path
 * exists at all.
 */

const prisma = require('../config/db');

const ANON_TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

const recipientOf = (req) => {
  if (req.user?.id) return { userId: req.user.id };
  const raw = String(req.headers['x-anon-id'] || '').trim();
  return ANON_TOKEN.test(raw) ? { anonToken: raw } : null;
};

// @desc    Your notifications, newest first
// @route   GET /api/v1/notifications
// @access  Public (signed in, or with an anonymous token)
const getNotifications = async (req, res, next) => {
  try {
    const who = recipientOf(req);
    if (!who) return res.status(200).json({ success: true, count: 0, unread: 0, data: [] });

    const unreadOnly = String(req.query.unread || '') === 'true';
    const where = { ...who, ...(unreadOnly ? { readAt: null } : {}) };

    const [rows, unread] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.notification.count({ where: { ...who, readAt: null } }),
    ]);

    res.status(200).json({ success: true, count: rows.length, unread, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark one as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Public (owner only)
const markRead = async (req, res, next) => {
  try {
    const who = recipientOf(req);
    if (!who) return res.status(400).json({ success: false, message: 'Nothing to mark.' });

    // Scoped by recipient, so an id from someone else's list matches nothing
    // rather than marking their notification read.
    const { count } = await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), ...who, readAt: null },
      data: { readAt: new Date() },
    });

    const unread = await prisma.notification.count({ where: { ...who, readAt: null } });
    res.status(200).json({ success: true, data: { marked: count, unread } });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark everything as read
// @route   POST /api/v1/notifications/read-all
// @access  Public (owner only)
const markAllRead = async (req, res, next) => {
  try {
    const who = recipientOf(req);
    if (!who) return res.status(200).json({ success: true, data: { marked: 0, unread: 0 } });

    const { count } = await prisma.notification.updateMany({
      where: { ...who, readAt: null },
      data: { readAt: new Date() },
    });
    res.status(200).json({ success: true, data: { marked: count, unread: 0 } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
