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
// @route   POST /api/v1/news
// @access  Private/Admin
const createArticle = async (req, res, next) => {
  try {
    const { title, excerpt, body, category, sportId, leagueId, featured, published } = req.body;
    let coverImage = null;

    if (req.file) {
      coverImage = await uploadImage(req.file, 'news', 800, 450);
    }

    const news = await prisma.news.create({
      data: {
        title,
        slug: slugify(title, { lower: true }),
        excerpt,
        body,
        category,
        sportId: sportId ? parseInt(sportId) : null,
        leagueId: leagueId ? parseInt(leagueId) : null,
        featured: featured === 'true' || featured === true,
        published: published === 'true' || published === true,
        authorId: req.user.id,
        coverImage,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create News',
      detail: `Created news article: ${title}`,
      module: 'news',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// @desc    Update news article
// @route   PUT /api/v1/news/:id
// @access  Private/Admin
const updateArticle = async (req, res, next) => {
  try {
    const newsId = parseInt(req.params.id);
    let news = await prisma.news.findUnique({ where: { id: newsId } });

    if (!news) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const { title, excerpt, body, category, sportId, leagueId, featured, published } = req.body;

    let coverImage = news.coverImage;
    if (req.file) {
      if (news.coverImage) await deleteImage(news.coverImage);
      coverImage = await uploadImage(req.file, 'news', 800, 450);
    }

    news = await prisma.news.update({