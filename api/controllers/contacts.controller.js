const Contact = require('../models/Contact');

const submit = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message required' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const contact = new Contact({
      name, email, phone: phone || '', subject: subject || '', message, ip,
      status: 'new'
    });
    
    await contact.save();
    res.status(201).json({ id: contact._id });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Status updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { submit, getAll, updateStatus };
