const prisma = require('../config/db');
const { uploadImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');
const { REQUIRED_DOC_TYPES, isPlayerVerifiable } = require('../constants/documentRequirements');
const { enforceSportScope } = require('../utils/scope');

/**
 * Set a player's verified state from the documents currently approved.
 *
 * Returns the status it settled on. Only ever moves a player between PENDING and
 * VERIFIED: SUSPENDED and REJECTED are decisions somebody took about the person,
 * not conclusions drawn from their paperwork, and a document review must not
 * quietly overturn them.
 */
const recomputeVerification = async (playerId, reviewerId) => {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, status: true },
  });
  if (!player) return null;
  if (player.status === 'SUSPENDED' || player.status === 'REJECTED') return player.status;

  const approved = await prisma.playerDocument.findMany({
    where: { playerId, status: 'APPROVED' },
    select: { docType: true },
  });

  // Birth certificate + one photo ID (passport OR national ID). The rule is
  // isolated and unit-tested in constants/documentRequirements.
  const verifiable = isPlayerVerifiable(approved.map((d) => d.docType));

  if (verifiable && player.status !== 'VERIFIED') {
    await prisma.player.update({
      where: { id: playerId },
      data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedBy: reviewerId ?? null },
    });
    return 'VERIFIED';
  }

  if (!verifiable && player.status === 'VERIFIED') {
    // Back to pending, and the verification stamp goes with it — leaving a
    // verifiedAt behind would read as though someone had signed this off.
    await prisma.player.update({
      where: { id: playerId },
      data: { status: 'PENDING', verifiedAt: null, verifiedBy: null },
    });
    return 'PENDING';
  }

  return player.status;
};

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
    const where: any = {};
    if (status) where.status = status;
    if (playerId) where.playerId = parseInt(playerId);
    if (teamId) where.player = { teamId: parseInt(teamId) };

    // These are identity documents — birth certificates, passports, national IDs.
    // A federation administrator runs one sport, so this listed every player on
    // the platform's papers to all of them. Narrow it to their own sport.
    if (req.user?.role === 'FEDERATION_ADMIN') {
      if (req.user.sportId == null) {
        // Assigned to no federation: scoping to "their sport" would be scoping to
        // nothing, and returning everything is the wrong way to resolve that.
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      where.player = { ...(where.player || {}), team: { sportId: Number(req.user.sportId) } };
    }

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

    const fileUrl = await uploadImage(req.file, 'documents', 800, 800, { uploadedById: req.user?.id, purpose: 'document' });

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

    // Read before writing. This used to update the row first and check nothing
    // at all, so a federation administrator for one sport could approve a player
    // in another — and an approval is not cosmetic: completing the required set
    // marks the player VERIFIED, which is what makes them eligible to play.
    const existing = await prisma.playerDocument.findUnique({
      where: { id: docId },
      include: { player: { include: { team: { select: { sportId: true } } } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Document not found' });
    if (!enforceSportScope(req, res, existing.player?.team?.sportId)) return;

    const document = await prisma.playerDocument.update({
      where: { id: docId },
      data: {
        status,
        reviewNote,
        reviewedBy: req.user.id,
      },
      include: { player: true },
    });

    // Recompute the player's verification from the documents that now stand.
    //
    // This used to run only on APPROVED, so it could grant verification but
    // never withdraw it: approving a birth certificate and a passport made the
    // player VERIFIED, and rejecting that same passport a minute later left them
    // VERIFIED — eligible to play on the strength of a document an administrator
    // had just refused. Recomputing from what remains cannot drift that way,
    // which is the same reason the match score is recounted rather than adjusted.
    await recomputeVerification(document.playerId, req.user.id);

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
  recomputeVerification,
  getDocuments,
  uploadDocument,
  reviewDocument,
  getRequirements,
};
