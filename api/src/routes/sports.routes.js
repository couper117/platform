const express = require('express');
const { getSports, getSport, createSport, updateSport, deleteSport } = require('../controllers/sports.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getSports);
router.get('/:slug', getSport);

router.post('/', protect, authorize('SUPERADMIN'), upload.single('coverImage'), createSport);
router.put('/:id', protect, authorize('SUPERADMIN'), upload.single('coverImage'), updateSport);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteSport);

module.exports = router;
