const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  short_name: String,
  slug: { type: String, required: true, unique: true },
  sport_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
  league_id: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },
  logo: String,
  home_venue: String,
  city: String,
  province: String,