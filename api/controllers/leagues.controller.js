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
        if (!t) return;
        const id = t._id.toString();
        if (!teamsMap.has(id)) {
          teamsMap.set(id, { 
            team_id: t._id, name: t.name, short_name: t.short_name, logo: t.logo,
            gp: 0, gw: 0, gd: 0, gl: 0, gf: 0, ga: 0, pts: 0 
          });
        }
      });

      const home = teamsMap.get(f.home_team_id._id.toString());
      const away = teamsMap.get(f.away_team_id._id.toString());

      home.gp++;
      away.gp++;
      home.gf += f.home_score;
      home.ga += f.away_score;
      away.gf += f.away_score;
      away.ga += f.home_score;

      if (f.home_score > f.away_score) {
        home.gw++; home.pts += 3;
        away.gl++;
      } else if (f.home_score < f.away_score) {
        away.gw++; away.pts += 3;
        home.gl++;
      } else {
        home.gd++; home.pts += 1;
        away.gd++; away.pts += 1;
      }
    });

    const standings = Array.from(teamsMap.values()).map(s => ({
      ...s,
      gd: s.gf - s.ga
    })).sort((a, b) => b.pts - a.pts || b.gd - a.gd);

    res.json(standings.map((s, i) => ({ ...s, rank: i + 1 })));
  } catch (error) {
    next(error);
  }
};

const getTopScorers = async (req, res, next) => {
  try {
    const league = await League.findOne({ slug: req.params.slug });
    if (!league) return res.status(404).json({ error: 'League not found' });

    // Use aggregation for top scorers
    const scorers = await MatchEvent.aggregate([
      {
        $lookup: {
          from: 'fixtures',
          localField: 'fixture_id',
          foreignField: '_id',
          as: 'fixture'
        }
      },
      { $unwind: '$fixture' },
      { $match: { 'fixture.league_id': league._id, event_type: 'goal' } },
      {
        $group: {
          _id: '$player_id',
          goals: { $sum: 1 },
          assists: { $sum: { $cond: [{ $ne: ['$assist', null] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'players',
          localField: '_id',