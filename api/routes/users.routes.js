const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, changePassword, remove } = require('../controllers/users.controller');
const { authenticate, requireSuperadmin } = require('../middleware/auth');

router.get('/', authenticate, requireSuperadmin, getAll);
router.get('/:id', authenticate, requireSuperadmin, getById);
router.post('/', authenticate, requireSuperadmin, create);
router.put('/:id', authenticate, requireSuperadmin, update);
router.put('/:id/password', authenticate, requireSuperadmin, changePassword);
router.delete('/:id', authenticate, requireSuperadmin, remove);

module.exports = router;