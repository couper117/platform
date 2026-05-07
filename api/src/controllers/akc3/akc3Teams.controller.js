const prisma = require('../../config/db');
const logActivity = require('../../utils/activityLogger');

const getTeams = async (req, res, next) => {
  try {
    const { schoolId, sportId, gender } = req.query;
    const where = { active: true };
    if (schoolId) where.schoolId = parseInt(schoolId);
    if (sportId) where.sportId = parseInt(sportId);
    if (gender) where.gender = gender;

    const teams = await prisma.akcTeam.findMany({
      where,
      include: { school: true, _count: { select: { players: true } } },
    });
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    next(error);
  }
};