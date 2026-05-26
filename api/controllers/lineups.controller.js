const Lineup = require('../models/Lineup');
const Player = require('../models/Player');

const getLineups = async (req, res, next) => {
  try {
    const lineups = await Lineup.find({ fixture_id: req.params.id })
      .populate('player_id', 'full_name photo')
      .sort({ team_id: 1, is_starter: -1, position: 1 });

    const response = lineups.map(l => ({
      ...l.toObject(),
      player_name: l.player_id?.full_name,
      player_photo: l.player_id?.photo
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const setLineup = async (req, res, next) => {
  try {
    const { team_id, player_id, position, jersey_no, is_starter, is_captain } = req.body;
    
    // Upsert logic in Mongoose
    await Lineup.findOneAndUpdate(
      { fixture_id: req.params.id, player_id },
      { team_id, position, jersey_no, is_starter: !!is_starter, is_captain: !!is_captain },
      { upsert: true, new: true }
    );

    res.json({ message: 'Lineup set' });
  } catch (error) {
    next(error);
  }
};

const removeLineup = async (req, res, next) => {
  try {
    await Lineup.findOneAndDelete({ fixture_id: req.params.id, player_id: req.params.playerId });
    res.json({ message: 'Lineup entry removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLineups, setLineup, removeLineup };
