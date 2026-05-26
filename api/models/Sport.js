const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'team'
  },
  sort_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Sport = mongoose.model('Sport', sportSchema);
module.exports = Sport;
