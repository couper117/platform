const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['super_admin', 'league_admin', 'team_admin', 'user'],
    default: 'league_admin'
  },
  active: {