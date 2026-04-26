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
  founded_year: Number,
  jersey_home: String,
  jersey_away: String,
  description: String,
  manager_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
