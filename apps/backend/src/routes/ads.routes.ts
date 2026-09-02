const express = require('express');
const { getAds, recordClick, createAd, updateAd, deleteAd } = require('../controllers/ads.controller');
const { protect, requireCapability } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getAds);
// Public: the click is the visitor's, and the redirect target comes back from the
// server so a stale link in a cached page cannot outlive the campaign.
router.post('/:id/click', recordClick);
router.post('/', protect, requireCapability('ads.write'), validate(schemas.createAd), createAd);
router.put('/:id', protect, requireCapability('ads.write'), validate(schemas.updateAd), updateAd);
router.delete('/:id', protect, requireCapability('ads.write'), deleteAd);

module.exports = router;
