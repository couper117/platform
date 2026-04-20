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
    const fixture = await Fixture.findById(req.params.id)
      .populate('home_team_id away_team_id', 'name logo slug')
      .populate({
        path: 'league_id',
        select: 'name sport_id',
        populate: { path: 'sport_id', select: 'name icon' }
      });

    if (!fixture) return res.status(404).json({ error: 'Match not found' });

    const events = await MatchEvent.find({ fixture_id: fixture._id })
      .populate('player_id player2_id', 'full_name photo')
      .sort({ minute: 1 });

    const lineups = await Lineup.find({ fixture_id: fixture._id })
      .populate('player_id', 'full_name photo')
      .sort({ team_id: 1, is_starter: -1, position: 1 });

    res.json({
      ...fixture.toObject(),
      home_team: fixture.home_team_id?.name,
      home_logo: fixture.home_team_id?.logo,
      home_slug: fixture.home_team_id?.slug,
      away_team: fixture.away_team_id?.name,
      away_logo: fixture.away_team_id?.logo,
      away_slug: fixture.away_team_id?.slug,
      league_name: fixture.league_id?.name,
      sport_name: fixture.league_id?.sport_id?.name,
      sport_icon: fixture.league_id?.sport_id?.icon,
      events: events.map(e => ({
        ...e.toObject(),
        player_name: e.player_id?.full_name,
        player_photo: e.player_id?.photo,
        player2_name: e.player2_id?.full_name
      })),
      lineups: lineups.map(l => ({
        ...l.toObject(),
        player_name: l.player_id?.full_name,
        player_photo: l.player_id?.photo
      }))
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const fixture = new Fixture({ ...req.body, status: 'scheduled' });
    await fixture.save();
    res.status(201).json({ id: fixture._id });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const fixture = await Fixture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fixture) return res.status(404).json({ error: 'Match not found' });
    res.json({ message: 'Updated' });
  } catch (error) {
    next(error);
  }
};

const enterResult = async (req, res, next) => {
  try {
    const { status = 'completed' } = req.body;
    const fixture = await Fixture.findByIdAndUpdate(req.params.id, { ...req.body, status }, { new: true });
    if (!fixture) return res.status(404).json({ error: 'Match not found' });
    res.json({ message: 'Result entered' });
  } catch (error) {
    next(error);
  }
};

const setLive = async (req, res, next) => {
  try {
    const { status } = req.body;
    await Fixture.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: `Match is now ${status}` });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await Fixture.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, enterResult, setLive, remove };
