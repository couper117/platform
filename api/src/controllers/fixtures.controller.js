const prisma = require('../config/db');
const { recalcStandings } = require('../services/standings.service');
const { emitMatchUpdate, emitMatchEvent } = require('../services/realtime.service');
const { getPagination } = require('../utils/paginate');
const { enforceSportScope, leagueSportId } = require('../utils/scope');
const logActivity = require('../utils/activityLogger');

const getFixtures = async (req, res, next) => {
  try {
    const { leagueId, sportId, status, from, to, teamId } = req.query;
    const where = {};
    if (leagueId) where.leagueId = parseInt(leagueId);
    if (sportId) where.league = { sportId: parseInt(sportId) };
    if (status) where.status = status;
    if (teamId) {
      where.OR = [
        { homeTeamId: parseInt(teamId) },
        { awayTeamId: parseInt(teamId) }
      ];
    }
    if (from || to) {
      where.matchDate = {};
      if (from) where.matchDate.gte = new Date(from);
      if (to) where.matchDate.lte = new Date(to);
    }

    const { skip, take } = getPagination(req.query);
    const [fixtures, total] = await Promise.all([
      prisma.fixture.findMany({
        where,
        include: { homeTeam: true, awayTeam: true, league: true, competition: true },
        orderBy: { matchDate: 'asc' },
        skip,
        take,
      }),
      prisma.fixture.count({ where }),
    ]);

    res.status(200).json({ success: true, count: fixtures.length, total, data: fixtures });
  } catch (error) {
    next(error);
  }
};

const getFixture = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const fixture = await prisma.fixture.findUnique({
      where: { id },
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

const createFixture = async (req, res, next) => {
  try {
    const { leagueId, competitionId, homeTeamId, awayTeamId, matchday, venue, matchDate, referee, matchNotes, streamUrl } = req.body;

    const lid = parseInt(leagueId);
    const hid = parseInt(homeTeamId);
    const aid = parseInt(awayTeamId);

    // Authorization check for LEAGUE_ADMIN
    if (req.user.role === 'LEAGUE_ADMIN') {
      const isAssigned = await prisma.leagueAdminAssignment.findUnique({
        where: { leagueId_userId: { leagueId: lid, userId: req.user.id } }
      });
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned to this league' });
    }

    // Integrity checks: distinct teams, league exists, both teams registered.
    if (hid === aid) {
      return res.status(400).json({ success: false, message: 'A team cannot play against itself' });
    }
    const league = await prisma.league.findUnique({ where: { id: lid } });
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    if (!enforceSportScope(req, res, league.sportId)) return;
    const memberships = await prisma.leagueTeam.findMany({
      where: { leagueId: lid, teamId: { in: [hid, aid] } },
    });
    if (memberships.length < 2) {
      return res.status(400).json({ success: false, message: 'Both teams must be registered in this league' });
    }

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

const saveResult = async (req, res, next) => {
  try {
    const { homeScore, awayScore, homeScoreHt, awayScoreHt, attendance, status } = req.body;
    const fixtureId = parseInt(req.params.id);
    if (isNaN(fixtureId)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });

    // Authorization check — reporter may be assigned to the fixture OR its league.
    if (req.user.role === 'MATCH_REPORTER') {
      const isAssigned = await prisma.reporterAssignment.findFirst({
        where: {
          OR: [
            { fixtureId, userId: req.user.id },
            { leagueId: fixture.leagueId, userId: req.user.id },
          ],
        },
      });
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned to this match/league' });
    } else if (req.user.role === 'LEAGUE_ADMIN') {
      const isAssigned = await prisma.leagueAdminAssignment.findUnique({
        where: { leagueId_userId: { leagueId: fixture.leagueId, userId: req.user.id } }
      });
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned to this league' });
    } else if (req.user.role === 'FEDERATION_ADMIN') {
      if (!enforceSportScope(req, res, await leagueSportId(fixture.leagueId))) return;
    }

    const result = await prisma.fixture.update({
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

    if (result.status === 'COMPLETED') {
      await recalcStandings(result.leagueId);
    }

    // Keep live state in sync with the saved result.
    await prisma.liveMatchState.upsert({
      where: { fixtureId },
      update: {
        homeScore: result.homeScore ?? 0,
        awayScore: result.awayScore ?? 0,
        status: result.status === 'LIVE' ? 'live' : result.status.toLowerCase(),
      },
      create: {
        fixtureId,
        homeScore: result.homeScore ?? 0,
        awayScore: result.awayScore ?? 0,
        status: result.status === 'LIVE' ? 'live' : result.status.toLowerCase(),
      },
    });

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

const addMatchEvent = async (req, res, next) => {
  try {
    const { eventType, minute, extraTime, teamId, playerId, player2Id, description, refereeName } = req.body;
    const fixtureId = parseInt(req.params.id);
    if (isNaN(fixtureId)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });

    // Authorization check
    if (req.user.role === 'MATCH_REPORTER') {
      const isAssigned = await prisma.reporterAssignment.findFirst({
        where: { 
          OR: [
            { fixtureId, userId: req.user.id },
            { leagueId: fixture.leagueId, userId: req.user.id }
          ]
        }
      });
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned to this match/league' });
    } else if (req.user.role === 'LEAGUE_ADMIN') {
      const isAssigned = await prisma.leagueAdminAssignment.findUnique({
        where: { leagueId_userId: { leagueId: fixture.leagueId, userId: req.user.id } }
      });
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned to this league' });
    } else if (req.user.role === 'FEDERATION_ADMIN') {
      if (!enforceSportScope(req, res, await leagueSportId(fixture.leagueId))) return;
    }

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
        refereeName,
      },
      include: { player: true, player2: true },
    });

    const minuteNum = parseInt(minute) || 0;

    // Score is DERIVED from goal events (single source of truth) so it can't
    // double-count and stays correct if an event is ever removed.
    if (['GOAL', 'PENALTY', 'OWN_GOAL'].includes(eventType)) {
      const goalEvents = await prisma.matchEvent.findMany({
        where: { fixtureId, eventType: { in: ['GOAL', 'PENALTY', 'OWN_GOAL'] } },
      });
      let home = 0;
      let away = 0;
      for (const g of goalEvents) {
        const scoredForHome = g.eventType === 'OWN_GOAL'
          ? g.teamId != fixture.homeTeamId
          : g.teamId == fixture.homeTeamId;
        if (scoredForHome) home += 1; else away += 1;
      }

      await prisma.fixture.update({ where: { id: fixtureId }, data: { homeScore: home, awayScore: away } });
      await prisma.liveMatchState.upsert({
        where: { fixtureId },
        update: { homeScore: home, awayScore: away, minute: minuteNum, lastEvent: description || eventType },
        create: { fixtureId, homeScore: home, awayScore: away, minute: minuteNum, status: 'live', lastEvent: description || eventType },
      });
      emitMatchUpdate(fixtureId, { homeScore: home, awayScore: away, minute: minuteNum });

      // Credit the scorer (GOAL/PENALTY only — an OWN_GOAL doesn't count for the player).
      if ((eventType === 'GOAL' || eventType === 'PENALTY') && playerId && fixture.leagueId) {
        const pid = parseInt(playerId);
        const player = await prisma.player.findUnique({ where: { id: pid } });
        if (player) {
          await prisma.topScorer.upsert({
            where: { playerId: pid },
            update: { goals: { increment: 1 } },
            create: { leagueId: fixture.leagueId, playerId: pid, teamId: player.teamId, goals: 1, assists: 0 },
          });
        }
      }
    } else {
      // Non-scoring event: still advance the live clock.
      await prisma.liveMatchState.upsert({
        where: { fixtureId },
        update: { minute: minuteNum, lastEvent: description || eventType },
        create: { fixtureId, minute: minuteNum, status: 'live', lastEvent: description || eventType },
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
