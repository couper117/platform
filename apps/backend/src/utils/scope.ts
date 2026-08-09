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

module.exports = { enforceSportScope, leagueSportId, teamSportId };
