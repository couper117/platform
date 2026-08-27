const express = require('express');
const {
  getUmugandaDays, getUmugandaCalendar, getNotices, getConflicts, getUmugandaDay,
  createUmugandaDay, updateUmugandaDay, deleteUmugandaDay, regenerate, createAnnouncement,
  setEventDecision,
} = require('../controllers/umuganda.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

// Who may curate the Umuganda calendar. AMASHURI_ADMIN is included because
// school fixtures collide with Umuganda just as league ones do.
const CURATORS = ['SUPERADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'AMASHURI_ADMIN'];

// Literal segments must be declared before '/:id', or Express matches
// '/calendar' as an id and the numeric parse yields NaN.
router.get('/', getUmugandaDays);
router.get('/calendar', getUmugandaCalendar);
router.get('/notices', getNotices);
router.get('/conflicts', protect, authorize(...CURATORS), getConflicts);
router.get('/:id', getUmugandaDay);

router.post('/', protect, authorize(...CURATORS), validate(schemas.createUmuganda), createUmugandaDay);
router.post('/generate', protect, authorize(...CURATORS), regenerate);
// The admin's ruling on a clashing match. ':kind' is 'league' or 'amashuri';
// per-fixture ownership is enforced inside the handler, not by role alone.
router.post(
  '/events/:kind/:id/decision',
  protect,
  authorize(...CURATORS),
  validate(schemas.umugandaDecision),
  setEventDecision,
);
router.post('/:id/announcement', protect, authorize(...CURATORS), validate(schemas.umugandaAnnouncement), createAnnouncement);
router.patch('/:id', protect, authorize(...CURATORS), validate(schemas.updateUmuganda), updateUmugandaDay);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteUmugandaDay);

module.exports = router;
