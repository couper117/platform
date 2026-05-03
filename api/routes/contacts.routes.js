const express = require('express');
const router = express.Router();
const { submit, getAll, updateStatus } = require('../controllers/contacts.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.post('/', submit);
router.get('/', authenticate, requireAnyAdmin, getAll);
router.put('/:id', authenticate, requireAnyAdmin, updateStatus);

module.exports = router;