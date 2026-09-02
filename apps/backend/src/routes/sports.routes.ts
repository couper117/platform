const express = require('express');
const { getSports, getSport, createSport, updateSport, deleteSport } = require('../controllers/sports.controller');
const { protect, requireCapability } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getSports);
router.get('/:slug', getSport);

router.post('/', protect, requireCapability('sports.write'), upload.single('coverImage'), validate(schemas.createSport), createSport);
router.put('/:id', protect, requireCapability('sports.write'), upload.single('coverImage'), updateSport);
router.delete('/:id', protect, requireCapability('sports.write'), deleteSport);

module.exports = router;
