const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// @desc    Submit contact form
// @route   POST /api/v1/contacts
// @access  Public
const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const contact = await prisma.contact.create({
      data: { name, email, phone, subject, message },
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact messages
// @route   GET /api/v1/contacts
// @access  Private/Admin
const getContacts = async (req, res, next) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact status
// @route   PUT /api/v1/contacts/:id/status
// @access  Private/Admin
const updateContactStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const contact = await prisma.contact.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Update Contact Status',
      detail: `Updated message from ${contact.name} to ${status}`,
      module: 'contacts',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact, getContacts, updateContactStatus };
