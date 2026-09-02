const prisma = require('../config/db');

/**
 * Enforce that a FEDERATION_ADMIN only acts on their assigned sport. Other
 * roles (SUPERADMIN, LEAGUE_ADMIN, TEAM_MANAGER) already passed their own
 * authorize/ownership checks and are not sport-scoped here.
 * Returns true if allowed; otherwise writes a 403 and returns false.
 */
const enforceSportScope = (req, res, sportId) => {
  if (req.user?.role === 'FEDERATION_ADMIN') {
    if (req.user.sportId == null || Number(req.user.sportId) !== Number(sportId)) {
      res.status(403).json({ success: false, message: 'Not authorized for this sport' });
      return false;
    }
  }
  return true;
};

/** Resolve the sport a league belongs to (leagues carry sportId directly). */
const leagueSportId = async (leagueId) => {
  const league = await prisma.league.findUnique({ where: { id: Number(leagueId) }, select: { sportId: true } });
  return league?.sportId ?? null;
};

/** Resolve the sport a team belongs to. */
const teamSportId = async (teamId) => {
  const team = await prisma.team.findUnique({ where: { id: Number(teamId) }, select: { sportId: true } });
  return team?.sportId ?? null;
};

/**
 * Enforce that a LEAGUE_ADMIN only acts on a league they were assigned to.
 *
 * enforceSportScope() deliberately does nothing for this role — it confines a
 * federation admin to their sport and says so. The gap was that nothing else
 * confined a league admin to their league: LeagueAdminAssignment was consulted
 * for fixtures and nowhere else, so an administrator of one competition could
 * edit another, add and remove its teams, regenerate its calendar or delete it
 * outright. The assignment table existed; four of the five places that needed it
 * simply never asked.
 *
 * Returns true if allowed; otherwise writes a 403 and returns false, matching
 * enforceSportScope so the two compose in a single guard clause.
 */
const enforceLeagueScope = async (req, res, leagueId) => {
  if (req.user?.role !== 'LEAGUE_ADMIN') return true;

  const id = Number(leagueId);
  if (!Number.isFinite(id)) {
    res.status(400).json({ success: false, message: 'A league is required' });
    return false;
  }

  const assigned = await prisma.leagueAdminAssignment.findUnique({
    where: { leagueId_userId: { leagueId: id, userId: req.user.id } },
  });
  if (!assigned) {
    res.status(403).json({ success: false, message: 'Not authorized for this league' });
    return false;
  }
  return true;
};

/**
 * The same check for a resource that hangs off a league rather than being one.
 * Resolves the league first so callers pass what they have.
 */
const enforceFixtureLeagueScope = async (req, res, fixtureId) => {
  if (req.user?.role !== 'LEAGUE_ADMIN') return true;
  const fixture = await prisma.fixture.findUnique({
    where: { id: Number(fixtureId) },
    select: { leagueId: true },
  });
  if (!fixture) {
    res.status(404).json({ success: false, message: 'Fixture not found' });
    return false;
  }
  return enforceLeagueScope(req, res, fixture.leagueId);
};

/**
 * Enforce that a LEAGUE_ADMIN only acts on a player who plays in one of their
 * competitions.
 *
 * Suspensions and transfers hang off a player, not a league, so there is no
 * leagueId to check — but banning someone or moving them between clubs is
 * exactly the kind of decision that should stay inside the competition whose
 * rules are being applied. The link is the player's team and the leagues it is
 * entered in.
 *
 * A federation admin is confined by sport instead, which is the same idea one
 * level up, so both are applied here and callers get one guard clause.
 */
const enforcePlayerScope = async (req, res, playerId) => {
  const role = req.user?.role;
  if (role !== 'LEAGUE_ADMIN' && role !== 'FEDERATION_ADMIN') return true;

  const player = await prisma.player.findUnique({
    where: { id: Number(playerId) },
    select: { team: { select: { sportId: true, leagues: { select: { leagueId: true } } } } },
  });
  if (!player) {
    res.status(404).json({ success: false, message: 'Player not found' });
    return false;
  }

  if (role === 'FEDERATION_ADMIN') {
    return enforceSportScope(req, res, player.team?.sportId);
  }

  const theirs = await assignedLeagueIds(req.user);
  const playerLeagues = (player.team?.leagues || []).map((l) => l.leagueId);
  if (!playerLeagues.some((id) => theirs.includes(id))) {
    res.status(403).json({
      success: false,
      message: 'This player does not play in a competition you administer.',
    });
    return false;
  }
  return true;
};

/** The leagues a LEAGUE_ADMIN may act on, for filtering a list query. */
const assignedLeagueIds = async (user) => {
  if (user?.role !== 'LEAGUE_ADMIN') return null; // null = unrestricted
  const rows = await prisma.leagueAdminAssignment.findMany({
    where: { userId: user.id },
    select: { leagueId: true },
  });
  return rows.map((r) => r.leagueId);
};

module.exports = {
  enforceSportScope,
  enforceLeagueScope,
  enforcePlayerScope,
  enforceFixtureLeagueScope,
  assignedLeagueIds,
  leagueSportId,
  teamSportId,
};
