const Team = require('../models/Team');
const Sport = require('../models/Sport');
const User = require('../models/User');
const Player = require('../models/Player'); // Will create this
const Fixture = require('../models/Fixture'); // Will create this

const getAll = async (req, res, next) => {
  try {
    const { sport_id, status, search } = req.query;
    const query = {};

    if (sport_id) query.sport_id = sport_id;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { short_name: { $regex: search, $options: 'i' } }
      ];
    }

    const teams = await Team.find(query)
      .populate('sport_id', 'name icon')
      .populate('manager_user_id', 'full_name')
      .sort({ name: 1 });

    const response = teams.map(t => ({
      ...t.toObject(),
      sport_name: t.sport_id?.name,
      sport_icon: t.sport_id?.icon,
      manager_name: t.manager_user_id?.full_name
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const team = await Team.findOne({ slug: req.params.slug })
      .populate('sport_id', 'name icon')
      .populate('manager_user_id', 'full_name');