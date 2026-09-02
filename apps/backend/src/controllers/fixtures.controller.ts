const prisma = require('../config/db');
const { recalcStandings } = require('../services/standings.service');
const { emitMatchUpdate, emitMatchEvent, emitMatchStats } = require('../services/realtime.service');
const sse = require('../services/sse.service');
const { handleCardEvent, serveSuspensions } = require('../services/discipline.service');
const { notifyKickOff, notifyLineup } = require('../services/notifications.service');
const { completeFixture } = require('../services/matchCompletion.service');
const { getPagination } = require('../utils/paginate');
const { enforceSportScope, leagueSportId } = require('../utils/scope');
const { transition, canTransition, readClock, eventMinuteAt } = require('../services/matchClock.logic');
const { recomputeScore, recomputeTopScorer, deleteEventAndRecompute } = require('../services/matchEvents.service');
const logActivity = require('../utils/activityLogger');
const { syncFixtureConflict, detectConflict, raiseNotice } = require('../services/umuganda.service');

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
    const where: any = {};
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
        // Who reported the match. A live feed is somebody's work, and a match
        // page that credits nobody reads as though it wrote itself. Only the
        // name — not the email or anything else on the account.
        assignedReporters: {
          select: { user: { select: { id: true, fullName: true, avatar: true } } },
        },
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

    // The clock is derived, never stored ticking, so every client that loads this
    // fixture — reporter, public viewer, second device — reads the same minute.
    res.status(200).json({
      success: true,
      data: { ...fixture, clock: readClock(fixture.liveState) },
    });
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

    // Umuganda awareness: flag a clash, never refuse or cancel the fixture.
    // The admin gets the warning and decides (see setUmugandaDecision).
    const { conflict, fixture: checked } = await syncFixtureConflict('LEAGUE', fixture);

    await logActivity({
      userId: req.user.id,
      action: 'Create Fixture',
      detail: `Created fixture ${homeTeamId} vs ${awayTeamId}`,
      module: 'fixtures',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: checked, umugandaConflict: conflict });
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
      // recount:false — an administrator has just typed the final score, and it
      // is the authority here, not the event log.
      await completeFixture(fixtureId, { recount: false });
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
    const { eventType, teamId, playerId, player2Id, description, refereeName } = req.body;
    let { minute, extraTime } = req.body;
    const fixtureId = parseInt(req.params.id);
    if (isNaN(fixtureId)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });

    // No minute supplied means "now": read it off the running clock rather than
    // making the reporter type a number they would have to keep correcting.
    if (minute === undefined || minute === null || minute === '') {
      const live = await prisma.liveMatchState.findUnique({ where: { fixtureId } });
      const fromClock = eventMinuteAt(live);
      minute = fromClock.minute;
      if (extraTime === undefined || extraTime === null || extraTime === '') extraTime = fromClock.extraTime;
    }

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
      const { home, away } = await recomputeScore(fixtureId, fixture);
      await prisma.liveMatchState.updateMany({
        where: { fixtureId },
        data: { minute: minuteNum, lastEvent: description || eventType },
      });
      const liveNow = await prisma.liveMatchState.findUnique({ where: { fixtureId } });
      emitMatchUpdate(fixtureId, { homeScore: home, awayScore: away, minute: minuteNum, clock: readClock(liveNow) });

      // Credit the scorer (GOAL/PENALTY only — an OWN_GOAL doesn't count for the
      // player). Recounted from events, not incremented, so an undo can put it back.
      if ((eventType === 'GOAL' || eventType === 'PENALTY') && playerId && fixture.leagueId) {
        await recomputeTopScorer(parseInt(playerId), fixture.leagueId);
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

    const submitted: number[] = [...new Set<number>((players || []).map((p) => parseInt(p.playerId)).filter(Number.isFinite))];

    // Only players belonging to this team may be listed.
    //
    // Players not on the team used to be dropped silently: a manager naming
    // eleven could be told "Lineup saved" with eight of them stored, and nothing
    // said which three had gone. Naming them costs one sentence and saves the
    // discovery happening at kick-off.
    const teamPlayers = await prisma.player.findMany({
      where: { id: { in: submitted } },
      select: { id: true, fullName: true, teamId: true },
    });
    const byId = new Map<number, any>(teamPlayers.map((p) => [p.id, p]));
    const foreign = submitted.filter((id) => byId.get(id)?.teamId !== tid);
    if (foreign.length) {
      const names = foreign.map((id) => byId.get(id)?.fullName || `#${id}`);
      return res.status(400).json({
        success: false,
        message: `Not in this squad: ${names.join(', ')}`,
      });
    }

    // A suspended player may not be named.
    //
    // Suspensions were recorded, counted and displayed, and then had no effect
    // on anything: a player serving a red-card ban could be put straight into
    // the starting XI and the sheet saved without complaint. A ban that does not
    // stop someone playing is not a ban. Lifting it is a deliberate act with its
    // own endpoint, which is where an exception belongs — not here.
    const bans = await prisma.suspension.findMany({
      where: { playerId: { in: submitted }, active: true },
      select: { playerId: true, matches: true, matchesServed: true, reason: true },
    });
    const serving = bans.filter((b) => b.matchesServed < b.matches);
    if (serving.length) {
      const detail = serving.map((b) => {
        const left = b.matches - b.matchesServed;
        return `${byId.get(b.playerId)?.fullName || `#${b.playerId}`} (${left} match${left === 1 ? '' : 'es'} of a ${b.reason.toLowerCase().replace(/_/g, ' ')} ban left)`;
      });
      return res.status(409).json({
        success: false,
        message: `Suspended, cannot be named: ${detail.join('; ')}`,
        suspended: serving.map((b) => b.playerId),
      });
    }

    const allowed = new Set(teamPlayers.filter((p) => p.teamId === tid).map((p) => p.id));
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

    // Only a published sheet is news. A draft saved with published:false is the
    // manager still deciding, and telling followers about it would be wrong twice
    // over — it is not final, and it may name players who are about to be dropped.
    if (published) {
      const full = await prisma.fixture.findUnique({
        where: { id: fixtureId },
        include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
      });
      const named = tid === full?.homeTeamId ? full?.homeTeam?.name : full?.awayTeam?.name;
      if (full) await notifyLineup(full, named || 'The team');
    }

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
    // Push the fresh stat to anyone watching the match so the Stats tab
    // animates live instead of waiting for a page reload.
    emitMatchStats(fixtureId, { teamId: tid, stat });
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

    // Only re-evaluate when the date actually moved, so an unrelated edit
    // (venue, referee) can't quietly reset an admin's Umuganda decision.
    let umugandaConflict = null;
    let result = updated;
    if (matchDate !== undefined) {
      const sync = await syncFixtureConflict('LEAGUE', updated);
      umugandaConflict = sync.conflict;
      result = sync.fixture;
    }

    res.status(200).json({ success: true, data: result, umugandaConflict });
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

/**
 * Drive the match clock.
 *
 * `action` moves the period (start / halftime / resume / fulltime) and stamps the
 * timestamp the clock is read from. `addedMinutes` sets the stoppage the referee
 * signalled for the period currently being played.
 *
 * Period changes also write their match event, so the feed and the clock cannot
 * disagree about when a half ended.
 */
const setMatchClock = async (req, res, next) => {
  try {
    const fixtureId = parseInt(req.params.id);
    if (Number.isNaN(fixtureId)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
    if (!(await canManageFixture(req.user, fixture))) {
      return res.status(403).json({ success: false, message: 'Not authorized for this fixture' });
    }

    const state = await prisma.liveMatchState.findUnique({ where: { fixtureId } });
    const now = new Date();
    const { action } = req.body || {};

    // Setting added time only — no period change.
    if (!action) {
      const added = parseInt(req.body?.addedMinutes, 10);
      if (Number.isNaN(added) || added < 0 || added > 30) {
        return res.status(400).json({ success: false, message: 'addedMinutes must be a whole number between 0 and 30.' });
      }
      const updated = await prisma.liveMatchState.upsert({
        where: { fixtureId },
        update: { addedMinutes: added },
        create: { fixtureId, addedMinutes: added, status: 'live' },
      });
      emitMatchUpdate(fixtureId, { clock: readClock(updated, now) });
      return res.status(200).json({ success: true, data: { ...updated, clock: readClock(updated, now) } });
    }

    const next_ = transition(action, now);
    if (!next_) return res.status(400).json({ success: false, message: `Unknown clock action "${action}".` });
    if (!canTransition(state?.period, action)) {
      return res.status(409).json({
        success: false,
        message: `Cannot ${action} from ${state?.period || 'PRE'}.`,
      });
    }

    const { eventType, minute, ...clockFields } = next_;

    const updated = await prisma.liveMatchState.upsert({
      where: { fixtureId },
      update: { ...clockFields, minute, status: action === 'fulltime' ? 'ended' : 'live' },
      create: { fixtureId, ...clockFields, minute, status: action === 'fulltime' ? 'ended' : 'live' },
    });

    // The fixture's own status follows the clock, so the public site flips to LIVE
    // on kick-off and COMPLETED at full time without a second call.
    if (action === 'start') {
      if (fixture.status !== 'LIVE') {
        await prisma.fixture.update({ where: { id: fixtureId }, data: { status: 'LIVE' } });
      }
      // Announced on the clock action, not on the status change. Plenty of
      // fixtures are already marked LIVE before anyone starts the clock, and
      // hanging the announcement on the status meant those kick-offs — the ones
      // actually being reported — told nobody.
      const full = await prisma.fixture.findUnique({
        where: { id: fixtureId },
        include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
      });
      if (full) await notifyKickOff(full);
    }
    if (action === 'fulltime') {
      await prisma.fixture.update({ where: { id: fixtureId }, data: { status: 'COMPLETED' } });
      // Pressing full time ends the match in every sense — this used to set the
      // status and stop, so a match reported live never reached the standings and
      // its suspensions were never served.
      await completeFixture(fixtureId, { recount: true });
    }

    if (eventType) {
      const event = await prisma.matchEvent.create({
        data: { fixtureId, eventType, minute, extraTime: 0 },
        include: { player: true, player2: true },
      });
      emitMatchEvent(fixtureId, event);
    }

    const clock = readClock(updated, now);
    emitMatchUpdate(fixtureId, { clock, status: updated.status });
    res.status(200).json({ success: true, data: { ...updated, clock } });
  } catch (error) {
    next(error);
  }
};

/**
 * Undo a logged event.
 *
 * Removing it is the easy half; the point of this endpoint is that everything the
 * event caused is put back — the score recounted, the scorer's tally recounted,
 * and a suspension the card produced withdrawn if it is no longer earned.
 */
const deleteMatchEvent = async (req, res, next) => {
  try {
    const fixtureId = parseInt(req.params.id);
    const eventId = parseInt(req.params.eventId);
    if (Number.isNaN(fixtureId) || Number.isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return res.status(404).json({ success: false, message: 'Fixture not found' });
    if (!(await canManageFixture(req.user, fixture))) {
      return res.status(403).json({ success: false, message: 'Not authorized for this fixture' });
    }

    const result = await deleteEventAndRecompute(fixtureId, eventId);
    if (result.error) return res.status(400).json({ success: false, message: result.error });

    await logActivity({
      userId: req.user.id,
      action: 'Undo Match Event',
      detail: `Removed ${result.deleted.eventType} at ${result.deleted.minute}' from fixture ${fixtureId}`,
      module: 'fixtures',
      ip: req.ip,
    });

    const liveAfterUndo = await prisma.liveMatchState.findUnique({ where: { fixtureId } });
    emitMatchUpdate(fixtureId, { homeScore: result.score.home, awayScore: result.score.away, clock: readClock(liveAfterUndo) });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteMatchEvent,
  setMatchClock,
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
  // Exported so the Umuganda decision endpoint authorizes a league fixture by
  // exactly the same rule as every other fixture mutation.
  canManageFixture,
};
