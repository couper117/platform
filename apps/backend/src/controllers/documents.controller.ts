const prisma = require('../config/db');
const { uploadImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');
const { REQUIRED_DOC_TYPES } = require('../constants/documentRequirements');

// @desc    Get which document types are required for player verification
// @route   GET /api/v1/documents/requirements
// @access  Public
const getRequirements = async (req, res) => {
  res.status(200).json({ success: true, data: { requiredDocTypes: REQUIRED_DOC_TYPES } });
};

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

    if (req.user.role !== 'SUPERADMIN' && req.user.id !== player.team.managerUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const fileUrl = await uploadImage(req.file, 'documents', 800, 800);

    const document = await prisma.playerDocument.create({
      data: {
        playerId: parseInt(playerId),
        docType,
        filename: fileUrl,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'PENDING',
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Upload Document',
      detail: `Uploaded ${docType} for player ${player.fullName}`,
      module: 'documents',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

// @desc    Review document (Approve/Reject)
// @route   PUT /api/v1/documents/:id/review
// @access  Private (Admin)
const reviewDocument = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    const docId = parseInt(req.params.id);

    const document = await prisma.playerDocument.update({
      where: { id: docId },
      data: {
        status,
        reviewNote,
        reviewedBy: req.user.id,
      },
      include: { player: true },
    });

    // Auto-verification logic
    if (status === 'APPROVED') {
      const allDocs = await prisma.playerDocument.findMany({
        where: { playerId: document.playerId, status: 'APPROVED' },
      });

      const types = allDocs.map(d => d.docType);
      // A player is verified with a birth certificate PLUS one photo ID
      // (passport OR national ID) — not both, which was previously unreachable.
      const hasBirthCert = types.includes('BIRTH_CERTIFICATE');
      const hasPhotoId = types.includes('PASSPORT') || types.includes('NATIONAL_ID');
      const hasAllRequired = hasBirthCert && hasPhotoId;

      if (hasAllRequired) {
        await prisma.player.update({
          where: { id: document.playerId },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            verifiedBy: req.user.id,
          },
        });
      }
    }

    await logActivity({
      userId: req.user.id,
      action: 'Review Document',
      detail: `${status} document ${docId} for player ${document.player.fullName}`,
      module: 'documents',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocuments,
  uploadDocument,
  reviewDocument,
  getRequirements,
};
