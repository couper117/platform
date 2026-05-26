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

const createFixture = async (req, res, next) => {
  try {
    const fixture = await prisma.akcFixture.create({ data: req.body });
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
    const { homeScore, awayScore } = req.body;
    const fixtureId = parseInt(req.params.fixtureId);

    const result = await prisma.akcFixture.update({
      where: { id: fixtureId },
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: 'COMPLETED',
        winnerTeamId: homeScore > awayScore ? undefined : (awayScore > homeScore ? undefined : undefined), // Simplified
        isDraw: homeScore === awayScore,
      },
    });

    if (result.competitionId) {
      await recalcAkcStandings(result.competitionId);
    }

    await logActivity({
      userId: req.user.id,
      action: 'Enter AKC Result',
      detail: `Entered result for AKC fixture ${fixtureId}`,
      module: 'akc3',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFixtures, createFixture, enterResult };
