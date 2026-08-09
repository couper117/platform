const express = require('express');
const { getFederations, getFederation, createFederation, updateFederation, deleteFederation } = require('../controllers/federations.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getFederations);
router.get('/:id', getFederation);

router.post('/', protect, authorize('SUPERADMIN'), upload.single('logo'), createFederation);
router.put('/:id', protect, authorize('SUPERADMIN'), upload.single('logo'), updateFederation);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteFederation);

module.exports = router;
