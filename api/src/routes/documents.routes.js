const express = require('express');
const { getDocuments, uploadDocument, reviewDocument, getRequirements } = require('../controllers/documents.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/requirements', getRequirements);
router.get('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), getDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.put('/:id/review', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), reviewDocument);

module.exports = router;
