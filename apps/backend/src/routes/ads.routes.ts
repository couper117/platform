const express = require('express');
const { getAds, createAd, updateAd, deleteAd } = require('../controllers/ads.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getAds);
router.post('/', protect, authorize('SUPERADMIN'), validate(schemas.createAd), createAd);
router.put('/:id', protect, authorize('SUPERADMIN'), validate(schemas.updateAd), updateAd);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteAd);

module.exports = router;
