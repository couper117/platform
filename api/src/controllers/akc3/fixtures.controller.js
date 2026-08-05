const prisma = require('../../config/db');
const { recalcAkcStandings } = require('../../services/akc3/standings.service');
const logActivity = require('../../utils/activityLogger');

const getFixtures = async (req, res, next) => {
  try {
    const { competitionId, status, schoolId } = req.query;
    const where = {};
    if (competitionId) where.competitionId = parseInt(competitionId);
    if (status) where.status = status;
    if (schoolId) {
      where.OR = [
        { homeTeam: { schoolId: parseInt(schoolId) } },
        { awayTeam: { schoolId: parseInt(schoolId) } },
      ];
    }

    const fixtures = await prisma.akcFixture.findMany({
      where,
      include: {
        homeTeam: { include: { school: true } },
        awayTeam: { include: { school: true } },
        competition: true,
      },
      orderBy: { matchDate: 'asc' },
    });
    res.status(200).json({ success: true, count: fixtures.length, data: fixtures });
  } catch (error) {
    next(error);
  }
};

// Whitelist the fields we accept — never spread req.body straight into Prisma.
const buildFixtureData = (b = {}) => ({
  competitionId: b.competitionId ? parseInt(b.competitionId) : null,
  homeTeamId: parseInt(b.homeTeamId),
  awayTeamId: parseInt(b.awayTeamId),
  matchDate: b.matchDate ? new Date(b.matchDate) : null,
  venue: b.venue || null,
  round: b.round || null,
  stage: b.stage || undefined,
  status: b.status || undefined,
  notes: b.notes || null,
});

const createFixture = async (req, res, next) => {
  try {
    const data = buildFixtureData(req.body);
    if (Number.isNaN(data.homeTeamId) || Number.isNaN(data.awayTeamId)) {
      return res.status(400).json({ success: false, message: 'homeTeamId and awayTeamId are required' });
    }
    if (data.homeTeamId === data.awayTeamId) {
      return res.status(400).json({ success: false, message: 'A team cannot play against itself' });
    }

    const fixture = await prisma.akcFixture.create({ data });
    await logActivity({
      userId: req.user.id,
      action: 'Create AKC Fixture',
      detail: `Created AKC fixture ${fixture.id}`,
      module: 'akc3',
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: fixture });
  } catch (error) {
    next(error);
  }
};

const enterResult = async (req, res, next) => {
  try {
    const homeScore = parseInt(req.body.homeScore, 10);
    const awayScore = parseInt(req.body.awayScore, 10);
    const fixtureId = parseInt(req.params.fixtureId, 10);

    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
      return res.status(400).json({ success: false, message: 'Valid homeScore and awayScore are required' });
    }

    const existing = await prisma.akcFixture.findUnique({ where: { id: fixtureId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Fixture not found' });

    const isDraw = homeScore === awayScore;
    const winnerTeamId = isDraw ? null : (homeScore > awayScore ? existing.homeTeamId : existing.awayTeamId);

    const result = await prisma.akcFixture.update({
      where: { id: fixtureId },
      data: { homeScore, awayScore, status: 'COMPLETED', winnerTeamId, isDraw },
    });

    if (result.competitionId) {
      await recalcAkcStandings(result.competitionId);
    }

    await logActivity({
      userId: req.user.id,
      action: 'Enter AKC Result',
      detail: `Entered result for AKC fixture ${fixtureId}: ${homeScore}-${awayScore}`,
      module: 'akc3',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFixtures, createFixture, enterResult };
