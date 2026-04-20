const League = require('../models/League');
const Sport = require('../models/Sport');
const User = require('../models/User');
const Fixture = require('../models/Fixture'); // Will create this
const MatchEvent = require('../models/MatchEvent'); // Will create this

const getAll = async (req, res, next) => {
  try {
    const { sport_id, status, gender, limit = 50, offset = 0 } = req.query;
    const query = {};

    if (sport_id) query.sport_id = sport_id;
    if (status) query.status = status;
    if (gender) query.gender = gender;

    const leagues = await League.find(query)
      .populate('sport_id', 'name icon')
      .populate('admin_user_id', 'full_name')
      .sort({ status: 1, createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Map to match old response structure
    const response = leagues.map(l => ({
      ...l.toObject(),
      sport_name: l.sport_id?.name,
      sport_icon: l.sport_id?.icon,
      admin_name: l.admin_user_id?.full_name
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const league = await League.findOne({ slug: req.params.slug })
      .populate('sport_id', 'name icon');

    if (!league) return res.status(404).json({ error: 'League not found' });
    
    const response = {
      ...league.toObject(),
      sport_name: league.sport_id?.name,
      sport_icon: league.sport_id?.icon
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getStandings = async (req, res, next) => {
  try {
    const league = await League.findOne({ slug: req.params.slug });
    if (!league) return res.status(404).json({ error: 'League not found' });

    // This is a complex logic that might need a separate service or aggregation
    // For now, let's implement it using Mongoose queries
    const fixtures = await Fixture.find({ 
      league_id: league._id, 
      status: 'completed' 
    }).populate('home_team_id away_team_id', 'name short_name logo');

    const teamsMap = new Map();

    fixtures.forEach(f => {
      [f.home_team_id, f.away_team_id].forEach(t => {