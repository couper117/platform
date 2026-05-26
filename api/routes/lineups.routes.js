const express = require('express');
const router = express.Router();
const { getLineups, setLineup, removeLineup } = require('../controllers/lineups.controller');
const { authenticate, requireAnyAdmin } = require('../middleware/auth');

router.get('/:id/lineups', getLineups);
router.post('/:id/lineups', authenticate, requireAnyAdmin, setLineup);
router.delete('/:id/lineups/:playerId', authenticate, requireAnyAdmin, removeLineup);

module.exports = router;