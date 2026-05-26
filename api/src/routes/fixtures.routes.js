const express = require('express');
const { getFixtures, getFixture, createFixture, saveResult, addMatchEvent } = require('../controllers/fixtures.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getFixtures);
router.get('/:id', getFixture);

router.post('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), createFixture);
router.post('/:id/result', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), saveResult);
router.post('/:id/events', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), addMatchEvent);

module.exports = router;
