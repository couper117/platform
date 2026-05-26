const express = require('express');
const { getNews, getArticle, createArticle, updateArticle, deleteArticle } = require('../controllers/news.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getNews);
router.get('/:slug', getArticle);

router.post('/', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), upload.single('coverImage'), createArticle);
router.put('/:id', protect, authorize('SUPERADMIN', 'LEAGUE_ADMIN'), upload.single('coverImage'), updateArticle);
router.delete('/:id', protect, authorize('SUPERADMIN'), deleteArticle);

module.exports = router;
