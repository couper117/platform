const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const {
  ensureUpcomingMonths,
  getEffectiveDays,
  getNextDay,
  raiseNotice,
  getPublishedNotices,
  getAffectedFixtures,
  detectConflict,
  withAkcTeamNames,
  prepareCalendar,
  DEFAULT_MONTHS_AHEAD,
} = require('../services/umuganda.service');
const { canManageFixture } = require('./fixtures.controller');
const { dayKey, kigaliDayKey } = require('../services/umuganda.logic');

// A fixture that Umuganda has touched in some way.
const UMUGANDA_STATUSES = ['UMUGANDA_CONFLICT', 'RESCHEDULED'];

const toDateOnly = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// @desc    Upcoming Umuganda days (generates any that are missing)
// @route   GET /api/v1/umuganda
// @access  Public
const getUmugandaDays = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months, 10) || DEFAULT_MONTHS_AHEAD, 24);
    await ensureUpcomingMonths(months);

    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const to = new Date(from);
    to.setUTCMonth(to.getUTCMonth() + months);

    const [days, next] = await Promise.all([getEffectiveDays(from, to), getNextDay(now)]);

    let nextSummary = null;
    if (next) {
      const { fixtures, akcFixtures } = await getAffectedFixtures(next);
      const all = [...fixtures, ...akcFixtures];
      nextSummary = {
        ...next,
        affectedCount: all.length,
        rescheduledCount: all.filter((f) => f.status === 'RESCHEDULED').length,
      };
    }

    res.status(200).json({ success: true, data: { days, next: nextSummary } });
  } catch (error) {
    next(error);
  }
};

// @desc    One month of calendar intelligence: Umuganda + fixtures + reschedules
// @route   GET /api/v1/umuganda/calendar?year&month
// @access  Public
const getUmugandaCalendar = async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getUTCFullYear();
    const month = parseInt(req.query.month, 10) || now.getUTCMonth() + 1;
    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'month must be 1-12' });
    }

    await ensureUpcomingMonths(1, new Date(Date.UTC(year, month - 1, 1)));

    // Widen a day either side so Kigali-local days at the month boundary are not
    // dropped (UTC+2 means a Kigali day can start on the previous UTC day).
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 1));
    const qFrom = new Date(from.getTime() - 86400000);
    const qTo = new Date(to.getTime() + 86400000);

    const [umugandaDays, fixtures, akcFixtures] = await Promise.all([
      prisma.umugandaDay.findMany({
        where: { OR: [{ year, month }, { date: { gte: qFrom, lt: qTo } }] },
        orderBy: { date: 'asc' },
      }),
      prisma.fixture.findMany({
        where: { matchDate: { gte: qFrom, lt: qTo } },
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true, logo: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, logo: true } },
          league: { select: { id: true, name: true, sportId: true } },
        },
        orderBy: { matchDate: 'asc' },
      }),
      prisma.akcFixture.findMany({
        where: { matchDate: { gte: qFrom, lt: qTo } },
        include: {
          homeTeam: { include: { school: { select: { id: true, name: true, shortName: true } } } },
          awayTeam: { include: { school: { select: { id: true, name: true, shortName: true } } } },
        },
        orderBy: { matchDate: 'asc' },
      }),
    ]);

    const shape = (f, kind) => ({
      id: f.id,
      kind,
      matchDate: f.matchDate,
      status: f.status,
      venue: f.venue,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      league: f.league || null,
      umugandaDayId: f.umugandaDayId,
      umugandaDecision: f.umugandaDecision,
      originalMatchDate: f.originalMatchDate,
      rescheduleReason: f.rescheduleReason,
      dayKey: kigaliDayKey(f.matchDate),
    });

    res.status(200).json({
      success: true,
      data: {
        year,
        month,
        umugandaDays: umugandaDays.map((u) => ({ ...u, dayKey: dayKey(u.date) })),
        events: [
          ...fixtures.map((f) => shape(f, 'LEAGUE')),
          ...akcFixtures.map((f) => shape(withAkcTeamNames(f), 'AMASHURI')),
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public Umuganda notices (newest first)
// @route   GET /api/v1/umuganda/notices
// @access  Public
const getNotices = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    res.status(200).json({ success: true, data: await getPublishedNotices(limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Every upcoming fixture that collides with an Umuganda day
// @route   GET /api/v1/umuganda/conflicts
// @access  Admin
const getConflicts = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months, 10) || 6, 24);
    await ensureUpcomingMonths(months);

    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const to = new Date(from);
    to.setUTCMonth(to.getUTCMonth() + months);

    const days = await getEffectiveDays(from, to);
    const out = [];
    for (const day of days) {
      const { fixtures, akcFixtures } = await getAffectedFixtures(day);
      const all = [
        ...fixtures.map((f) => ({ ...f, kind: 'LEAGUE' })),
        ...akcFixtures.map((f) => ({ ...f, kind: 'AMASHURI' })),
      ];
      if (all.length) out.push({ umugandaDay: day, events: all });
    }

    res.status(200).json({ success: true, data: out });
  } catch (error) {
    next(error);
  }
};

// @desc    One Umuganda day in full
// @route   GET /api/v1/umuganda/:id
// @access  Public
const getUmugandaDay = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const day = await prisma.umugandaDay.findUnique({
      where: { id },
      include: { notices: { where: { published: true }, orderBy: { createdAt: 'desc' } } },
    });
    if (!day) return res.status(404).json({ success: false, message: 'Umuganda day not found' });

    const { fixtures, akcFixtures } = await getAffectedFixtures(day);
    const all = [
      ...fixtures.map((f) => ({ ...f, kind: 'LEAGUE' })),
      ...akcFixtures.map((f) => ({ ...f, kind: 'AMASHURI' })),
    ];

    res.status(200).json({
      success: true,
      data: {
        ...day,
        dayKey: dayKey(day.date),
        events: all,
        affected: all.filter((f) => UMUGANDA_STATUSES.includes(f.status)),
        rescheduled: all.filter((f) => f.status === 'RESCHEDULED'),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a special / corrected Umuganda date
// @route   POST /api/v1/umuganda
// @access  Admin
const createUmugandaDay = async (req, res, next) => {
  try {
    const { date, title, description, status, startTime, endTime } = req.body;
    const d = toDateOnly(date);
    if (!d) return res.status(400).json({ success: false, message: 'A valid date is required' });

    const existing = await prisma.umugandaDay.findUnique({ where: { date: d } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An Umuganda day already exists on that date. Edit it instead.',
      });
    }

    const day = await prisma.umugandaDay.create({
      data: {
        date: d,
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
        title: title || null,
        description: description || null,
        // Hand-added dates are the administrator's word, so they are official
        // from the start unless explicitly said otherwise.
        status: status || 'CONFIRMED',
        source: 'ADMIN',
        autoGenerated: false,
        overridden: true,
        startTime: startTime || '08:00',
        endTime: endTime || '11:00',
        createdById: req.user?.id ?? null,
      },
    });

    await logActivity({
      userId: req.user?.id,
      action: 'CREATE',
      detail: `Added Umuganda day ${dayKey(day.date)}`,
      module: 'UMUGANDA',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: day });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit / override / disable an Umuganda day
// @route   PATCH /api/v1/umuganda/:id
// @access  Admin
const updateUmugandaDay = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const day = await prisma.umugandaDay.findUnique({ where: { id } });
    if (!day) return res.status(404).json({ success: false, message: 'Umuganda day not found' });

    const { date, title, description, status, startTime, endTime } = req.body;

    let nextDate;
    if (date !== undefined) {
      const d = toDateOnly(date);
      if (!d) return res.status(400).json({ success: false, message: 'Invalid date' });
      const clash = await prisma.umugandaDay.findUnique({ where: { date: d } });
      if (clash && clash.id !== id) {
        return res.status(409).json({
          success: false,
          message: 'Another Umuganda day already sits on that date.',
        });
      }
      nextDate = d;
    }

    const updated = await prisma.umugandaDay.update({
      where: { id },
      data: {
        date: nextDate,
        // Keep month/year in step with a moved date so month lookups stay right.
        month: nextDate ? nextDate.getUTCMonth() + 1 : undefined,
        year: nextDate ? nextDate.getUTCFullYear() : undefined,
        title: title !== undefined ? title || null : undefined,
        description: description !== undefined ? description || null : undefined,
        status: status !== undefined ? status : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        // Any human edit marks the row as overridden, which is what stops
        // generation from ever reclaiming it.
        overridden: true,
      },
    });

    await logActivity({
      userId: req.user?.id,
      action: 'UPDATE',
      detail: `Updated Umuganda day ${dayKey(updated.date)} (status ${updated.status})`,
      module: 'UMUGANDA',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an Umuganda day
// @route   DELETE /api/v1/umuganda/:id
// @access  Admin
const deleteUmugandaDay = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const day = await prisma.umugandaDay.findUnique({ where: { id } });
    if (!day) return res.status(404).json({ success: false, message: 'Umuganda day not found' });

    // Deleting a GENERATED row is pointless — generation would recreate it. Ask
    // the admin to disable it instead, which is durable.
    if (day.source === 'GENERATED') {
      return res.status(400).json({
        success: false,
        message: 'Generated dates cannot be deleted — set the status to DISABLED instead.',
      });
    }

    await prisma.umugandaDay.delete({ where: { id } });
    await logActivity({
      userId: req.user?.id,
      action: 'DELETE',
      detail: `Deleted Umuganda day ${dayKey(day.date)}`,
      module: 'UMUGANDA',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Umuganda day removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate the upcoming months' expected dates
// @route   POST /api/v1/umuganda/generate
// @access  Admin
const regenerate = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.body?.months, 10) || DEFAULT_MONTHS_AHEAD, 24);
    const { created, checked, flagged } = await prepareCalendar(months);
    await logActivity({
      userId: req.user?.id,
      action: 'CREATE',
      detail: `Generated ${created.length} Umuganda date(s); flagged ${flagged} fixture(s)`,
      module: 'UMUGANDA',
      ip: req.ip,
    });
    res.status(200).json({
      success: true,
      data: { created: created.length, days: created, checked, flagged },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish an announcement against an Umuganda day
// @route   POST /api/v1/umuganda/:id/announcement
// @access  Admin
const createAnnouncement = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const day = await prisma.umugandaDay.findUnique({ where: { id } });
    if (!day) return res.status(404).json({ success: false, message: 'Umuganda day not found' });

    const { title, body } = req.body;

    // Announcements are free text and an admin may legitimately post several per
    // day, so they carry their own dedupe key rather than going through
    // raiseNotice (which dedupes per fixture decision).
    const notice = await prisma.umugandaNotice.create({
      data: {
        umugandaDayId: id,
        kind: 'GENERAL',
        title,
        body,
        dedupeKey: `${id}:announcement:${Date.now()}`,
      },
    });

    await logActivity({
      userId: req.user?.id,
      action: 'CREATE',
      detail: `Umuganda announcement: ${title}`,
      module: 'UMUGANDA',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

// Formats a team pairing for notice copy without pulling in i18n on the server.
const pairing = (f) => `${f.homeTeam?.name || 'TBD'} vs ${f.awayTeam?.name || 'TBD'}`;

// @desc    Record the administrator's decision about a match on an Umuganda day
// @route   POST /api/v1/umuganda/events/:kind/:id/decision
// @access  Admin
//
// The four options are CONTINUE / MOVED / AFTER_UMUGANDA / AFFECTED. There is no
// cancel: the platform surfaces the clash, a human resolves it.
const setEventDecision = async (req, res, next) => {
  try {
    const kind = String(req.params.kind || '').toUpperCase() === 'AMASHURI' ? 'AMASHURI' : 'LEAGUE';
    const id = parseInt(req.params.id, 10);
    const { decision, newDate, reason } = req.body;

    const delegate = kind === 'AMASHURI' ? prisma.akcFixture : prisma.fixture;
    const fixture = await delegate.findUnique({
      where: { id },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    });
    if (!fixture) return res.status(404).json({ success: false, message: 'Match not found' });

    // League fixtures reuse the standard per-fixture ownership rule; Amashuri
    // fixtures are governed by the Amashuri admins.
    if (kind === 'LEAGUE') {
      if (!(await canManageFixture(req.user, fixture))) {
        return res.status(403).json({ success: false, message: 'Not authorized for this fixture' });
      }
    } else if (!['SUPERADMIN', 'AMASHURI_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this fixture' });
    }

    if ((decision === 'MOVED' || decision === 'AFTER_UMUGANDA') && !newDate) {
      return res.status(400).json({
        success: false,
        message: 'A new date and time is required for this decision',
      });
    }

    const parsedNew = newDate ? new Date(newDate) : null;
    if (parsedNew && Number.isNaN(parsedNew.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid new date' });
    }

    // Which Umuganda day this decision is about. Prefer the one already linked;
    // otherwise work it out from the date the match currently sits on.
    let umugandaDayId = fixture.umugandaDayId;
    if (!umugandaDayId) {
      const found = await detectConflict(fixture.matchDate);
      umugandaDayId = found ? found.umugandaDay.id : null;
    }
    if (!umugandaDayId) {
      return res.status(400).json({
        success: false,
        message: 'This match is not on an Umuganda day',
      });
    }

    // Written once and never overwritten, so the date the public first saw
    // survives any number of later moves.
    const originalMatchDate = fixture.originalMatchDate || fixture.matchDate;

    const statusFor = {
      CONTINUE: 'CONFIRMED',
      MOVED: 'RESCHEDULED',
      AFTER_UMUGANDA: 'RESCHEDULED',
      AFFECTED: 'UMUGANDA_CONFLICT',
    };

    const updated = await delegate.update({
      where: { id },
      data: {
        umugandaDayId,
        umugandaDecision: decision,
        status: statusFor[decision],
        matchDate: parsedNew || undefined,
        originalMatchDate: parsedNew ? originalMatchDate : fixture.originalMatchDate,
        rescheduleReason: reason !== undefined ? reason || null : undefined,
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    });

    // Public notice. raiseNotice is idempotent per (day, match, decision, target
    // date), so re-saving the same decision does not notify twice.
    const noticeKind = {
      CONTINUE: 'CONTINUE',
      MOVED: 'RESCHEDULED',
      AFTER_UMUGANDA: 'AFTER_UMUGANDA',
      AFFECTED: 'AFFECTED',
    }[decision];

    const bodyFor = {
      CONTINUE: `${pairing(updated)} goes ahead as scheduled on Umuganda day.`,
      MOVED: `${pairing(updated)} has been moved because of Umuganda.`,
      AFTER_UMUGANDA: `${pairing(updated)} will take place after Umuganda.`,
      AFFECTED: `${pairing(updated)} is affected by Umuganda. A final decision is pending.`,
    };

    const notice = await raiseNotice({
      umugandaDayId,
      fixtureId: kind === 'LEAGUE' ? id : null,
      akcFixtureId: kind === 'AMASHURI' ? id : null,
      kind: noticeKind,
      title: pairing(updated),
      body: bodyFor[decision],
      originalDate: originalMatchDate,
      newDate: parsedNew,
      reason: reason || null,
    });

    await logActivity({
      userId: req.user?.id,
      action: 'UPDATE',
      detail: `Umuganda decision ${decision} on ${kind.toLowerCase()} match ${id}`,
      module: 'UMUGANDA',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: updated, notice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUmugandaDays,
  getUmugandaCalendar,
  getNotices,
  getConflicts,
  getUmugandaDay,
  createUmugandaDay,
  updateUmugandaDay,
  deleteUmugandaDay,
  regenerate,
  createAnnouncement,
  setEventDecision,
};
