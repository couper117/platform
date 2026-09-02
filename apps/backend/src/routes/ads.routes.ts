const express = require('express');
const { getAds, createAd, updateAd, deleteAd } = require('../controllers/ads.controller');
const { protect, requireCapability } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getAds);
router.post('/', protect, requireCapability('ads.write'), validate(schemas.createAd), createAd);
router.put('/:id', protect, requireCapability('ads.write'), validate(schemas.updateAd), updateAd);
router.delete('/:id', protect, requireCapability('ads.write'), deleteAd);

module.exports = router;
