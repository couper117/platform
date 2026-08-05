const express = require('express');
const { getFixtures, getFixture, createFixture, saveResult, addMatchEvent } = require('../controllers/fixtures.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getFixtures);
router.get('/:id', getFixture);

router.post('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'), validate(schemas.createFixture), createFixture);
router.post('/:id/result', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'MATCH_REPORTER'), validate(schemas.saveResult), saveResult);
router.post('/:id/events', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'MATCH_REPORTER'), validate(schemas.addMatchEvent), addMatchEvent);

module.exports = router;
