const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  full_name: { type: String, required: true },
  date_of_birth: Date,
  nationality: String,
  position: String,
  jersey_number: Number,
  skill_level: String,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  height_cm: Number,
  weight_kg: Number,
  bio: String,
  photo: String,
  status: { type: String, enum: ['pending', 'active', 'inactive', 'injured'], default: 'pending' }
}, { timestamps: true });

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
