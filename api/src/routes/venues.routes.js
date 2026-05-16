const express = require('express');
const { getVenues, createVenue, updateVenue, deleteVenue } = require('../controllers/venues.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getVenues);
router.post('/', protect, authorize('SUPERADMIN'), createVenue);
router.put('/:id', protect, authorize('SUPERADMIN'), updateVenue);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteVenue);

module.exports = router;
