const express = require('express');
const { submitContact, getContacts, updateContactStatus } = require('../controllers/contacts.controller');
const { protect, requireCapability } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.post('/', validate(schemas.submitContact), submitContact);
router.get('/', protect, requireCapability('contacts.read'), getContacts);
router.put('/:id/status', protect, requireCapability('contacts.read'), updateContactStatus);

module.exports = router;
