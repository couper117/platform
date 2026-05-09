const prisma = require('../config/db');
const { recalcStandings } = require('../services/standings.service');
const { emitMatchUpdate, emitMatchEvent } = require('../services/realtime.service');
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