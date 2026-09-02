/**
 * Organisations asking to join the platform.
 *
 * A club, school or federation that wants in has had nowhere to say so: the only
 * route was for a super admin to already know about them and create the record
 * by hand. This is the queue that replaces that conversation.
 *
 * Nothing is created from a request until it is approved. A request is a message,
 * not a half-made organisation — an approved-then-rejected club that already had
 * rows in Team and Federation is far harder to undo than one that never existed.
 */

const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

const KINDS = ['CLUB', 'SCHOOL', 'FEDERATION', 'SPORT'];
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

/** Long enough for a real organisation name, short enough not to be a payload. */
const LIMITS = { organisation: 200, contactName: 200, contactEmail: 200, contactPhone: 50, details: 2000 };

const clean = (v, max) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : null;
};

/** Deliberately permissive — rejecting a valid address is worse than accepting a typo. */
const looksLikeEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// @desc    Ask to join the platform
// @route   POST /api/v1/requests
// @access  Public
const createRequest = async (req, res, next) => {
  try {
    const kind = String(req.body?.kind || '').trim().toUpperCase();
    if (!KINDS.includes(kind)) {
      return res.status(400).json({ success: false, message: `kind must be one of ${KINDS.join(', ')}` });
    }

    const organisation = clean(req.body?.organisation, LIMITS.organisation);
    const contactName = clean(req.body?.contactName, LIMITS.contactName);
    const contactEmail = clean(req.body?.contactEmail, LIMITS.contactEmail);
    if (!organisation) return res.status(400).json({ success: false, message: 'organisation is required' });
    if (!contactName) return res.status(400).json({ success: false, message: 'contactName is required' });
    if (!looksLikeEmail(contactEmail)) {
      return res.status(400).json({ success: false, message: 'A valid contactEmail is required' });
    }

    // A second request from the same organisation while the first is still open
    // is almost always someone who did not get a reply, not a new application.
    // Returning the existing one keeps the queue honest without telling them off.
    const open = await prisma.platformRequest.findFirst({
      where: { kind, organisation, status: 'PENDING' },
    });
    if (open) {
      return res.status(200).json({
        success: true,
        message: 'A request for this organisation is already with us. We will be in touch.',
        data: { id: open.id, status: open.status, createdAt: open.createdAt },
      });
    }

    const sportId = req.body?.sportId ? parseInt(req.body.sportId) : null;
    if (sportId) {
      const sport = await prisma.sport.findUnique({ where: { id: sportId }, select: { id: true } });
      if (!sport) return res.status(400).json({ success: false, message: 'Unknown sportId' });
    }

    const created = await prisma.platformRequest.create({
      data: {
        kind,
        organisation,
        contactName,
        contactEmail,
        contactPhone: clean(req.body?.contactPhone, LIMITS.contactPhone),
        sportId,
        details: clean(req.body?.details, LIMITS.details),
      },
      select: { id: true, status: true, createdAt: true },
    });

    await logActivity({
      action: 'Join Request',
      detail: `${kind}: ${organisation}`,
      module: 'requests',
      ip: req.ip,
    });

    // The response carries no personal data back — it only confirms receipt.
    res.status(201).json({
      success: true,
      message: 'Request received. A platform administrator will review it.',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    The review queue
// @route   GET /api/v1/requests
// @access  Private (requests.review)
const getRequests = async (req, res, next) => {
  try {
    const { status, kind } = req.query;
    const where: any = {};
    if (status && STATUSES.includes(String(status).toUpperCase())) where.status = String(status).toUpperCase();
    if (kind && KINDS.includes(String(kind).toUpperCase())) where.kind = String(kind).toUpperCase();

    const requests = await prisma.platformRequest.findMany({
      where,
      // Pending first, then newest — the queue should open on the work, not on
      // a history of things already dealt with.
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { reviewedBy: { select: { id: true, fullName: true } } },
      take: 500,
    });

    const pending = await prisma.platformRequest.count({ where: { status: 'PENDING' } });
    res.status(200).json({ success: true, count: requests.length, pending, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a request
// @route   PATCH /api/v1/requests/:id
// @access  Private (requests.review)
const reviewRequest = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const status = String(req.body?.status || '').trim().toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be APPROVED or REJECTED' });
    }

    const existing = await prisma.platformRequest.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });
    if (existing.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        message: `This request was already ${existing.status.toLowerCase()}.`,
      });
    }

    // A rejection that says nothing is a rejection nobody can act on.
    const decisionNote = clean(req.body?.decisionNote, LIMITS.details);
    if (status === 'REJECTED' && !decisionNote) {
      return res.status(400).json({ success: false, message: 'Say why it was rejected, so the applicant can be told.' });
    }

    const updated = await prisma.platformRequest.update({
      where: { id },
      data: { status, decisionNote, reviewedById: req.user.id, reviewedAt: new Date() },
      include: { reviewedBy: { select: { id: true, fullName: true } } },
    });

    await logActivity({
      userId: req.user.id,
      action: `Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      detail: `${existing.kind}: ${existing.organisation}`,
      module: 'requests',
      ip: req.ip,
    });

    // Approval records a decision; it does not create the club. Whoever acts on
    // it still goes through the normal creation flow, with its own validation
    // and its own audit entry — which is where that record belongs.
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRequest, getRequests, reviewRequest, KINDS, STATUSES };
