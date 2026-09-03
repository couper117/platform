const express = require('express');
const { protect, requireCapability } = require('../middleware/auth');
const { getReporters, getReporter, getMyProfile, updateMyProfile } = require('../controllers/reporters.controller');

const router = express.Router();

// A reporter's own profile. Declared before /:id so "me" is never read as an id.
router.get('/me', protect, requireCapability('reporters.profile'), getMyProfile);
router.put('/me', protect, requireCapability('reporters.profile'), updateMyProfile);


// The photograph moved to /auth/me/avatar. It writes `User.avatar`, so gating it
// on `reporters.profile` said only a reporter may have a face — and the club
// portal needs the same control for a coach. Nothing about it was ever
// reporter-specific except where it happened to be written.

// The directory, for whoever is choosing who to send.
router.get('/', protect, requireCapability('reporters.read'), getReporters);
router.get('/:id', protect, requireCapability('reporters.read'), getReporter);

module.exports = router;
