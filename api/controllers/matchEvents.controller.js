const MatchEvent = require('../models/MatchEvent');
const Fixture = require('../models/Fixture');

const addEvent = async (req, res, next) => {
  try {
    const event = new MatchEvent({
      ...req.body,
      fixture_id: req.params.id
    });
    await event.save();

    // Update live score if goal
    if (req.body.event_type === 'goal' && req.body.team_id) {
      const fixture = await Fixture.findById(req.params.id);
      if (fixture) {
        const isHome = fixture.home_team_id.toString() === req.body.team_id;
        if (isHome) {
          fixture.home_score += 1;
        } else {
          fixture.away_score += 1;
        }
        await fixture.save();
      }
    }

    res.status(201).json({ id: event._id });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const events = await MatchEvent.find({ fixture_id: req.params.id })
      .populate('player_id player2_id', 'full_name photo')
      .populate('team_id', 'name')
      .sort({ minute: 1 });