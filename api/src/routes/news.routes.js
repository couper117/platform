const express = require('express');
const { getNews, getArticle, createArticle, updateArticle, deleteArticle } = require('../controllers/news.controller');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

router.get('/', getNews);
router.get('/:slug', getArticle);

router.post('/', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), upload.single('coverImage'), validate(schemas.createNews), createArticle);
router.put('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), upload.single('coverImage'), updateArticle);
router.delete('/:id', protect, authorize('SUPERADMIN', 'FEDERATION_ADMIN'), deleteArticle);

module.exports = router;
