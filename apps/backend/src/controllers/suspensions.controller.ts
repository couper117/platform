const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

const getSuspensions = async (req, res, next) => {
  try {
    const where: any = {};

    if (req.query.playerId) {
      where.playerId = parseInt(req.query.playerId);
    }

    if (req.query.active === 'true') {
      where.active = true;
    } else if (req.query.active === 'false') {
      where.active = false;
    }

    const rows = await prisma.suspension.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { player: { select: { id: true, fullName: true } } },
    });

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const createSuspension = async (req, res, next) => {
  try {
    const { playerId, reason, matches, note } = req.body;

    if (!playerId) {
      return res.status(400).json({ success: false, message: 'playerId is required' });
    }

    const player = await prisma.player.findUnique({ where: { id: parseInt(playerId) } });

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const [suspension] = await prisma.$transaction([
      prisma.suspension.create({
        data: {
          playerId: parseInt(playerId),
          reason: reason || 'MISCONDUCT',
          matches: parseInt(matches) || 1,
          note: note || null,
        },
      }),
      prisma.player.update({
        where: { id: parseInt(playerId) },
        data: { status: 'SUSPENDED' },
      }),
    ]);

    await logActivity({
      userId: req.user.id,
      action: 'Create Suspension',
      detail: `Player ${playerId} suspended ${matches || 1} match(es)`,
      module: 'discipline',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: suspension });
  } catch (error) {
    next(error);
  }
};

const liftSuspension = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const suspension = await prisma.suspension.findUnique({ where: { id } });

    if (!suspension) {
      return res.status(404).json({ success: false, message: 'Suspension not found' });
    }

    const updated = await prisma.suspension.update({
      where: { id },
      data: { active: false, matchesServed: suspension.matches },
    });

    const otherActive = await prisma.suspension.count({
      where: { playerId: suspension.playerId, active: true },
    });

    if (otherActive === 0) {
      await prisma.player.update({
        where: { id: suspension.playerId },
        data: { status: 'VERIFIED' },
      });
    }

    await logActivity({
      userId: req.user.id,
      action: 'Lift Suspension',
      detail: `Suspension ${req.params.id} lifted`,
      module: 'discipline',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSuspensions, createSuspension, liftSuspension };
