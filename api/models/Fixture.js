const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
  league_id: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  home_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  away_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  match_date: { type: Date, required: true },
  venue: String,
  matchday: Number,
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'], default: 'scheduled' },
  home_score: { type: Number, default: 0 },
  away_score: { type: Number, default: 0 },
  home_score_ht: { type: Number, default: 0 },
  away_score_ht: { type: Number, default: 0 },
  referee: String,
  attendance: Number,
  stream_url: String
}, { timestamps: true });

const Fixture = mongoose.model('Fixture', fixtureSchema);
module.exports = Fixture;
