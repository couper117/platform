const mongoose = require('mongoose');

const matchEventSchema = new mongoose.Schema({
  fixture_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', required: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  player2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, // Usually for assists or substitutions
  event_type: { 
    type: String, 
    enum: ['goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal', 'var'], 
    required: true 
  },
  minute: { type: Number, required: true },
  extra_time: { type: Number, default: 0 },
  description: String
}, { timestamps: true });

const MatchEvent = mongoose.model('MatchEvent', matchEventSchema);
module.exports = MatchEvent;
