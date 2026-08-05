const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const { uniqueSlug } = require('../utils/slug');

// @desc    Get all active leagues
// @route   GET /api/v1/leagues
// @access  Public
const getLeagues = async (req, res, next) => {
  try {
    const { sportId, gender, level, status } = req.query;
    
    const where = { active: true };
    if (sportId) where.sportId = parseInt(sportId);
    if (gender) where.gender = gender;
    if (level) where.level = level;
    if (status) where.status = status;

    const leagues = await prisma.league.findMany({
      where,
      include: {
        sport: true,
        federation: true,
        _count: {
          select: { teams: true, fixtures: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, count: leagues.length, data: leagues });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single league
// @route   GET /api/v1/leagues/:id
// @access  Public
const getLeague = async (req, res, next) => {
  try {
    const league = await prisma.league.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sport: true,
        federation: true,
        teams: {
          include: { team: true },
        },
        standings: {
          include: { team: true },
        },
        topScorers: {
          include: { player: true, team: true },
          orderBy: [{ goals: 'desc' }, { assists: 'desc' }],
        },
      },
    });

    if (!league || !league.active) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    // Sort the standings table: points, then goal difference, then goals for.
    league.standings.sort(
      (a, b) =>
        b.points - a.points ||
        (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor
    );
    league.standings = league.standings.map((s, i) => ({ ...s, rank: i + 1 }));

    res.status(200).json({ success: true, data: league });
  } catch (error) {
    next(error);
  }
};

// @desc    Create league
// @route   POST /api/v1/leagues
// @access  Private/Admin
const createLeague = async (req, res, next) => {
  try {
    const { 
      name, sportId, federationId, season, gender, 
      ageCategory, level, format, status, maxTeams, 
      description, startDate, endDate 
    } = req.body;

    const league = await prisma.league.create({
      data: {
        name,
        slug: await uniqueSlug('league', name),
        sportId: parseInt(sportId),
        federationId: federationId ? parseInt(federationId) : null,
        season,
        gender,
        ageCategory,
        level,
        format,
        status,
        maxTeams: parseInt(maxTeams) || 16,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create League',
      detail: `Created league ${name}`,
      module: 'leagues',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: league });
  } catch (error) {
    next(error);
  }
};

// @desc    Update league
// @route   PUT /api/v1/leagues/:id
// @access  Private/Admin
const updateLeague = async (req, res, next) => {
  try {
    const { 
      name, sportId, federationId, season, gender, 
      ageCategory, level, format, status, maxTeams, 
      description, startDate, endDate, active 
    } = req.body;

    const league = await prisma.league.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        slug: name ? await uniqueSlug('league', name, parseInt(req.params.id)) : undefined,
        sportId: sportId ? parseInt(sportId) : undefined,
        federationId: federationId ? parseInt(federationId) : undefined,
        season,
        gender,
        ageCategory,
        level,
        format,
        status,
        maxTeams: maxTeams ? parseInt(maxTeams) : undefined,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        active: active !== undefined ? (active === 'true' || active === true) : undefined,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Update League',
      detail: `Updated league ${league.name}`,
      module: 'leagues',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: league });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete league
// @route   DELETE /api/v1/leagues/:id
// @access  Private/Admin
const deleteLeague = async (req, res, next) => {
  try {
    const league = await prisma.league.update({
      where: { id: parseInt(req.params.id) },
      data: { active: false },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Delete League',
      detail: `Soft-deleted league ${league.name}`,
      module: 'leagues',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'League deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add team to league
// @route   POST /api/v1/leagues/:id/teams/:teamId
// @access  Private/Admin
const addTeamToLeague = async (req, res, next) => {
  try {
    const leagueId = parseInt(req.params.id);
    const teamId = parseInt(req.params.teamId);

    // Enforce the league's team cap.
    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    const currentCount = await prisma.leagueTeam.count({ where: { leagueId } });
    if (currentCount >= league.maxTeams) {
      return res.status(400).json({ success: false, message: `League is full (max ${league.maxTeams} teams)` });
    }

    const leagueTeam = await prisma.leagueTeam.create({
      data: {
        leagueId,
        teamId,
      },
    });

    // Also initialize standings row for this team in this league
    await prisma.standing.upsert({
      where: {
        leagueId_teamId: { leagueId, teamId },
      },
      update: {},
      create: {
        leagueId,
        teamId,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Add Team to League',
      detail: `Added team ${teamId} to league ${leagueId}`,
      module: 'leagues',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: leagueTeam });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove team from league
// @route   DELETE /api/v1/leagues/:id/teams/:teamId
// @access  Private/Admin
const removeTeamFromLeague = async (req, res, next) => {
  try {
    const leagueId = parseInt(req.params.id);
    const teamId = parseInt(req.params.teamId);

    await prisma.leagueTeam.delete({
      where: {
        leagueId_teamId: { leagueId, teamId },
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Remove Team from League',
      detail: `Removed team ${teamId} from league ${leagueId}`,
      module: 'leagues',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Team removed from league' });
  } catch (error) {
    next(error);
  }
};

// @desc    Standings table for a league (sorted + ranked)
// @route   GET /api/v1/leagues/:id/standings
// @access  Public
const getLeagueStandings = async (req, res, next) => {
  try {
    const leagueId = parseInt(req.params.id);
    const standings = await prisma.standing.findMany({
      where: { leagueId },
      include: { team: true },
    });
    standings.sort(
      (a, b) =>
        b.points - a.points ||
        (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor
    );
    res.status(200).json({ success: true, data: standings.map((s, i) => ({ ...s, rank: i + 1 })) });
  } catch (error) {
    next(error);
  }
};

// @desc    Top scorers for a league
// @route   GET /api/v1/leagues/:id/scorers
// @access  Public
const getLeagueScorers = async (req, res, next) => {
  try {
    const leagueId = parseInt(req.params.id);
    const scorers = await prisma.topScorer.findMany({
      where: { leagueId },
      include: { player: true, team: true },
      orderBy: [{ goals: 'desc' }, { assists: 'desc' }],
    });
    res.status(200).json({ success: true, data: scorers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeagues,
  getLeague,
  createLeague,
  updateLeague,
  deleteLeague,
  addTeamToLeague,
  removeTeamFromLeague,
  getLeagueStandings,
  getLeagueScorers,
};
