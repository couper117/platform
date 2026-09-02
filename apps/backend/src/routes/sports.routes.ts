const express = require('express');
const { getSports, getSport, createSport, updateSport, deleteSport } = require('../controllers/sports.controller');
const { protect, attachUser, requireCapability, requireAnyCapability } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

// attachUser so a signed-in manager can ask for the inactive ones too; the
// public still gets the active list, and the capability check is in the
// controller rather than here because the route serves both.
router.get('/', attachUser, getSports);
router.get('/:slug', getSport);

router.post('/', protect, requireCapability('sports.write'), upload.single('coverImage'), validate(schemas.createSport), createSport);
// A sport is governed by its federation, so a federation admin may keep its
// description current. The controller confines them to their own sport and to
// the descriptive fields; creating and deleting sports stay central.
router.put('/:id', protect, requireAnyCapability('sports.write', 'sports.describe'), upload.single('coverImage'), updateSport);
router.delete('/:id', protect, requireCapability('sports.write'), deleteSport);

module.exports = router;
