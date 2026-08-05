const express = require('express');
const { registerTeam, login, refresh, logout, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.post('/team/register', validate(schemas.registerTeam), registerTeam);
router.post('/login', validate(schemas.login), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', validate(schemas.forgotPassword), forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
