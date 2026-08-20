const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    List transfers (newest first), optional playerId / teamId filters
// @route   GET /api/v1/transfers
// @access  Private (Admin)
const getTransfers = async (req, res, next) => {
  try {
    const where: any = {};
    if (req.query.playerId) where.playerId = parseInt(String(req.query.playerId));
    if (req.query.teamId) {
      const teamId = parseInt(String(req.query.teamId));
      where.OR = [{ fromTeamId: teamId }, { toTeamId: teamId }];
    }

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        player: { select: { id: true, fullName: true } },
        fromTeam: { select: { id: true, name: true } },
        toTeam: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a transfer and move the player to the destination team
// @route   POST /api/v1/transfers
// @access  Private (Admin)
const createTransfer = async (req, res, next) => {
  try {
    const { playerId, toTeamId, fromTeamId, transferType, transferDate, fee, notes } = req.body;

    if (!playerId || !toTeamId) {
      return res.status(400).json({ success: false, message: 'playerId and toTeamId are required' });
    }

    const player = await prisma.player.findUnique({ where: { id: parseInt(playerId) } });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const resolvedFromTeamId =
      fromTeamId !== undefined && fromTeamId !== null ? parseInt(fromTeamId) : player.teamId;

    const [transfer] = await prisma.$transaction([
      prisma.transfer.create({
        data: {
          playerId: parseInt(playerId),
          toTeamId: parseInt(toTeamId),
          fromTeamId: resolvedFromTeamId !== null && resolvedFromTeamId !== undefined ? parseInt(resolvedFromTeamId) : null,
          transferType: transferType || 'PERMANENT',
          transferDate: transferDate ? new Date(transferDate) : null,
          fee: fee !== undefined && fee !== null ? Number(fee) : null,
          notes: notes || null,
        },
      }),
      prisma.player.update({
        where: { id: parseInt(playerId) },
        data: { teamId: parseInt(toTeamId) },
      }),
    ]);

    await logActivity({
      userId: req.user.id,
      action: 'Create Transfer',
      detail: `Player ${playerId} → team ${toTeamId}`,
      module: 'transfers',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransfers, createTransfer };
