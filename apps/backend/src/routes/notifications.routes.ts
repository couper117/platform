const express = require('express');
const { attachUser } = require('../middleware/auth');
const { getNotifications, markRead, markAllRead } = require('../controllers/notifications.controller');

const router = express.Router();

// attachUser rather than protect — a follower with no account still gets told
// about their match. See favorites.routes.ts.
router.use(attachUser);

router.get('/', getNotifications);
router.post('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
