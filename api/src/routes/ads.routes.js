const express = require('express');
const { getAds, createAd, deleteAd } = require('../controllers/ads.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAds);
router.post('/', protect, authorize('SUPERADMIN'), createAd);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteAd);

module.exports = router;
