const mongoose = require('mongoose');

const lineupSchema = new mongoose.Schema({
  fixture_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', required: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  position: String,
  jersey_no: Number,
  is_starter: { type: Boolean, default: false },
  is_captain: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure unique lineup entry per fixture and player
lineupSchema.index({ fixture_id: 1, player_id: 1 }, { unique: true });

const Lineup = mongoose.model('Lineup', lineupSchema);
module.exports = Lineup;
