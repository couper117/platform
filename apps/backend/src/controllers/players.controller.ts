const prisma = require('../config/db');
const { assignedLeagueIds } = require('../utils/scope');
const { canSeePersonalData, redactPlayer } = require('../services/privacy.service');
const { getPlayerSeason } = require('../services/playerStats.service');
const { specFor, sanitiseStats } = require('../config/playerStatSpec');
const { getPagination } = require('../utils/paginate');
const { uploadImage, deleteImage } = require('../services/storage.service');
const logActivity = require('../utils/activityLogger');
const { getRules, validatePlayerInTeam } = require('../services/eligibility.service');

// A team may be managed by its manager, a super admin, or the federation admin
// of that team's sport.
const canManageTeam = (user, team) =>
  user.role === 'SUPERADMIN' ||
  user.id === team.managerUserId ||
  (user.role === 'FEDERATION_ADMIN' && Number(user.sportId) === Number(team.sportId));

/** Returned when a role should see nothing rather than everything. */
const DENY_ALL = Symbol('deny-all');

/**
 * Extra `where` clauses confining a player list to the caller's remit.
 *
 * Returns null for an account that may see every player, DENY_ALL for one whose
 * remit is empty. That distinction matters: a federation admin attached to no
 * federation, or a league admin assigned to no league, has a remit of nothing —
 * and "nothing" must not fall through to "everything", which is precisely how an
 * unscoped list becomes a leak.
 */
const playerScopeWhere = async (user) => {
  if (!user || user.role === 'SUPERADMIN') return null;

  if (user.role === 'TEAM_MANAGER') {
    return { team: { managerUserId: user.id } };
  }

  if (user.role === 'FEDERATION_ADMIN') {
    if (user.sportId == null) return DENY_ALL;
    return { team: { sportId: Number(user.sportId) } };
  }

  if (user.role === 'LEAGUE_ADMIN') {
    const leagueIds = await assignedLeagueIds(user);
    if (!leagueIds || leagueIds.length === 0) return DENY_ALL;
    // Players of the clubs entered in the competitions they run.
    return { team: { leagues: { some: { leagueId: { in: leagueIds } } } } };
  }

  return DENY_ALL;
};

// @desc    Get all players
// @route   GET /api/v1/players
// @access  Private (Admin)
const getPlayers = async (req, res, next) => {
  try {
    const { teamId, status, sportId, search } = req.query;
    const where: any = { active: true };
    if (teamId) where.teamId = parseInt(teamId);
    if (status) where.status = status;
    if (sportId) where.team = { sportId: parseInt(sportId) };
    if (search) where.fullName = { contains: search, mode: 'insensitive' };

    // Confine the list to what this account is responsible for.
    //
    // There was no scoping here at all: `players.read` is held by team managers,
    // league admins and federation admins alike, so every one of them could list
    // every player on the platform — a club manager could read all eleven other
    // squads, and the response embedded each player's identity documents. These
    // are dates of birth and passport records, and art. 47 of Law 058/2021 asks
    // for them to be seen only by those who need them.
    const scope = await playerScopeWhere(req.user);
    if (scope === DENY_ALL) {
      return res.status(200).json({ success: true, count: 0, total: 0, data: [] });
    }
    if (scope) Object.assign(where, scope);

    const { skip, take } = getPagination(req.query);
    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: {
          team: true,
          // A summary, not the documents themselves. A list needs to show who is
          // verified and who is still missing paperwork; it never needs to carry
          // the records to do that. The single-player endpoint returns them, and
          // redacts by role on the way out.
          _count: { select: { documents: true } },
        },
        orderBy: { fullName: 'asc' },
        skip,
        take,
      }),
      prisma.player.count({ where }),
    ]);

    const data = players.map(({ _count, ...p }) => ({ ...p, documentCount: _count.documents }));

    res.status(200).json({ success: true, count: data.length, total, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single player
// @route   GET /api/v1/players/:id
// @access  Public
// Public player profile. Verification documents evidence a person's identity and
// their date of birth and national ID identify them off the pitch, so both are
// withheld from anyone without a verification or eligibility duty
// (Law N° 058/2021 art. 46, 47).
const getPlayer = async (req, res, next) => {
  try {
    const privileged = canSeePersonalData(req.user);

    const player = await prisma.player.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        team: true,
        ...(privileged ? { documents: true } : {}),
        suspensions: { where: { active: true } },
        // Clubs before this one. Ordered so the current spell leads and the rest
        // read backwards in time, which is how a career is written down.
        career: { orderBy: [{ current: 'desc' }, { fromYear: 'desc' }, { toYear: 'desc' }] },
      },
    });

    if (!player || !player.active) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    // The season sheet and recent form the profile page has always been built to
    // show, and which no endpoint used to return. Derived from lineups and match
    // events, so a player who has not played yet gets an empty object and the page
    // hides the block rather than leading with a row of zeroes.
    const { season, form, recordedSeason } = await getPlayerSeason(player);

    const body = privileged ? player : redactPlayer(player);

    res.status(200).json({
      success: true,
      data: {
        ...body,
        // The profile picks its stat vocabulary by sport — points and rebounds for
        // a basketballer, goals and clean sheets for a footballer. That lives on
        // the team, so without it every player fell back to a generic list.
        sportId: player.team?.sportId ?? null,
        season,
        form,
        // Which season the recorded numbers belong to, so the profile can label
        // the block honestly instead of always saying "this season".
        recordedSeason,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add player to team
// @route   POST /api/v1/players
// @access  Private (Team Manager or Admin)
const createPlayer = async (req, res, next) => {
  try {
    const { teamId, fullName, dateOfBirth, nationality, idNumber, licenseNo, position, jerseyNumber, skillLevel, gender, height, weight, bio } = req.body;

    // Auth check
    const team = await prisma.team.findUnique({ where: { id: parseInt(teamId) } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (!canManageTeam(req.user, team)) {
      return res.status(403).json({ success: false, message: 'Not authorized to add players to this team' });
    }

    // Eligibility: jersey uniqueness, squad max, foreign quota.
    const rules = await getRules();
    const issues = await validatePlayerInTeam(parseInt(teamId), { jerseyNumber, nationality }, rules);
    if (issues.length) {
      return res.status(422).json({ success: false, message: issues[0], issues });
    }

    let photo = null;
    if (req.file) {
      photo = await uploadImage(req.file, 'players', 400, 400, { uploadedById: req.user?.id, purpose: 'avatar' });
    }

    const player = await prisma.player.create({
      data: {
        teamId: parseInt(teamId),
        fullName,
        photo,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality,
        idNumber: idNumber || null,
        licenseNo: licenseNo || null,
        position,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
        skillLevel,
        gender,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        bio,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Player',
      detail: `Created player ${fullName} in team ${team.name}`,
      module: 'players',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

// @desc    Update player
// @route   PUT /api/v1/players/:id
// @access  Private (Team Manager or Admin)
const updatePlayer = async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id);
    let player = await prisma.player.findUnique({ 
      where: { id: playerId },
      include: { team: true }
    });

    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

    if (!canManageTeam(req.user, player.team)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this player' });
    }

    const { fullName, dateOfBirth, nationality, idNumber, licenseNo, position, jerseyNumber, skillLevel, gender, height, weight, bio, active } = req.body;

    // Re-check jersey/foreign quota against the rest of the squad.
    if (jerseyNumber !== undefined || nationality !== undefined) {
      const rules = await getRules();
      const issues = await validatePlayerInTeam(
        player.teamId,
        { jerseyNumber: jerseyNumber ?? player.jerseyNumber, nationality: nationality ?? player.nationality },
        rules,
        { excludePlayerId: playerId }
      );
      // Ignore the squad-size rule here (updating an existing player never grows the squad).
      const blocking = issues.filter((i) => !/Squad is full/.test(i));
      if (blocking.length) return res.status(422).json({ success: false, message: blocking[0], issues: blocking });
    }

    let photo = player.photo;
    if (req.file) {
      if (player.photo) await deleteImage(player.photo);
      photo = await uploadImage(req.file, 'players', 400, 400, { uploadedById: req.user?.id, purpose: 'avatar' });
    }

    player = await prisma.player.update({
      where: { id: playerId },
      data: {
        fullName,
        photo,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        nationality,
        idNumber: idNumber !== undefined ? (idNumber || null) : undefined,
        licenseNo: licenseNo !== undefined ? (licenseNo || null) : undefined,
        position,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
        skillLevel,
        gender,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        bio,
        active: active !== undefined ? (active === 'true' || active === true) : undefined,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Update Player',
      detail: `Updated player ${player.fullName}`,
      module: 'players',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove player from team
// @route   DELETE /api/v1/players/:id
// @access  Private (Team Manager or Admin)
const deletePlayer = async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id);
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true },
    });

    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

    if (req.user.role !== 'SUPERADMIN' && req.user.id !== player.team.managerUserId) {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this player' });
    }

    await prisma.player.update({
      where: { id: playerId },
      data: { active: false },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Delete Player',
      detail: `Removed player ${player.fullName} from team ${player.team.name}`,
      module: 'players',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Player removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Every recorded season for a player
// @route   GET /api/v1/players/:id/stats
// @access  Private (players.write)
const getPlayerStats = async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id, 10);
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, fullName: true, team: { select: { sportId: true } } },
    });
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

    const seasons = await prisma.playerSeasonStat.findMany({
      where: { playerId },
      orderBy: { season: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        // The editor builds its fields from the sport, so it is told which one.
        sportId: player.team?.sportId ?? null,
        spec: specFor(player.team?.sportId),
        seasons,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record (or correct) a player's numbers for one season
// @route   PUT /api/v1/players/:id/stats
// @access  Private (players.write)
const upsertPlayerStats = async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id, 10);
    const season = String(req.body.season || '').trim();
    if (!season) {
      return res.status(422).json({ success: false, message: 'A season is required, e.g. 2025/2026' });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: { select: { name: true, sportId: true } } },
    });
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

    // Only keys the spec knows, coerced to numbers, blanks dropped. A cleared
    // field REMOVES the stat rather than storing a zero — see sanitiseStats.
    const stats = sanitiseStats(req.body.stats);

    // Nothing left means the season has been emptied, which is a delete. Leaving a
    // row of {} behind would make the profile think a season had been recorded.
    if (Object.keys(stats).length === 0) {
      await prisma.playerSeasonStat.deleteMany({ where: { playerId, season } });
      await logActivity({
        userId: req.user.id,
        action: 'Clear Player Season',
        detail: `Cleared ${season} statistics for ${player.fullName}`,
        module: 'players',
        ip: req.ip,
      });
      return res.status(200).json({ success: true, data: null });
    }

    const saved = await prisma.playerSeasonStat.upsert({
      where: { playerId_season: { playerId, season } },
      update: { stats, updatedBy: req.user.id },
      create: { playerId, season, stats, updatedBy: req.user.id },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Update Player Season',
      detail: `Recorded ${season} statistics for ${player.fullName}`,
      module: 'players',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

module.exports = {

  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getPlayerStats,
  upsertPlayerStats,
};
