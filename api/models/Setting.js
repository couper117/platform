const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  skey: { type: String, required: true, unique: true },
  sval: { type: mongoose.Schema.Types.Mixed, default: '' },
  label: String,
  group_name: { type: String, default: 'general' }
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
