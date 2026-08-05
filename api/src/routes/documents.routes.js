const express = require('express');
const { getDocuments, uploadDocument, reviewDocument } = require('../controllers/documents.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), getDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.put('/:id/review', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), validate(schemas.reviewDocument), reviewDocument);

module.exports = router;
