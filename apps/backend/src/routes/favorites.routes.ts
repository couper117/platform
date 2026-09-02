const express = require('express');
const { attachUser } = require('../middleware/auth');
const {
  addFavorite, removeFavorite, getFavorites, getSuggestions, getFollowerCount, claimFavorites,
} = require('../controllers/favorites.controller');

const router = express.Router();

// attachUser, not protect: following a team must work without an account, and a
// signed-in visitor should have their favourites attached to the account rather
// than to the browser. attachUser identifies whoever is there and lets the rest
// through — see middleware/auth.ts.
router.use(attachUser);

router.get('/suggestions', getSuggestions);
router.get('/count/:teamId', getFollowerCount);
router.get('/', getFavorites);
router.post('/claim', claimFavorites);
router.post('/', addFavorite);
router.delete('/:teamId', removeFavorite);

module.exports = router;
