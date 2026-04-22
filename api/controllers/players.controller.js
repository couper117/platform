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
