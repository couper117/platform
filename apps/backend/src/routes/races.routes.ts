const express = require('express');
const router = express.Router();
const { getRaces, getRace } = require('../controllers/races.controller');

// Public racing endpoints — race calendar + classification for RACING sports.
router.get('/', getRaces);
router.get('/:id', getRace);

module.exports = router;
