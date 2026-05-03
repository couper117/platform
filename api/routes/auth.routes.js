const express = require('express');
const router = express.Router();
const { login, refresh, logout, me, register } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/register', register);

module.exports = router;