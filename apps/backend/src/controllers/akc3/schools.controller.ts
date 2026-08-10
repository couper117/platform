const prisma = require('../../config/db');
const logActivity = require('../../utils/activityLogger');

const getSchools = async (req, res, next) => {
  try {
    const { category, provinceId, districtId } = req.query;
    const where = { active: true };
    if (category) where.category = category;
    if (provinceId) where.provinceId = parseInt(provinceId);
    if (districtId) where.districtId = parseInt(districtId);

    const schools = await prisma.akcSchool.findMany({
      where,
      include: { _count: { select: { teams: true } } },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, count: schools.length, data: schools });
  } catch (error) {
    next(error);
  }
};

const getSchool = async (req, res, next) => {
  try {
    const school = await prisma.akcSchool.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { teams: { include: { players: true } } },
    });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

const createSchool = async (req, res, next) => {
  try {
    const school = await prisma.akcSchool.create({ data: req.body });
    await logActivity({
      userId: req.user.id,
      action: 'Create AKC School',
      detail: `Created school ${school.name}`,
      module: 'akc3',
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSchools, getSchool, createSchool };
