const prisma = require('../config/db');
const { recalcStandings } = require('../services/standings.service');
const { emitMatchUpdate, emitMatchEvent } = require('../services/realtime.service');
const logActivity = require('../utils/activityLogger');

// @desc    Get all fixtures
// @route   GET /api/v1/fixtures
// @access  Public
const getFixtures = async (req, res, next) => {
  try {
    const { leagueId, sportId, status, from, to } = req.query;
    const where = {};
    if (leagueId) where.leagueId = parseInt(leagueId);
    if (sportId) where.league = { sportId: parseInt(sportId) };
    if (status) where.status = status;
    if (from || to) {
      where.matchDate = {};
      if (from) where.matchDate.gte = new Date(from);
      if (to) where.matchDate.lte = new Date(to);
    }

    const fixtures = await prisma.fixture.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        competition: true,
      },
      orderBy: { matchDate: 'asc' },
    });

    res.status(200).json({ success: true, count: fixtures.length, data: fixtures });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fixture
// @route   GET /api/v1/fixtures/:id
// @access  Public
const getFixture = async (req, res, next) => {
  try {
    const fixture = await prisma.fixture.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        competition: true,
        events: {
          include: { player: true, player2: true },
          orderBy: { minute: 'asc' },
        },
        lineups: {
          include: { player: true },
        },
        liveState: true,
      },
    });

    if (!fixture) {
      return res.status(404).json({ success: false, message: 'Fixture not found' });
    }

    res.status(200).json({ success: true, data: fixture });
  } catch (error) {
    next(error);
  }
};

// @desc    Create fixture
// @route   POST /api/v1/fixtures
// @access  Private/Admin
const createFixture = async (req, res, next) => {
  try {
    const { leagueId, competitionId, homeTeamId, awayTeamId, matchday, venue, matchDate, referee, matchNotes, streamUrl } = req.body;

    const fixture = await prisma.fixture.create({
      data: {
        leagueId: parseInt(leagueId),
        competitionId: competitionId ? parseInt(competitionId) : null,
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
        matchday: parseInt(matchday) || 1,
        venue,
        matchDate: matchDate ? new Date(matchDate) : null,
        referee,
        matchNotes,
        streamUrl,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create Fixture',
      detail: `Created fixture ${homeTeamId} vs ${awayTeamId}`,
      module: 'fixtures',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: fixture });
  } catch (error) {
    next(error);
  }
};

// @desc    Save fixture result
// @route   POST /api/v1/fixtures/:id/result
// @access  Private/Admin
const saveResult = async (req, res, next) => {
  try {
    const { homeScore, awayScore, homeScoreHt, awayScoreHt, attendance, status } = req.body;
    const fixtureId = parseInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const fixture = await tx.fixture.update({
        where: { id: fixtureId },
        data: {
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          homeScoreHt: homeScoreHt ? parseInt(homeScoreHt) : null,
          awayScoreHt: awayScoreHt ? parseInt(awayScoreHt) : null,
          attendance: attendance ? parseInt(attendance) : null,
          status: status || 'COMPLETED',
        },
      });

      return fixture;
    });

    if (result.status === 'COMPLETED') {
      await recalcStandings(result.leagueId);
    }

    emitMatchUpdate(fixtureId, {
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      status: result.status,
    });

    await logActivity({
      userId: req.user.id,
      action: 'Save Result',
      detail: `Saved result for fixture ${fixtureId}: ${homeScore}-${awayScore}`,
      module: 'fixtures',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Add match event
// @route   POST /api/v1/fixtures/:id/events
// @access  Private/Admin
const addMatchEvent = async (req, res, next) => {
  try {
    const { eventType, minute, extraTime, teamId, playerId, player2Id, description } = req.body;
    const fixtureId = parseInt(req.params.id);

    const event = await prisma.matchEvent.create({
      data: {
        fixtureId,
        eventType,
        minute: parseInt(minute),
        extraTime: parseInt(extraTime) || 0,
        teamId: teamId ? parseInt(teamId) : null,
        playerId: playerId ? parseInt(playerId) : null,
        player2Id: player2Id ? parseInt(player2Id) : null,
        description,
      },
      include: { player: true, player2: true },
    });

    // Auto-increment score logic
    if (eventType === 'GOAL' || eventType === 'PENALTY') {
      const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
      const isHome = teamId == fixture.homeTeamId;
      
      const updatedFixture = await prisma.fixture.update({
        where: { id: fixtureId },
        data: {
          homeScore: isHome ? (fixture.homeScore || 0) + 1 : fixture.homeScore,
          awayScore: !isHome ? (fixture.awayScore || 0) + 1 : fixture.awayScore,
        },
      });

      emitMatchUpdate(fixtureId, {
        homeScore: updatedFixture.homeScore,
        awayScore: updatedFixture.awayScore,
      });
    } else if (eventType === 'OWN_GOAL') {
      const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
      const isHome = teamId == fixture.homeTeamId;
      
      const updatedFixture = await prisma.fixture.update({
        where: { id: fixtureId },
        data: {
          homeScore: !isHome ? (fixture.homeScore || 0) + 1 : fixture.homeScore,
          awayScore: isHome ? (fixture.awayScore || 0) + 1 : fixture.awayScore,
        },
      });

      emitMatchUpdate(fixtureId, {
        homeScore: updatedFixture.homeScore,
        awayScore: updatedFixture.awayScore,
      });
    }

    emitMatchEvent(fixtureId, event);

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFixtures,
  getFixture,
  createFixture,
  saveResult,
  addMatchEvent,
};
