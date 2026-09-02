const express = require('express');
const {
  getSuspensions,
  createSuspension,
  liftSuspension,
} = require('../controllers/suspensions.controller');
const { protect, requireCapability } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireCapability('suspensions.read'), getSuspensions);
router.post('/', protect, requireCapability('suspensions.write'), createSuspension);
router.patch('/:id/lift', protect, requireCapability('suspensions.write'), liftSuspension);

module.exports = router;
