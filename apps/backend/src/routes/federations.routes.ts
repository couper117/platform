const express = require('express');
const { getFederations, getFederation, createFederation, updateFederation, deleteFederation } = require('../controllers/federations.controller');
const { protect, requireCapability } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getFederations);
router.get('/:id', getFederation);

router.post('/', protect, requireCapability('federations.write'), upload.single('logo'), createFederation);
router.put('/:id', protect, requireCapability('federations.write'), upload.single('logo'), updateFederation);
router.delete('/:id', protect, requireCapability('federations.write'), deleteFederation);

module.exports = router;
