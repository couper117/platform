const express = require('express');
const { getTransfers, createTransfer } = require('../controllers/transfers.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN', 'FEDERATION_ADMIN'), getTransfers);
router.post('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), createTransfer);

module.exports = router;
