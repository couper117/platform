const prisma = require('../config/db');
const { recalcStandings } = require('../services/standings.service');
const { emitMatchUpdate, emitMatchEvent } = require('../services/realtime.service');
const sse = require('../services/sse.service');
const { handleCardEvent, serveSuspensions } = require('../services/discipline.service');
const { getPagination } = require('../utils/paginate');
const { enforceSportScope, leagueSportId } = require('../utils/scope');
const logActivity = require('../utils/activityLogger');

// Can this user manage the fixture's competition-level data (result, stats,
// streaming)? Super admins, the sport's federation admin, an assigned league
// admin, or an assigned reporter.
const canManageFixture = async (user, fixture) => {
  if (user.role === 'SUPERADMIN') return true;
  if (user.role === 'FEDERATION_ADMIN') {
    return Number(user.sportId) === Number(await leagueSportId(fixture.leagueId));
  }
  if (user.role === 'LEAGUE_ADMIN') {
    return !!(await prisma.leagueAdminAssignment.findUnique({
      where: { leagueId_userId: { leagueId: fixture.leagueId, userId: user.id } },
    }));
  }
  if (user.role === 'MATCH_REPORTER') {
    return !!(await prisma.reporterAssignment.findFirst({
      where: { OR: [{ fixtureId: fixture.id, userId: user.id }, { leagueId: fixture.leagueId, userId: user.id }] },
    }));
  }
  return false;
};

// Team sheets can additionally be published by the manager of the team involved.
const canManageTeamSheet = async (user, fixture, teamId) => {
  if (await canManageFixture(user, fixture)) return true;
  if (user.role === 'TEAM_MANAGER') {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    return team && team.managerUserId === user.id;
  }
  return false;
};

const isValidHttpUrl = (u) => {
  try { const p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:'; }
  catch { return false; }
};

const getFixtures = async (req, res, next) => {
  try {
    const { leagueId, sportId, status, from, to, teamId, reporterId } = req.query;
    const where = {};
    const andClauses = [];
    if (leagueId) where.leagueId = parseInt(leagueId);
    if (sportId) where.league = { sportId: parseInt(sportId) };
    if (status) where.status = status;
    if (teamId) {
      andClauses.push({ OR: [{ homeTeamId: parseInt(teamId) }, { awayTeamId: parseInt(teamId) }] });
    }
    if (from || to) {
      where.matchDate = {};
      if (from) where.matchDate.gte = new Date(from);
      if (to) where.matchDate.lte = new Date(to);
    }
    if (reporterId) {
      // A reporter can be assigned to a specific fixture, or to an entire league.
      const assignments = await prisma.reporterAssignment.findMany({ where: { userId: parseInt(reporterId) } });
      const fixtureIds = assignments.filter((a) => a.fixtureId).map((a) => a.fixtureId);
      const leagueIds = assignments.filter((a) => a.leagueId && !a.fixtureId).map((a) => a.leagueId);
      const reporterOr = [];
      if (fixtureIds.length) reporterOr.push({ id: { in: fixtureIds } });
      if (leagueIds.length) reporterOr.push({ leagueId: { in: leagueIds } });
      andClauses.push(reporterOr.length ? { OR: reporterOr } : { id: -1 });
    }
    if (andClauses.length) where.AND = andClauses;

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
        teamSheets: true,
        stats: true,
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
      await serveSuspensions(result); // advance/clear bans for both squads
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

    // Disciplinary consequences (red card / yellow accumulation → suspension).
    if (eventType === 'RED_CARD' || eventType === 'YELLOW_CARD') {
      await handleCardEvent({
        fixtureId,
        leagueId: fixture.leagueId,
        playerId: playerId ? parseInt(playerId) : null,
        eventType,
      });
    }

    emitMatchEvent(fixtureId, event);

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-generate a round-robin schedule for a league
// @route   POST /api/v1/leagues/:id/generate-fixtures
// @access  Private/Admin
const generateFixtures = async (req, res, next) => {
  try {
    const leagueId = parseInt(req.params.id);
    const { doubleRound = false, startDate, intervalDays = 7, force = false } = req.body;

    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    if (!enforceSportScope(req, res, league.sportId)) return;

    if (req.user.role === 'LEAGUE_ADMIN') {
      const isAssigned = await prisma.leagueAdminAssignment.findUnique({
        where: { leagueId_userId: { leagueId, userId: req.user.id } },
      });
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Not assigned to this league' });
    }

    const existing = await prisma.fixture.count({ where: { leagueId } });
    if (existing > 0 && !force) {
      return res.status(400).json({ success: false, message: 'Fixtures already exist. Pass force to regenerate.' });
    }
    if (existing > 0 && force) {
      await prisma.fixture.deleteMany({ where: { leagueId } });
    }

    const members = await prisma.leagueTeam.findMany({ where: { leagueId }, select: { teamId: true } });
    let ids = members.map((m) => m.teamId);
    if (ids.length < 2) {
      return res.status(400).json({ success: false, message: 'Need at least 2 registered teams to generate fixtures' });
    }

    // Circle method. Add a bye (null) for an odd number of teams.
    if (ids.length % 2 === 1) ids.push(null);
    const n = ids.length;
    const rounds = n - 1;
    const half = n / 2;
    const base = new Date(startDate || league.startDate || Date.now());
    const rows = [];

    const arr = ids.slice();
    for (let r = 0; r < rounds; r++) {
      const md = new Date(base);
      md.setDate(md.getDate() + r * parseInt(intervalDays));
      for (let i = 0; i < half; i++) {
        const home = arr[i];
        const away = arr[n - 1 - i];
        if (home == null || away == null) continue;
        // Alternate home/away by round for fairness.
        const [h, a] = r % 2 === 0 ? [home, away] : [away, home];
        rows.push({ leagueId, homeTeamId: h, awayTeamId: a, matchday: r + 1, matchDate: md });
      }
      // Rotate all but the first element.
      arr.splice(1, 0, arr.pop());
    }

    if (doubleRound) {
      const firstLeg = rows.slice();
      const secondBase = new Date(base);
      secondBase.setDate(secondBase.getDate() + rounds * parseInt(intervalDays));
      firstLeg.forEach((f, idx) => {
        const md = new Date(secondBase);
        md.setDate(md.getDate() + (f.matchday - 1) * parseInt(intervalDays));
        rows.push({ leagueId, homeTeamId: f.awayTeamId, awayTeamId: f.homeTeamId, matchday: rounds + f.matchday, matchDate: md });
      });
    }

    await prisma.fixture.createMany({ data: rows });

    await logActivity({
      userId: req.user.id,
      action: 'Generate Fixtures',
      detail: `Generated ${rows.length} fixtures for league ${leagueId}`,
      module: 'fixtures',
      ip: req.ip,
    });

    res.status(201).json({ success: true, count: rows.length, message: `Generated ${rows.length} fixtures` });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish/update a team's lineup (starting XI, bench, formation, coach)
// @route   PUT /api/v1/fixtures/:id/lineup
// @access  Team manager (own team) or admin/reporter
const saveLineup = async (req, res, next) => {
  try {
    const fixtureId = parseInt(req.params.id);
    const { teamId, formation, coachName, published = true, players = [] } = req.body;
    const tid = parseInt(teamId);
    if (!tid) return res.status(400).json({ success: false, message: 'teamId is required' });

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
    if (tid !== fixture.homeTeamId && tid !== fixture.awayTeamId) {
      return res.status(400).json({ success: false, message: 'That team is not in this fixture' });
    }
    if (!(await canManageTeamSheet(req.user, fixture, tid))) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this lineup' });
    }
    // Lock edits once the match is under way (unless an admin overrides).
    if (['LIVE', 'COMPLETED'].includes(fixture.status) && req.user.role === 'TEAM_MANAGER') {
      return res.status(423).json({ success: false, message: 'Lineup is locked — the match has started' });
    }

    // Only players belonging to this team may be listed.
    const teamPlayers = await prisma.player.findMany({ where: { teamId: tid }, select: { id: true } });
    const allowed = new Set(teamPlayers.map((p) => p.id));
    const rows = (players || [])
      .filter((p) => allowed.has(parseInt(p.playerId)))
      .map((p) => ({
        fixtureId,
        teamId: tid,
        playerId: parseInt(p.playerId),
        position: p.position || null,
        jerseyNo: p.jerseyNo != null ? parseInt(p.jerseyNo) : null,
        isStarter: p.isStarter !== false,
        isCaptain: !!p.isCaptain,
      }));

    await prisma.$transaction([
      prisma.matchTeamSheet.upsert({
        where: { fixtureId_teamId: { fixtureId, teamId: tid } },
        update: { formation: formation || null, coachName: coachName || null, published: !!published },
        create: { fixtureId, teamId: tid, formation: formation || null, coachName: coachName || null, published: !!published },
      }),
      prisma.lineup.deleteMany({ where: { fixtureId, teamId: tid } }),
      ...(rows.length ? [prisma.lineup.createMany({ data: rows })] : []),
    ]);

    await logActivity({ userId: req.user.id, action: 'Publish Lineup', detail: `Lineup for team ${tid} in fixture ${fixtureId}`, module: 'fixtures', ip: req.ip });
    res.status(200).json({ success: true, message: 'Lineup saved', count: rows.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Set per-team match statistics
// @route   PUT /api/v1/fixtures/:id/stats
// @access  Admin / reporter
const saveStats = async (req, res, next) => {
  try {
    const fixtureId = parseInt(req.params.id);
    const { teamId } = req.body;
    const tid = parseInt(teamId);
    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
    if (tid !== fixture.homeTeamId && tid !== fixture.awayTeamId) {
      return res.status(400).json({ success: false, message: 'That team is not in this fixture' });
    }
    if (!(await canManageFixture(req.user, fixture))) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit stats for this match' });
    }

    const num = (v) => (v === '' || v == null ? null : parseInt(v));
    const dec = (v) => (v === '' || v == null ? null : parseFloat(v));
    const data = {
      possession: num(req.body.possession), shots: num(req.body.shots), shotsOnTarget: num(req.body.shotsOnTarget),
      shotsInsideBox: num(req.body.shotsInsideBox), shotsOutsideBox: num(req.body.shotsOutsideBox),
      corners: num(req.body.corners), offsides: num(req.body.offsides), fouls: num(req.body.fouls),
      yellowCards: num(req.body.yellowCards), redCards: num(req.body.redCards), gkSaves: num(req.body.gkSaves),
      passAccuracy: num(req.body.passAccuracy), xg: dec(req.body.xg),
    };

    const stat = await prisma.matchStat.upsert({
      where: { fixtureId_teamId: { fixtureId, teamId: tid } },
      update: data,
      create: { fixtureId, teamId: tid, ...data },
    });
    res.status(200).json({ success: true, data: stat });
  } catch (error) {
    next(error);
  }
};

// @desc    Update fixture meta (venue, referee, date, status, streaming URL)
// @route   PATCH /api/v1/fixtures/:id
// @access  Admin (league/federation/super)
const updateFixtureMeta = async (req, res, next) => {
  try {
    const fixtureId = parseInt(req.params.id);
    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
    if (!(await canManageFixture(req.user, fixture))) {
      return res.status(403).json({ success: false, message: 'Not authorized for this fixture' });
    }

    const { venue, referee, matchDate, status, streamUrl, streamActive } = req.body;
    if (streamUrl !== undefined && streamUrl !== '' && streamUrl !== null && !isValidHttpUrl(streamUrl)) {
      return res.status(400).json({ success: false, message: 'Streaming URL must be a valid http(s) link' });
    }

    const updated = await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        venue: venue !== undefined ? venue : undefined,
        referee: referee !== undefined ? referee : undefined,
        matchDate: matchDate !== undefined ? (matchDate ? new Date(matchDate) : null) : undefined,
        status: status !== undefined ? status : undefined,
        streamUrl: streamUrl !== undefined ? (streamUrl || null) : undefined,
        streamActive: streamActive !== undefined ? !!streamActive : undefined,
      },
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Live updates for a fixture over Server-Sent Events (public, read-only)
// @route   GET /api/v1/fixtures/:id/stream
// @access  Public
//
// Opens a long-lived text/event-stream. realtime.service pushes `matchUpdate` and
// `matchEvent` frames as the reporter logs the match; a 25s comment keeps proxies
// from timing the connection out. Cleaned up on client disconnect.
const streamFixture = (req, res) => {
  const fixtureId = parseInt(req.params.id);
  if (isNaN(fixtureId)) return res.status(400).end();

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write(': connected\n\n');

  const matchChannel = `fixture-${fixtureId}`;
  sse.addClient(matchChannel, res);
  sse.addClient('live-scores', res);

  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* closed */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sse.removeClient(matchChannel, res);
    sse.removeClient('live-scores', res);
  });
};

module.exports = {
  getFixtures,
  getFixture,
  createFixture,
  saveResult,
  addMatchEvent,
  generateFixtures,
  saveLineup,
  saveStats,
  updateFixtureMeta,
  streamFixture,
};
