const Sport = require('../models/Sport');
const League = require('../models/League');
const Team = require('../models/Team');

const getAll = async (req, res, next) => {
  try {
    const sports = await Sport.aggregate([
      {
        $lookup: {
          from: 'leagues',
          localField: '_id',
          foreignField: 'sport_id',
          as: 'leagues'
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: 'sport_id',
          as: 'teams'
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          icon: 1,
          description: 1,
          category: 1,
          sort_order: 1,
          league_count: { 
            $size: {
              $filter: {
                input: '$leagues',
                as: 'l',
                cond: { $eq: ['$$l.active', true] }
              }
            }
          },
          team_count: { 
            $size: {
              $filter: {
                input: '$teams',
                as: 't',
                cond: { $eq: ['$$t.status', 'verified'] }
              }
            }
          }
        }
      },
      { $sort: { sort_order: 1 } }
    ]);
    res.json(sports);
  } catch (error) {
    next(error);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const sport = await Sport.findOne({ slug: req.params.slug });
    if (!sport) return res.status(404).json({ error: 'Sport not found' });
    res.json(sport);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, slug, icon, description, category, sort_order } = req.body;
    const sport = new Sport({ name, slug, icon, description, category, sort_order: sort_order || 0 });
    await sport.save();
    res.status(201).json({ id: sport._id });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, slug, icon, description, category, sort_order } = req.body;
    const sport = await Sport.findByIdAndUpdate(
      req.params.id,
      { name, slug, icon, description, category, sort_order },
      { new: true }
    );
    if (!sport) return res.status(404).json({ error: 'Sport not found' });
    res.json({ message: 'Updated' });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) return res.status(404).json({ error: 'Sport not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getBySlug, create, update, remove };
