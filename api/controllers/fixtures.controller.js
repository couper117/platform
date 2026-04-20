const Fixture = require('../models/Fixture');
const MatchEvent = require('../models/MatchEvent');
const Lineup = require('../models/Lineup');
const Team = require('../models/Team');
const League = require('../models/League');

const getAll = async (req, res, next) => {
  try {
    const { league_id, status, date_from, date_to, limit = 40 } = req.query;
    const query = {};

    if (league_id) query.league_id = league_id;
    if (status) query.status = status;
    if (date_from || date_to) {
      query.match_date = {};
      if (date_from) query.match_date.$gte = new Date(date_from);
      if (date_to) query.match_date.$lte = new Date(date_to);
    }

    const fixtures = await Fixture.find(query)
      .populate('home_team_id away_team_id', 'name logo slug')
      .populate({
        path: 'league_id',
        select: 'name sport_id',
        populate: { path: 'sport_id', select: 'name' }
      })
      .sort({ match_date: 1 })
      .limit(parseInt(limit));

    const response = fixtures.map(f => ({
      ...f.toObject(),
      home_team: f.home_team_id?.name,
      home_logo: f.home_team_id?.logo,
      home_slug: f.home_team_id?.slug,
      away_team: f.away_team_id?.name,
      away_logo: f.away_team_id?.logo,
      away_slug: f.away_team_id?.slug,
      league_name: f.league_id?.name,
      sport_name: f.league_id?.sport_id?.name
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {