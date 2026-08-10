const express = require('express');
const { getDocuments, uploadDocument, reviewDocument, getRequirements } = require('../controllers/documents.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/requirements', getRequirements);
router.get('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), getDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.put('/:id/review', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), validate(schemas.reviewDocument), reviewDocument);

module.exports = router;
