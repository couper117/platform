const express = require('express');
const router = express.Router();
const {
  getRaces,
  getRace,
  createRace,
  updateRaceResults,
  updateRace,
  upsertClassification,
} = require('../controllers/races.controller');
const { protect, authorize } = require('../middleware/auth');

const raceAdmin = authorize('SUPERADMIN', 'FEDERATION_ADMIN');

// Public racing endpoints — race calendar + classification for RACING sports.
router.get('/', getRaces);

// Admin write endpoints. `/classification/...` is declared before `/:id` so the
// literal segment is never shadowed by the `:id` param route.
router.post('/', protect, raceAdmin, createRace);
router.put('/classification/:competitionId', protect, raceAdmin, upsertClassification);
router.patch('/:id/results', protect, raceAdmin, updateRaceResults);
router.patch('/:id', protect, raceAdmin, updateRace);

router.get('/:id', getRace);

module.exports = router;
