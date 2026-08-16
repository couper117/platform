const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const flw = require('../services/payments/flutterwave.service');

// Subscription pricing (RWF). Kept here (not client-supplied) so a caller can
// never set their own amount.
const PLAN_PRICES: Record<string, number> = { PREMIUM: 50000, STANDARD: 25000 };

/**
 * Mark a transaction paid and apply its side effects. Idempotent: a second call
 * for an already-SUCCESS transaction is a no-op. Shared by the gateway webhook
 * and the manual admin fallback so the money-moving logic lives in one place.
 */
const markTransactionPaid = async (reference: string, actorUserId: number | null, ip: string) => {
  const transaction = await prisma.transaction.findUnique({ where: { reference } });
  if (!transaction) return { notFound: true } as any;
  if (transaction.status === 'SUCCESS') return { transaction, already: true } as any;

  const updated = await prisma.transaction.update({
    where: { reference },
    data: { status: 'SUCCESS' },
  });

  // A successful subscription activates the team's subscription. It does NOT
  // grant document verification (VERIFIED) — that stays an admin decision.
  if (updated.type === 'SUBSCRIPTION') {
    const team = await prisma.team.findFirst({ where: { managerUserId: updated.userId } });
    if (team) {
      await prisma.team.update({
        where: { id: team.id },
        data: {
          subscriptionActive: true,
          subscriptionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  await logActivity({
    userId: actorUserId ?? updated.userId,
    action: 'Payment Verified',
    detail: `Transaction ${reference} succeeded`,
    module: 'payments',
    ip,
  });

  return { transaction: updated } as any;
};

// @desc    Initiate a subscription payment — returns a hosted payment link.
// @route   POST /api/v1/payments/subscribe
// @access  Private (Team Manager)
const initiateSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const amount = PLAN_PRICES[plan] || PLAN_PRICES.STANDARD;
    const reference = `SUB-${Date.now()}-${req.user.id}`;

    const transaction = await prisma.transaction.create({
      data: { userId: req.user.id, amount, type: 'SUBSCRIPTION', status: 'PENDING', reference },
    });

    // Ask the provider for a hosted link. Falls back to a sandbox link when no
    // live credentials are configured, so this endpoint always succeeds.
    const { link, mode } = await flw.createPaymentLink({
      txRef: reference,
      amount,
      customer: { email: req.user.email || undefined, name: req.user.fullName || undefined },
      meta: { userId: req.user.id, plan: plan || 'STANDARD' },
    });

    res.status(201).json({
      success: true,
      message: 'Subscription initiated',
      data: transaction,
      paymentLink: link,
      mode, // 'live' | 'sandbox' — lets the UI show a sandbox notice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Flutterwave webhook — the gateway calls this when a charge completes.
// @route   POST /api/v1/payments/webhook
// @access  Public (authenticated by the provider's verif-hash signature)
const handleWebhook = async (req, res, next) => {
  try {
    if (!flw.verifyWebhookSignature(req)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body || {};
    const data = event.data || {};
    const successful =
      event.event === 'charge.completed' && String(data.status).toLowerCase() === 'successful';
    const reference = data.tx_ref;

    // Acknowledge everything with 200 (so the gateway stops retrying) but only a
    // verified successful charge moves money.
    if (successful && reference) {
      await markTransactionPaid(reference, null, req.ip);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual admin verification — a fallback for a missed/undelivered webhook.
// @route   POST /api/v1/payments/verify/:reference
// @access  Private (SUPERADMIN)
const verifyPayment = async (req, res, next) => {
  try {
    const result = await markTransactionPaid(req.params.reference, req.user.id, req.ip);
    if (result.notFound) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (result.already) {
      return res.status(200).json({ success: true, data: result.transaction, message: 'Already verified' });
    }
    res.status(200).json({ success: true, data: result.transaction });
  } catch (error) {
    next(error);
  }
};

module.exports = { initiateSubscription, handleWebhook, verifyPayment };
