const express = require('express');
const { getAds } = require('../controllers/ads.controller');

const router = express.Router();

router.get('/', getAds);

module.exports = router;
