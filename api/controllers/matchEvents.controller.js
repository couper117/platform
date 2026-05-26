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

    const response = events.map(e => ({
      ...e.toObject(),
      player_name: e.player_id?.full_name,
      player_photo: e.player_id?.photo,
      player2_name: e.player2_id?.full_name,
      team_name: e.team_id?.name
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { minute, description } = req.body;
    await MatchEvent.findByIdAndUpdate(req.params.eventId, { minute, description });
    res.json({ message: 'Event updated' });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await MatchEvent.findByIdAndDelete(req.params.eventId);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addEvent, getEvents, updateEvent, deleteEvent };
