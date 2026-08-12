const prisma = require('../config/db');

// @desc    Race calendar + classification for a racing sport
// @route   GET /api/v1/races?sportId=ID
// @access  Public
//
// A RACING sport (cycling, athletics) is not modelled as head-to-head fixtures.
// The public sport hub asks for everything in one call: the ranked race calendar,
// the series classification (GC / medal table) and the competition it belongs to.
const getRaces = async (req, res, next) => {
  try {
    const sportId = req.query.sportId ? parseInt(req.query.sportId) : undefined;

    const races = await prisma.race.findMany({
      where: sportId ? { sportId } : {},
      orderBy: [{ date: 'asc' }, { sortOrder: 'asc' }],
    });

    // The competition is the racing sport's primary league (its current season).
    const competition = sportId
      ? await prisma.league.findFirst({ where: { sportId }, orderBy: { id: 'asc' } })
      : null;

    const classification = competition
      ? await prisma.classification.findUnique({ where: { competitionId: competition.id } })
      : null;

    res.status(200).json({ success: true, data: { races, classification, competition } });
  } catch (error) {
    next(error);
  }
};

// @desc    Single race with its full ranked result
// @route   GET /api/v1/races/:id
// @access  Public
const getRace = async (req, res, next) => {
  try {
    const race = await prisma.race.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!race) return res.status(404).json({ success: false, message: 'Race not found' });
    res.status(200).json({ success: true, data: race });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRaces, getRace };
