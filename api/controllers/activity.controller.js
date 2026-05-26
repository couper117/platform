const ActivityLog = require('../models/ActivityLog');

const getAll = async (req, res, next) => {
  try {
    const { user_id, module, limit = 100 } = req.query;
    const query = {};

    if (user_id) query.user_id = user_id;
    if (module) query.module = module;

    const logs = await ActivityLog.find(query)
      .populate('user_id', 'username full_name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Map to match old response structure if needed
    const response = logs.map(log => ({
      ...log.toObject(),
      user_name: log.user_id?.full_name,
      username: log.user_id?.username
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll };
