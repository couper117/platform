const prisma = require('../../config/db');
const logActivity = require('../../utils/activityLogger');
const { PUBLIC_ATHLETE_SELECT, canSeePersonalData, publiclyVisibleAthleteWhere } = require('../../services/privacy.service');

const getSchools = async (req, res, next) => {
  try {
    const { category, provinceId, districtId } = req.query;
    const where: any = { active: true };
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

// Public school profile. It nests the school's athletes, so unless the caller has
// a duty that needs more (an Amashuri admin, or this school's own coordinator),
// each athlete is projected down to what a team sheet shows — no date of birth,
// national ID, guardian phone, student code or disability. Law N° 058/2021 art. 9,
// 11 and 47.
const getSchool = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const privileged = canSeePersonalData(req.user)
      && (req.user.role !== 'SCHOOL_COORDINATOR' || req.user.akcSchoolId === id);

    const school = await prisma.akcSchool.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            players: privileged
              ? true
              // Art. 9: a child awaiting guardian consent has no lawful basis for
              // processing, and publishing is processing. Their record stays —
              // admins still see it to chase the consent — but it is not published.
              : { select: PUBLIC_ATHLETE_SELECT, where: publiclyVisibleAthleteWhere(new Date().getUTCFullYear()) },
          },
        },
      },
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

// Editable fields only — never trust the client with relations/ids it shouldn't set.
const SCHOOL_FIELDS = ['name', 'shortName', 'code', 'category', 'sector', 'address', 'headTeacher', 'coordinator', 'coordPhone', 'coordEmail', 'phone', 'email', 'logo'];

const updateSchool = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = {};
    for (const k of SCHOOL_FIELDS) if (k in req.body) data[k] = req.body[k];
    const school = await prisma.akcSchool.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: 'Update AKC School', detail: `Updated school ${school.name}`, module: 'akc3', ip: req.ip });
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

// Hide / restore — soft state so historical fixtures/standings keep their reference.
const setSchoolActive = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const school = await prisma.akcSchool.update({ where: { id }, data: { active: req.body.active !== false } });
    await logActivity({ userId: req.user.id, action: school.active ? 'Restore AKC School' : 'Hide AKC School', detail: `${school.active ? 'Restored' : 'Hid'} school ${school.name}`, module: 'akc3', ip: req.ip });
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSchools, getSchool, createSchool, updateSchool, setSchoolActive };
