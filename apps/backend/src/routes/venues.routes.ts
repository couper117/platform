const express = require('express');
const { getVenues, createVenue, updateVenue, deleteVenue } = require('../controllers/venues.controller');
const { protect, requireCapability } = require('../middleware/auth');

const router = express.Router();

router.get('/', getVenues);
router.post('/', protect, requireCapability('venues.write'), createVenue);
router.put('/:id', protect, requireCapability('venues.write'), updateVenue);
router.delete('/:id', protect, requireCapability('venues.write'), deleteVenue);

module.exports = router;
