const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: String,
  body: { type: String, required: true },
  sport_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport' },
  league_id: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
  category: String,
  cover_image: String,
  featured: { type: Boolean, default: false },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  published: { type: Boolean, default: true },
  views: { type: Number, default: 0 }
}, { timestamps: true });

const News = mongoose.model('News', newsSchema);
module.exports = News;
