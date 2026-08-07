const prisma = require('../config/db');
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

// @desc    Get all players
// @route   GET /api/v1/players
// @access  Private (Admin)
const getPlayers = async (req, res, next) => {
  try {
    const { teamId, status, sportId, search } = req.query;
    const where = { active: true };
    if (teamId) where.teamId = parseInt(teamId);
    if (status) where.status = status;
    if (sportId) where.team = { sportId: parseInt(sportId) };
    if (search) where.fullName = { contains: search, mode: 'insensitive' };

    const { skip, take } = getPagination(req.query);
    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: { team: true, documents: true },
        orderBy: { fullName: 'asc' },
        skip,
        take,
      }),
      prisma.player.count({ where }),
    ]);

    res.status(200).json({ success: true, count: players.length, total, data: players });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single player
// @route   GET /api/v1/players/:id
// @access  Public
const getPlayer = async (req, res, next) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        team: true,
        documents: true,
        suspensions: { where: { active: true } },
      },
    });

    if (!player || !player.active) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    res.status(200).json({ success: true, data: player });
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
      photo = await uploadImage(req.file, 'players', 400, 400);
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
      photo = await uploadImage(req.file, 'players', 400, 400);
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

module.exports = {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
};
