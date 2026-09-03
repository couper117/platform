const express = require('express');
const {
  registerTeam, login, refresh, logout, getMe,
  updateMyAvatar, deleteMyAvatar, forgotPassword, resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
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

// Your own photograph. `protect` and nothing more: every signed-in account may
// change its own picture and no other, which is why this is not gated on a
// capability — it used to be, on the reporter's, which said only reporters may
// have a face.
router.put('/me/avatar', protect, upload.single('avatar'), updateMyAvatar);
router.delete('/me/avatar', protect, deleteMyAvatar);

module.exports = router;
