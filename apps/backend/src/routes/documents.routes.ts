const express = require('express');
const { getDocuments, uploadDocument, reviewDocument, getRequirements } = require('../controllers/documents.controller');
const { protect, requireCapability } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/requirements', getRequirements);
router.get('/', protect, requireCapability('players.documents'), getDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.put('/:id/review', protect, requireCapability('players.documents'), validate(schemas.reviewDocument), reviewDocument);

module.exports = router;
