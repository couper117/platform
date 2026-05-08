const prisma = require('../config/db');
const { uploadImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all documents
// @route   GET /api/v1/documents
// @access  Private (Admin)
const getDocuments = async (req, res, next) => {
  try {
    const { status, playerId, teamId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (playerId) where.playerId = parseInt(playerId);
    if (teamId) where.player = { teamId: parseInt(teamId) };

    const documents = await prisma.playerDocument.findMany({
      where,
      include: {
        player: {
          include: { team: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.status(200).json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload player document
// @route   POST /api/v1/documents/upload
// @access  Private (Team Manager)
const uploadDocument = async (req, res, next) => {
  try {
    const { playerId, docType } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const player = await prisma.player.findUnique({
      where: { id: parseInt(playerId) },
      include: { team: true },
    });

    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
