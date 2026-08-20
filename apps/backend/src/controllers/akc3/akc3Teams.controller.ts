const prisma = require('../../config/db');
const logActivity = require('../../utils/activityLogger');

const getTeams = async (req, res, next) => {
  try {
    const { schoolId, sportId, gender } = req.query;
    const where: any = { active: true };
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

const createTeam = async (req, res, next) => {
  try {
    const team = await prisma.akcTeam.create({ data: req.body });
    await logActivity({
      userId: req.user.id,
      action: 'Create AKC Team',
      detail: `Created AKC team for school ${team.schoolId}`,
      module: 'akc3',
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

const TEAM_FIELDS = ['schoolId', 'sportId', 'gender', 'ageCategory', 'level', 'coachName', 'coachPhone', 'isInclusive'];

const updateTeam = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = {};
    for (const k of TEAM_FIELDS) if (k in req.body) data[k] = k === 'schoolId' || k === 'sportId' ? parseInt(req.body[k]) : req.body[k];
    const team = await prisma.akcTeam.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: 'Update AKC Team', detail: `Updated AKC team ${id}`, module: 'akc3', ip: req.ip });
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

const setTeamActive = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const team = await prisma.akcTeam.update({ where: { id }, data: { active: req.body.active !== false } });
    await logActivity({ userId: req.user.id, action: team.active ? 'Restore AKC Team' : 'Hide AKC Team', detail: `AKC team ${id}`, module: 'akc3', ip: req.ip });
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeams, createTeam, updateTeam, setTeamActive };
