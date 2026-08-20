const express = require('express');
const {
  getOfficials,
  createOfficial,
  updateOfficial,
  deleteOfficial,
} = require('../controllers/officials.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getOfficials);
router.post('/', protect, createOfficial);
router.patch('/:id', protect, updateOfficial);
router.delete('/:id', protect, deleteOfficial);

module.exports = router;
