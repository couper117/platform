const express = require('express');
const { getTransfers, createTransfer } = require('../controllers/transfers.controller');
const { protect, requireCapability } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireCapability('transfers.read'), getTransfers);
router.post('/', protect, requireCapability('transfers.write'), createTransfer);

module.exports = router;
