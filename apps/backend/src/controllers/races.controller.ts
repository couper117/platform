const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');

// A FEDERATION_ADMIN may only manage races/classifications in their own sport.
const canManageSport = (user, sportId) =>
  user.role !== 'FEDERATION_ADMIN' || user.sportId == null || Number(sportId) === Number(user.sportId);

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

// @desc    Create a race (a stage / individual event) for a RACING sport
// @route   POST /api/v1/races
// @access  Private (SUPERADMIN, FEDERATION_ADMIN of that sport)
const createRace = async (req, res, next) => {
  try {
    const { sportId, name, discipline, distanceKm, unit, date, status, sortOrder, results } = req.body;
    if (!sportId || !name) return res.status(400).json({ success: false, message: 'sportId and name are required' });
    if (!canManageSport(req.user, sportId)) {
      return res.status(403).json({ success: false, message: 'You can only manage races in your own sport' });
    }
    const race = await prisma.race.create({
      data: {
        sportId: parseInt(sportId),
        name,
        discipline: discipline || null,
        distanceKm: distanceKm != null && distanceKm !== '' ? Number(distanceKm) : null,
        unit: unit || null,
        date: date ? new Date(date) : null,
        status: status || 'SCHEDULED',
        sortOrder: sortOrder != null ? parseInt(sortOrder) : 0,
        results: Array.isArray(results) ? results : [],
      },
    });
    await logActivity({ userId: req.user.id, action: 'Create Race', detail: `Created race ${name}`, module: 'racing', ip: req.ip });
    res.status(201).json({ success: true, data: race });
  } catch (error) {
    next(error);
  }
};

// @desc    Enter / replace a race's ranked result (the finish order + times/marks)
// @route   PATCH /api/v1/races/:id/results
// @access  Private (SUPERADMIN, FEDERATION_ADMIN)
const updateRaceResults = async (req, res, next) => {
  try {
    const { results, status } = req.body;
    if (!Array.isArray(results)) return res.status(400).json({ success: false, message: 'results must be an array' });
    const existing = await prisma.race.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Race not found' });
    if (!canManageSport(req.user, existing.sportId)) {
      return res.status(403).json({ success: false, message: 'You can only manage races in your own sport' });
    }
    const race = await prisma.race.update({
      where: { id: existing.id },
      data: { results, status: status || existing.status },
    });
    await logActivity({ userId: req.user.id, action: 'Enter Race Results', detail: `Results entered for ${existing.name}`, module: 'racing', ip: req.ip });
    res.status(200).json({ success: true, data: race });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a race's metadata (name, date, status, distance…)
// @route   PATCH /api/v1/races/:id
// @access  Private (SUPERADMIN, FEDERATION_ADMIN)
const updateRace = async (req, res, next) => {
  try {
    const existing = await prisma.race.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Race not found' });
    if (!canManageSport(req.user, existing.sportId)) {
      return res.status(403).json({ success: false, message: 'You can only manage races in your own sport' });
    }
    const { name, discipline, distanceKm, unit, date, status, sortOrder } = req.body;
    const race = await prisma.race.update({
      where: { id: existing.id },
      data: {
        name: name ?? undefined,
        discipline: discipline ?? undefined,
        distanceKm: distanceKm != null && distanceKm !== '' ? Number(distanceKm) : undefined,
        unit: unit ?? undefined,
        date: date ? new Date(date) : undefined,
        status: status ?? undefined,
        sortOrder: sortOrder != null ? parseInt(sortOrder) : undefined,
      },
    });
    await logActivity({ userId: req.user.id, action: 'Update Race', detail: `Updated race ${existing.name}`, module: 'racing', ip: req.ip });
    res.status(200).json({ success: true, data: race });
  } catch (error) {
    next(error);
  }
};

// @desc    Upsert a series classification (GC / medal table) for a competition
// @route   PUT /api/v1/races/classification/:competitionId
// @access  Private (SUPERADMIN, FEDERATION_ADMIN)
//
// A racing competition is modelled as a League; its Classification is the
// season-long standing (riders by cumulative time, or clubs by a medal table).
const upsertClassification = async (req, res, next) => {
  try {
    const competitionId = parseInt(req.params.competitionId);
    const { title, identityLabel, valueColumns, rows } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });
    const league = await prisma.league.findUnique({ where: { id: competitionId } });
    if (!league) return res.status(404).json({ success: false, message: 'Competition not found' });
    if (!canManageSport(req.user, league.sportId)) {
      return res.status(403).json({ success: false, message: 'You can only manage your own sport' });
    }
    const data = {
      title,
      identityLabel: identityLabel || null,
      valueColumns: Array.isArray(valueColumns) ? valueColumns : [],
      rows: Array.isArray(rows) ? rows : [],
    };
    const classification = await prisma.classification.upsert({
      where: { competitionId },
      create: { competitionId, ...data },
      update: data,
    });
    await logActivity({ userId: req.user.id, action: 'Update Classification', detail: `Classification updated for competition ${competitionId}`, module: 'racing', ip: req.ip });
    res.status(200).json({ success: true, data: classification });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRaces, getRace, createRace, updateRaceResults, updateRace, upsertClassification };
