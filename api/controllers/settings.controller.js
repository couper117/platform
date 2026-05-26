const Setting = require('../models/Setting');

const getAll = async (req, res, next) => {
  try {
    const rows = await Setting.find().sort({ group_name: 1, skey: 1 });
    const settings = {};
    for (const row of rows) {
      settings[row.skey] = row.sval;
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    const operations = entries.map(([key, value]) => ({
      updateOne: {
        filter: { skey: key },
        update: { $set: { sval: value } },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await Setting.bulkWrite(operations);
    }
    
    res.json({ message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, update };
