const Player = require('../models/Player');
const Team = require('../models/Team');

const getAll = async (req, res, next) => {
  try {
    const { team_id, search, status } = req.query;
    const query = {};

    if (team_id) query.team_id = team_id;
    if (search) query.full_name = { $regex: search, $options: 'i' };
    if (status) query.status = status;

    const players = await Player.find(query)
      .populate('team_id', 'name slug')
      .sort({ full_name: 1 });

    const response = players.map(p => ({
      ...p.toObject(),
      team_name: p.team_id?.name,
      team_slug: p.team_id?.slug
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team_id', 'name slug');

    if (!player) return res.status(404).json({ error: 'Player not found' });
    
    const response = {
      ...player.toObject(),
      team_name: player.team_id?.name,
      team_slug: player.team_id?.slug
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const player = new Player({
      ...req.body,
      status: 'pending'
    });
    await player.save();
    res.status(201).json({ id: player._id });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ message: 'Updated' });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
