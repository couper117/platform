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