/**
 * Reporters as people, not just as assignments.
 *
 * ReporterAssignment records a decision already taken — this reporter, that
 * fixture. It cannot answer the question that comes first: who covers
 * basketball, is near Huye, and is free on Saturday? A league admin had to know
 * a reporter's email address by heart and type it in; there was no directory to
 * choose from, and no way to see that someone was already busy.
 */

const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const { assignedLeagueIds } = require('../utils/scope');

const AVAILABILITY = ['AVAILABLE', 'BUSY', 'UNAVAILABLE'];

/** What a reporter looks like to whoever is choosing one. */
const DIRECTORY_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  active: true,
  reporterProfile: {
    select: {
      sportIds: true, location: true, bio: true, yearsActive: true,
      availability: true, busyUntil: true, updatedAt: true,
    },
  },
};

const clean = (v, max) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : null;
};

/**
 * A reporter with no profile row yet is still a reporter — they simply have not
 * filled anything in. Presenting a consistent shape means the UI never has to
 * special-case the difference.
 */
const shape = (user, extra = {}) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  active: user.active,
  sportIds: user.reporterProfile?.sportIds ?? [],
  location: user.reporterProfile?.location ?? null,
  bio: user.reporterProfile?.bio ?? null,
  yearsActive: user.reporterProfile?.yearsActive ?? null,
  availability: user.reporterProfile?.availability ?? 'AVAILABLE',
  busyUntil: user.reporterProfile?.busyUntil ?? null,
  hasProfile: !!user.reporterProfile,
  ...extra,
});

// @desc    The reporter directory — who is out there, and are they free
// @route   GET /api/v1/reporters
// @access  Private (reporters.read)
const getReporters = async (req, res, next) => {
  try {
    const { sportId, availability, q } = req.query;

    const where: any = { role: 'MATCH_REPORTER', active: true };
    if (q) {
      where.OR = [
        { fullName: { contains: String(q), mode: 'insensitive' } },
        { email: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    if (availability && AVAILABILITY.includes(String(availability).toUpperCase())) {
      where.reporterProfile = { availability: String(availability).toUpperCase() };
    }

    const users = await prisma.user.findMany({
      where,
      select: DIRECTORY_SELECT,
      orderBy: { fullName: 'asc' },
      take: 200,
    });

    // Sport is filtered here rather than in the query: a reporter who has not
    // said what they cover should not vanish from the list, because "unstated"
    // is not the same as "does not cover it" — they are simply the ones an
    // admin may need to ask.
    const wanted = sportId ? Number(sportId) : null;
    let rows = users.map((u) => shape(u));
    if (wanted) {
      rows = rows.filter((r) => r.sportIds.length === 0 || r.sportIds.includes(wanted));
    }

    // How many matches each is already carrying, so "available" can be read
    // alongside the workload that word is hiding.
    const counts = await prisma.reporterAssignment.groupBy({
      by: ['userId'],
      where: { userId: { in: rows.map((r) => r.id) } },
      _count: { userId: true },
    }).catch(() => []);
    const byUser = new Map(counts.map((c) => [c.userId, c._count.userId]));

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({ ...r, assignments: byUser.get(r.id) ?? 0 })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Your own reporter profile
// @route   GET /api/v1/reporters/me
// @access  Private (reporters.profile)
const getMyProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: DIRECTORY_SELECT,
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // The matches they are down for, so the profile page is also the answer to
    // "what am I covering?" — the question a reporter actually opens it with.
    const assignments = await prisma.reporterAssignment.findMany({
      where: { userId: req.user.id },
      include: {
        fixture: {
          select: {
            id: true, matchDate: true, status: true,
            homeTeam: { select: { name: true, logo: true } },
            awayTeam: { select: { name: true, logo: true } },
          },
        },
        league: { select: { id: true, name: true, sportId: true } },
      },
      orderBy: { id: 'desc' },
      take: 50,
    });

    res.status(200).json({ success: true, data: shape(user, { assignments }) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update your own reporter profile
// @route   PUT /api/v1/reporters/me
// @access  Private (reporters.profile)
const updateMyProfile = async (req, res, next) => {
  try {
    const { sportIds, location, bio, yearsActive, availability, busyUntil } = req.body;

    if (availability !== undefined && !AVAILABILITY.includes(String(availability).toUpperCase())) {
      return res.status(400).json({ success: false, message: `availability must be one of ${AVAILABILITY.join(', ')}` });
    }

    let sports;
    if (sportIds !== undefined) {
      if (!Array.isArray(sportIds)) {
        return res.status(400).json({ success: false, message: 'sportIds must be an array' });
      }
      sports = [...new Set(sportIds.map(Number).filter(Number.isFinite))];
      if (sports.length) {
        // A sport that does not exist would sit in the list looking like a
        // declared speciality and never match anything.
        const found = await prisma.sport.findMany({ where: { id: { in: sports } }, select: { id: true } });
        const known = new Set(found.map((s) => s.id));
        const unknown = sports.filter((id) => !known.has(id));
        if (unknown.length) {
          return res.status(400).json({ success: false, message: `Unknown sportIds: ${unknown.join(', ')}` });
        }
      }
    }

    const years = yearsActive === undefined || yearsActive === null || yearsActive === ''
      ? undefined
      : Math.max(0, Math.min(80, Number(yearsActive) || 0));

    const nextAvailability = availability ? String(availability).toUpperCase() : undefined;
    // busyUntil only means something alongside BUSY; clearing the state clears
    // the date with it, so a stale "free again on Tuesday" cannot linger.
    const until = nextAvailability && nextAvailability !== 'BUSY'
      ? null
      : (busyUntil ? new Date(busyUntil) : undefined);

    const data = {
      sportIds: sports,
      location: location === undefined ? undefined : clean(location, 200),
      bio: bio === undefined ? undefined : clean(bio, 2000),
      yearsActive: years,
      availability: nextAvailability,
      busyUntil: until,
    };

    const profile = await prisma.reporterProfile.upsert({
      where: { userId: req.user.id },
      update: data,
      create: {
        userId: req.user.id,
        sportIds: sports ?? [],
        location: data.location ?? null,
        bio: data.bio ?? null,
        yearsActive: years ?? null,
        availability: nextAvailability ?? 'AVAILABLE',
        busyUntil: until ?? null,
      },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Update Reporter Profile',
      detail: `availability=${profile.availability}, sports=[${profile.sportIds.join(', ')}]`,
      module: 'reporters',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    One reporter, with the matches they are covering
// @route   GET /api/v1/reporters/:id
// @access  Private (reporters.read)
const getReporter = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findFirst({
      where: { id, role: 'MATCH_REPORTER' },
      select: DIRECTORY_SELECT,
    });
    if (!user) return res.status(404).json({ success: false, message: 'Reporter not found' });

    // A league admin sees the work they gave out, not the reporter's whole
    // diary: what another competition has them down for is that competition's
    // business.
    const mine = await assignedLeagueIds(req.user);
    const assignments = await prisma.reporterAssignment.findMany({
      where: { userId: id, ...(mine ? { leagueId: { in: mine } } : {}) },
      include: {
        fixture: { select: { id: true, matchDate: true, status: true } },
        league: { select: { id: true, name: true } },
      },
      orderBy: { id: 'desc' },
      take: 50,
    });

    res.status(200).json({ success: true, data: shape(user, { assignments }) });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReporters, getReporter, getMyProfile, updateMyProfile, AVAILABILITY };
