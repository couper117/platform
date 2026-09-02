const express = require('express');
const { protect, requireCapability } = require('../middleware/auth');
const { createRequest, getRequests, reviewRequest } = require('../controllers/requests.controller');

const router = express.Router();

// Deliberately unauthenticated: an organisation that is not on the platform yet
// has, by definition, nobody who could sign in to ask. It writes a queue entry
// and returns no data.
router.post('/', createRequest);

router.get('/', protect, requireCapability('requests.review'), getRequests);
router.patch('/:id', protect, requireCapability('requests.review'), reviewRequest);

module.exports = router;
