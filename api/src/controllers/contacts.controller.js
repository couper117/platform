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