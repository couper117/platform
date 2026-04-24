const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sport_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
  season: String,
  gender: { type: String, enum: ['male', 'female', 'mixed', 'other'], default: 'mixed' },
  age_category: String,
  level: String,
  format: String,
  status: { type: String, enum: ['active', 'inactive', 'completed', 'upcoming'], default: 'active' },
  start_date: Date,
  end_date: Date,