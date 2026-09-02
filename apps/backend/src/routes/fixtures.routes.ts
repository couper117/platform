const express = require('express');
const {
  getFixtures, getFixture, createFixture, saveResult, addMatchEvent,
  saveLineup, saveStats, updateFixtureMeta, streamFixture,
  setMatchClock, deleteMatchEvent,
} = require('../controllers/fixtures.controller');
const { protect, requireCapability } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getFixtures);
router.get('/:id/stream', streamFixture);
router.get('/:id', getFixture);

router.post('/', protect, requireCapability('fixtures.write'), validate(schemas.createFixture), createFixture);
// MATCH_REPORTER included so a reporter can set the stream link on a match they
// are assigned to. canManageFixture() still checks that assignment per fixture.
router.patch('/:id', protect, requireCapability('fixtures.report'), updateFixtureMeta);
router.post('/:id/result', protect, requireCapability('fixtures.report'), validate(schemas.saveResult), saveResult);
router.post('/:id/events', protect, requireCapability('fixtures.report'), validate(schemas.addMatchEvent), addMatchEvent);
router.put('/:id/lineup', protect, requireCapability('fixtures.lineups'), saveLineup);
// Undo a logged event, putting back the score, the scorer's tally and any
// suspension the card produced.
router.delete('/:id/events/:eventId', protect, requireCapability('fixtures.report'), deleteMatchEvent);

// The match clock: period transitions and the referee's added minutes.
router.post('/:id/clock', protect, requireCapability('fixtures.report'), setMatchClock);
router.put('/:id/stats', protect, requireCapability('fixtures.report'), saveStats);

module.exports = router;
