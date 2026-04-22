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

    if (!team) return res.status(404).json({ error: 'Team not found' });

    const players = await Player.find({ team_id: team._id }).sort({ jersey_number: 1 });

    res.json({
      ...team.toObject(),
      sport_name: team.sport_id?.name,
      sport_icon: team.sport_id?.icon,
      manager_name: team.manager_user_id?.full_name,
      players
    });
  } catch (error) {
    next(error);
  }
};

const getPlayers = async (req, res, next) => {
  try {
    const players = await Player.find({ team_id: req.params.id }).sort({ jersey_number: 1 });
    res.json(players);
  } catch (error) {
    next(error);
  }
};

const getFixtures = async (req, res, next) => {
  try {
    const fixtures = await Fixture.find({
      $or: [{ home_team_id: req.params.id }, { away_team_id: req.params.id }]
    })
    .populate('home_team_id away_team_id', 'name logo')
    .populate('league_id', 'name')
    .sort({ match_date: -1 });

    const response = fixtures.map(f => ({
      ...f.toObject(),
      home_team: f.home_team_id?.name,
      home_logo: f.home_team_id?.logo,
      away_team: f.away_team_id?.name,
      away_logo: f.away_team_id?.logo,
      league_name: f.league_id?.name
    }));