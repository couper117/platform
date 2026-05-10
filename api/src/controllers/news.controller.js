const prisma = require('../config/db');
const slugify = require('slugify');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all news
// @route   GET /api/v1/news
// @access  Public
const getNews = async (req, res, next) => {
  try {
    const { sportId, leagueId, category, featured } = req.query;
    const where = { published: true };
    if (sportId) where.sportId = parseInt(sportId);
    if (leagueId) where.leagueId = parseInt(leagueId);
    if (category) where.category = category;
    if (featured) where.featured = featured === 'true';

    const news = await prisma.news.findMany({
      where,
      include: {
        author: { select: { fullName: true } },
        league: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single news article
// @route   GET /api/v1/news/:slug
// @access  Public
const getArticle = async (req, res, next) => {
  try {
    const news = await prisma.news.findUnique({
      where: { slug: req.params.slug },
      include: {
        author: { select: { fullName: true } },
        league: true,
      },
    });

    if (!news || !news.published) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Increment views
    await prisma.news.update({
      where: { id: news.id },
      data: { views: { increment: 1 } },
    });

    res.status(200).json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// @desc    Create news article