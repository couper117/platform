const express = require('express');
const router = express.Router();
const { addEvent, getEvents, updateEvent, deleteEvent } = require('../controllers/matchEvents.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/:id/events', getEvents);
router.post('/:id/events', authenticate, requireAnyAdmin, addEvent);
router.put('/:fixtureId/events/:eventId', authenticate, requireAnyAdmin, updateEvent);
router.delete('/:fixtureId/events/:eventId', authenticate, requireAnyAdmin, deleteEvent);

module.exports = router;