const News = require('../models/News');
const Sport = require('../models/Sport');
const User = require('../models/User');

const getAll = async (req, res, next) => {
  try {
    const { category, featured, sport_id, limit = 20, offset = 0 } = req.query;
    const query = { published: true };

    if (category) query.category = category;
    if (featured) query.featured = true;
    if (sport_id) query.sport_id = sport_id;

    const news = await News.find(query)
      .populate('sport_id', 'name')
      .populate('author_id', 'full_name')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const response = news.map(n => ({
      ...n.toObject(),
      sport_name: n.sport_id?.name,
      author_name: n.author_id?.full_name
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const news = await News.findOne({ slug: req.params.slug })
      .populate('sport_id', 'name')
      .populate('author_id', 'full_name');

    if (!news) return res.status(404).json({ error: 'Article not found' });

    // Increment views
    news.views += 1;
    await news.save();

    const response = {
      ...news.toObject(),