const express = require('express');
const { submitContact, getContacts, updateContactStatus } = require('../controllers/contacts.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', submitContact);
router.get('/', protect, authorize('SUPERADMIN'), getContacts);
router.put('/:id/status', protect, authorize('SUPERADMIN'), updateContactStatus);

module.exports = router;
