const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Initiate a subscription payment (Mock for now, real Flutterwave integration would happen here)
// @route   POST /api/v1/payments/subscribe
// @access  Private (Team Manager)
const initiateSubscription = async (req, res, next) => {
  try {
    const { teamId, plan } = req.body;
    const amount = plan === 'PREMIUM' ? 50000 : 25000; // e.g., RWF

    // In a real app, you'd call Flutterwave API here to get a payment link
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amount,
        type: 'SUBSCRIPTION',
        status: 'PENDING',
        reference: `SUB-${Date.now()}-${req.user.id}`,
      },
    });

    res.status(201).json({ 
      success: true, 
      message: 'Subscription initiated', 
      data: transaction,
      paymentLink: `https://mock-payment-gateway.com/pay/${transaction.reference}` 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a payment (Webhook or Manual)
// @route   POST /api/v1/payments/verify/:reference
// @access  Private (Admin or Webhook)
const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const transaction = await prisma.transaction.findUnique({ where: { reference } });

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const updatedTransaction = await prisma.transaction.update({
      where: { reference },
      data: { status: 'SUCCESS' },
    });

    // If it's a subscription, update the team status
    if (updatedTransaction.type === 'SUBSCRIPTION') {
      const team = await prisma.team.findFirst({ where: { managerUserId: updatedTransaction.userId } });
      if (team) {
        await prisma.team.update({
          where: { id: team.id },
          data: { status: 'VERIFIED', verifiedAt: new Date() },
        });
      }
    }

    await logActivity({
      userId: req.user ? req.user.id : updatedTransaction.userId,
      action: 'Payment Verified',
      detail: `Transaction ${reference} succeeded`,
      module: 'payments',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: updatedTransaction });
  } catch (error) {
    next(error);
  }
};

module.exports = { initiateSubscription, verifyPayment };
