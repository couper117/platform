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