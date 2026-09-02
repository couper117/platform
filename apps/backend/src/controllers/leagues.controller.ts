const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const { uniqueSlug } = require('../utils/slug');
const { enforceSportScope, enforceLeagueScope } = require('../utils/scope');
const { getRules, validateTeamForLeague } = require('../services/eligibility.service');

// @desc    Get all active leagues
// @route   GET /api/v1/leagues
// @access  Public
const getLeagues = async (req, res, next) => {
  try {
    const { sportId, gender, level, status } = req.query;
    
    const where: any = { active: true };
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

    // Federation admins can only create leagues in their own sport (default to
    // it when unspecified, reject a mismatched one).
    const bodySid = sportId ? parseInt(sportId) : null;
    const sid = req.user.role === 'FEDERATION_ADMIN' ? (bodySid ?? req.user.sportId) : bodySid;
    if (!enforceSportScope(req, res, sid)) return;

    const league = await prisma.league.create({
      data: {
        name,
        slug: await uniqueSlug('league', name),
        sportId: sid,
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

    // A league admin who creates a competition is assigned to it. Without this
    // they would create a league and immediately be unable to touch it, now that
    // every write path checks the assignment — the new league would be
    // unreachable until a super admin assigned someone to it by hand.
    if (req.user.role === 'LEAGUE_ADMIN') {
      await prisma.leagueAdminAssignment.create({
        data: { leagueId: league.id, userId: req.user.id },
      });
    }

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

    // Scope: a federation admin may only edit a league in their sport, and
    // cannot move it into a sport they don't own.
    const existing = await prisma.league.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'League not found' });
    if (!enforceSportScope(req, res, existing.sportId)) return;
    if (sportId && !enforceSportScope(req, res, parseInt(sportId))) return;
    // ...and a league admin only one they were assigned to.
    if (!(await enforceLeagueScope(req, res, existing.id))) return;

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
    const existing = await prisma.league.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'League not found' });
    if (!enforceSportScope(req, res, existing.sportId)) return;
    if (!(await enforceLeagueScope(req, res, existing.id))) return;

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

    // Enforce the league's team cap + sport scope.
    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    if (!enforceSportScope(req, res, league.sportId)) return;
    if (!(await enforceLeagueScope(req, res, leagueId))) return;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.sportId && team.sportId !== league.sportId) {
      return res.status(400).json({ success: false, message: 'Team plays a different sport than this league' });
    }

    const currentCount = await prisma.leagueTeam.count({ where: { leagueId } });
    if (currentCount >= league.maxTeams) {
      return res.status(400).json({ success: false, message: `League is full (max ${league.maxTeams} teams)` });
    }

    // Eligibility gate: verified team, minimum squad, foreign quota, per-player
    // age/gender for the competition. A super/federation admin may override with
    // ?force=true after reviewing the violations.
    const rules = await getRules();
    const issues = await validateTeamForLeague(team, league, rules);
    const force = req.query.force === 'true' || req.body?.force === true;
    if (issues.length && !force) {
      return res.status(422).json({ success: false, message: 'Team is not eligible for this competition', issues });
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

    // This had no authorisation check at all — not the sport one its sibling
    // addTeamToLeague already had, and not the league one. Removing a team from
    // a competition is the more damaging half of the pair: it drops their
    // fixtures and their place in the table.
    const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { id: true, sportId: true } });
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    if (!enforceSportScope(req, res, league.sportId)) return;
    if (!(await enforceLeagueScope(req, res, leagueId))) return;

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
