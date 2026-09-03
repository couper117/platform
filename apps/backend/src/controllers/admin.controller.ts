const prisma = require('../config/db');
const logActivity = require('../utils/activityLogger');
const {
  CAPABILITIES, ALL, ROLE_CAPABILITIES, isKnown, capabilitiesFor, roleCapabilities, can,
} = require('../services/capabilities.rules');

// @desc    Federations (each = a sport) with their assigned admins + the Amashuri admins
// @route   GET /api/v1/admin/roster
// @access  Private (SUPERADMIN)
const getRoster = async (req, res, next) => {
  try {
    const federations = await prisma.federation.findMany({
      orderBy: { name: 'asc' },
      include: {
        sport: { select: { id: true, name: true, slug: true, icon: true } },
        admins: {
          include: { user: { select: { id: true, fullName: true, email: true, username: true } } },
        },
      },
    });
    const amashuriAdmins = await prisma.user.findMany({
      where: { role: 'AMASHURI_ADMIN' },
      select: { id: true, fullName: true, email: true, username: true },
    });
    res.status(200).json({ success: true, data: { federations, amashuriAdmins } });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a user as the Amashuri (inter-school games) admin
// @route   POST /api/v1/admin/assign-amashuri-admin
// @access  Private (SUPERADMIN)
const assignAmashuriAdmin = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'SUPERADMIN') {
      return res.status(400).json({ success: false, message: 'User is already a super admin' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'AMASHURI_ADMIN' },
      select: { id: true, fullName: true, email: true, username: true, role: true },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Assign Amashuri Admin',
      detail: `Assigned ${user.email} as Amashuri admin`,
      module: 'admin',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an admin assignment (federation admin or Amashuri admin) → back to PUBLIC
// @route   POST /api/v1/admin/revoke-admin
// @access  Private (SUPERADMIN)
const revokeAdmin = async (req, res, next) => {
  try {
    const { userId, federationId } = req.body;
    const uid = parseInt(userId);
    if (federationId) {
      await prisma.federationAdminAssignment.deleteMany({ where: { userId: uid, federationId: parseInt(federationId) } });
    }
    // If the user has no remaining federation/amashuri privileges, drop to PUBLIC.
    const remaining = await prisma.federationAdminAssignment.count({ where: { userId: uid } });
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (user && user.role !== 'SUPERADMIN' && remaining === 0) {
      await prisma.user.update({ where: { id: uid }, data: { role: 'PUBLIC' } });
    }
    res.status(200).json({ success: true, message: 'Admin access revoked' });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggregate dashboard counters + recent activity
// @route   GET /api/v1/admin/stats
// @access  Private (SUPERADMIN | LEAGUE_ADMIN | FEDERATION_ADMIN)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      leagues, teams, players, pendingTeams, pendingDocs,
      liveFixtures, unreadContacts, recentActivity, upcomingFixtures,
    ] = await Promise.all([
      prisma.league.count({ where: { active: true } }),
      prisma.team.count({ where: { active: true } }),
      prisma.player.count({ where: { active: true } }),
      prisma.team.count({ where: { status: 'PENDING' } }),
      prisma.playerDocument.count({ where: { status: 'PENDING' } }),
      prisma.fixture.count({ where: { status: 'LIVE' } }),
      prisma.contact.count({ where: { status: 'NEW' } }),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.fixture.findMany({
        where: { status: 'SCHEDULED' },
        take: 5,
        orderBy: { matchDate: 'asc' },
        include: { homeTeam: true, awayTeam: true, league: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        leagues, teams, players, pendingTeams, pendingDocs,
        liveFixtures, unreadContacts, recentActivity, upcomingFixtures,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    All platform users (for the Super Admin "Users" module)
// @route   GET /api/v1/admin/users
// @access  Private (SUPERADMIN)
const getUsers = async (req, res, next) => {
  try {
    const { role, q } = req.query;
    const where: any = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { fullName: { contains: String(q), mode: 'insensitive' } },
        { email: { contains: String(q), mode: 'insensitive' } },
        { username: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, fullName: true, email: true, username: true, role: true,
        active: true, verified: true, createdAt: true, lastLogin: true,
        grantedCapabilities: true, revokedCapabilities: true,
      },
    });

    // Resolved capabilities travel with each row so the list can show what an
    // account can actually do, not merely what its role suggests. The raw grant
    // and revoke arrays come too, because the editor needs to show which entries
    // are exceptions someone made rather than defaults of the role.
    const data = users.map((u) => ({ ...u, capabilities: capabilitiesFor(u) }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// Every role the platform defines. SCHOOL_COORDINATOR was missing, so the one
// role that exists purely to be delegated could not be assigned from here.
const ASSIGNABLE_ROLES = Object.keys(ROLE_CAPABILITIES);

// @desc    Update a user's role / active flag
// @route   PATCH /api/v1/admin/users/:id
// @access  Private (SUPERADMIN)
/**
 * Read a capability list off the request body.
 *
 * Returns { list } or { error }. Unknown names are refused rather than stored:
 * a misspelled capability would sit in the database looking like a grant and
 * never match anything, which is worse than a rejection because nobody would
 * know it was doing nothing.
 */
const readCapabilityList = (value, field) => {
  if (value === undefined) return { list: undefined };
  if (!Array.isArray(value)) return { error: `${field} must be an array of capability names` };

  const list = [...new Set(value.map((c) => String(c).trim()).filter(Boolean))];
  const unknown = list.filter((c) => !isKnown(c) || c === '*');
  if (unknown.length) {
    return { error: `Unknown ${field}: ${unknown.join(', ')}` };
  }
  return { list };
};

/**
 * Create a staff account.
 *
 * There was no way to make one. The only registration path is
 * /auth/team/register, which creates a club and its manager — so a Super Admin
 * could change the role of somebody who had already registered a team, and could
 * not bring a reporter, a league administrator or an Amashuri administrator into
 * existence at all. Every such account on this platform came from the seed.
 *
 * The password is generated rather than chosen by the administrator, and
 * returned exactly once. An administrator who picks a colleague's password knows
 * it, and one who knows it can act as them — which quietly undoes the point of
 * the activity log recording who did what.
 */
// @desc    Create a staff account
// @route   POST /api/v1/admin/users
// @access  Private (users.write)
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, username, role, phone } = req.body;

    if (!fullName || String(fullName).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'fullName is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }
    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `role must be one of ${ASSIGNABLE_ROLES.join(', ')}` });
    }

    // Derived from the email when not given, because an administrator inventing
    // usernames is an administrator inventing collisions.
    const handle = String(username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const clash = await prisma.user.findFirst({ where: { OR: [{ username: handle }, { email }] } });
    if (clash) {
      return res.status(409).json({
        success: false,
        message: clash.email === email ? 'That email already has an account.' : 'That username is taken.',
      });
    }

    // Long enough that it does not need a rotation policy to be safe, and shown
    // once so it has to be handed over deliberately.
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const temporaryPassword = crypto.randomBytes(9).toString('base64url');

    const user = await prisma.user.create({
      data: {
        fullName: String(fullName).trim(),
        email,
        username: handle,
        phone: phone || null,
        role,
        password: await bcrypt.hash(temporaryPassword, 12),
        active: true,
        verified: true,
      },
      select: { id: true, fullName: true, email: true, username: true, role: true, active: true },
    });

    await logActivity({
      userId: req.user.id,
      action: 'Create User',
      detail: `Created ${user.email} as ${user.role}`,
      module: 'admin',
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      data: { ...user, capabilities: capabilitiesFor(user) },
      // Returned once and never stored in readable form. Hand it over directly;
      // it will not be shown again.
      temporaryPassword,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role, active flag and per-account capabilities
// @route   PATCH /api/v1/admin/users/:id
// @access  Private (users.write)
const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { role, active } = req.body;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    // Guard: never let the last active super admin be demoted/deactivated out of existence.
    if (target.role === 'SUPERADMIN' && (role && role !== 'SUPERADMIN' || active === false)) {
      const supers = await prisma.user.count({ where: { role: 'SUPERADMIN', active: true } });
      if (supers <= 1) return res.status(400).json({ success: false, message: 'Cannot remove the last active super admin' });
    }
    if (role && !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const granted = readCapabilityList(req.body.grantedCapabilities, 'grantedCapabilities');
    if (granted.error) return res.status(400).json({ success: false, message: granted.error });
    const revoked = readCapabilityList(req.body.revokedCapabilities, 'revokedCapabilities');
    if (revoked.error) return res.status(400).json({ success: false, message: revoked.error });

    // Locking yourself out is easy to do and tedious to undo — it needs another
    // super admin and a database session. Refuse it while the mistake is still
    // one field on a form.
    if (id === req.user.id) {
      const after = {
        ...target,
        role: role ?? target.role,
        grantedCapabilities: granted.list ?? target.grantedCapabilities,
        revokedCapabilities: revoked.list ?? target.revokedCapabilities,
      };
      if (!can(after, 'users.write')) {
        return res.status(400).json({
          success: false,
          message: 'That would remove your own permission to manage users. Ask another super admin to make this change.',
        });
      }
      if (active === false) {
        return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: role ?? undefined,
        active: active !== undefined ? !!active : undefined,
        grantedCapabilities: granted.list ?? undefined,
        revokedCapabilities: revoked.list ?? undefined,
      },
      select: {
        id: true, fullName: true, email: true, username: true, role: true, active: true,
        grantedCapabilities: true, revokedCapabilities: true,
      },
    });

    // Log what changed about their access, not just that a row was written: this
    // is the record an audit would ask for.
    const changes = [];
    if (role && role !== target.role) changes.push(`role ${target.role} to ${role}`);
    if (active !== undefined && !!active !== target.active) changes.push(active ? 'reactivated' : 'deactivated');
    if (granted.list) changes.push(`granted [${granted.list.join(', ') || 'none'}]`);
    if (revoked.list) changes.push(`revoked [${revoked.list.join(', ') || 'none'}]`);

    await logActivity({
      userId: req.user.id,
      action: 'Update User',
      detail: `${user.email || user.username}: ${changes.join('; ') || 'no change'}`,
      module: 'admin',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: { ...user, capabilities: capabilitiesFor(user) } });
  } catch (error) {
    next(error);
  }
};

/**
 * The capability catalogue and the role defaults.
 *
 * Served rather than duplicated in the frontend so the grant editor and the
 * permissions matrix are drawn from the same policy the server enforces. A
 * hand-maintained copy in the browser is how the two drift.
 */
// @desc    The capability catalogue and what each role holds by default
// @route   GET /api/v1/admin/capabilities
// @access  Private (users.write)
const getCapabilityCatalogue = async (req, res, next) => {
  try {
    // Group by the prefix so the editor can render sections without a second
    // list to keep in step with this one.
    const groups = {};
    for (const name of ALL) {
      const group = name.split('.')[0];
      (groups[group] = groups[group] || []).push({ name, description: CAPABILITIES[name] });
    }

    const roles = Object.fromEntries(
      Object.keys(ROLE_CAPABILITIES).map((role) => [
        role,
        roleCapabilities(role).includes('*') ? ALL : roleCapabilities(role),
      ]),
    );

    res.status(200).json({ success: true, data: { capabilities: CAPABILITIES, groups, roles } });
  } catch (error) {
    next(error);
  }
};

// @desc    Live status of core platform services + runtime metrics
// @route   GET /api/v1/admin/system-health
// @access  Private (SUPERADMIN)
const KIGALI = 'Africa/Kigali';
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: KIGALI, year: 'numeric', month: '2-digit', day: '2-digit',
});

/**
 * Daily platform activity for the last N days.
 *
 * The dashboard's "platform activity" chart was drawing a hard-coded array —
 * `[30, 38, 45, 52, …]` — relabelled with today's dates on every render. On a
 * ministry's oversight screen that is not a placeholder, it is a fabricated
 * statistic: it moves, it looks measured, and it means nothing. The real numbers
 * are already being written by the visitor tracker on every request.
 *
 * Grouped in SQL rather than by pulling rows and counting in JS, because a busy
 * month of activity is a lot of rows to move to say fourteen numbers. Days with
 * no activity are filled in as zero — a gap in a time series should read as a
 * quiet day, not as a missing point the line skips over.
 *
 * DAYS ARE KIGALI DAYS. Prisma stores `createdAt` as a UTC timestamp, so grouping
 * it raw buckets by a day that starts at 02:00 local — and, worse, the series keys
 * built from a local midnight in Node came out one date behind the SQL buckets, so
 * today's activity matched no bucket at all and the chart drew a flat zero line on
 * a platform that was plainly being used. Both sides now speak the same calendar:
 * Postgres converts to Africa/Kigali before truncating, and the day list is built
 * with an en-CA formatter in the same zone (which yields YYYY-MM-DD).
 */
const getActivityTrend = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);

    // One day of slack on the lower bound: rows that fall outside the key list are
    // simply ignored, whereas a bound an hour too tight would silently drop a day.
    const since = new Date(Date.now() - days * 86400000);

    const rows: Array<{ day: string; count: number }> = await prisma.$queryRaw`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${KIGALI})::date, 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "ActivityLog"
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `;

    const byDay = new Map(rows.map((r) => [r.day, Number(r.count)]));

    const series = Array.from({ length: days }, (_, i) => {
      const key = dayKeyFmt.format(new Date(Date.now() - (days - 1 - i) * 86400000));
      return { date: key, count: byDay.get(key) ?? 0 };
    });

    res.status(200).json({ success: true, data: series });
  } catch (error) {
    next(error);
  }
};

const getSystemHealth = async (req, res, next) => {
  try {
    let dbOk = true;
    let dbLatencyMs = null;
    const t0 = process.hrtime.bigint();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Number(process.hrtime.bigint() - t0) / 1e6;
    } catch {
      dbOk = false;
    }

    const [users, fixtures, liveFixtures] = await Promise.all([
      prisma.user.count(),
      prisma.fixture.count(),
      prisma.fixture.count({ where: { status: 'LIVE' } }),
    ]);

    const mem = process.memoryUsage();
    res.status(200).json({
      success: true,
      data: {
        services: [
          { key: 'database', ok: dbOk, detail: dbOk ? `${dbLatencyMs.toFixed(0)} ms` : 'unreachable' },
          { key: 'api', ok: true, detail: 'responding' },
          { key: 'storage', ok: true, detail: 'available' },
          { key: 'realtime', ok: true, detail: 'SSE active' },
        ],
        metrics: {
          uptimeSec: Math.round(process.uptime()),
          memoryMb: Math.round(mem.rss / 1048576),
          node: process.version,
          env: process.env.NODE_ENV || 'development',
          users, fixtures, liveFixtures,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Media library — every uploaded image referenced across the platform
// @route   GET /api/v1/admin/media
// @access  Private (SUPERADMIN)
const getMediaLibrary = async (req, res, next) => {
  try {
    const [news, teams, sports, players] = await Promise.all([
      prisma.news.findMany({ where: { coverImage: { not: null } }, select: { id: true, title: true, coverImage: true }, take: 200 }),
      prisma.team.findMany({ where: { logo: { not: null } }, select: { id: true, name: true, logo: true }, take: 200 }),
      prisma.sport.findMany({ where: { coverImage: { not: null } }, select: { id: true, name: true, coverImage: true }, take: 200 }),
      prisma.player.findMany({ where: { photo: { not: null } }, select: { id: true, fullName: true, photo: true }, take: 200 }),
    ]);
    const inUse = [
      ...news.map((n) => ({ url: n.coverImage, source: 'news', label: n.title })),
      ...teams.map((t) => ({ url: t.logo, source: 'team', label: t.name })),
      ...sports.map((s) => ({ url: s.coverImage, source: 'sport', label: s.name })),
      ...players.map((p) => ({ url: p.photo, source: 'player', label: p.fullName })),
    ];

    // Uploads are now recorded as they happen, which the column scan above
    // cannot see: a file whose owner was since edited to point elsewhere is
    // still on disk, still costing storage, and was invisible here. Merged on
    // URL so anything already in use keeps the label that identifies it, and
    // anything only in the record shows up as unattached.
    const records = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { uploadedBy: { select: { id: true, fullName: true } } },
    });

    const byUrl = new Map(inUse.filter((m) => m.url).map((m) => [m.url, m]));
    for (const r of records) {
      const existing = byUrl.get(r.url);
      byUrl.set(r.url, {
        url: r.url,
        source: existing?.source || r.ownerType,
        label: existing?.label || null,
        purpose: r.purpose,
        bytes: r.bytes,
        mimeType: r.mimeType,
        uploadedBy: r.uploadedBy?.fullName || null,
        uploadedAt: r.createdAt,
        // Recorded but nothing points at it — a candidate for deletion.
        unattached: !existing,
      });
    }

    const media = [...byUrl.values()];
    res.status(200).json({
      success: true,
      count: media.length,
      tracked: records.length,
      unattached: media.filter((m) => m.unattached).length,
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats, getRoster, assignAmashuriAdmin, revokeAdmin,
  getUsers, createUser, updateUser, getCapabilityCatalogue,
  getSystemHealth, getMediaLibrary, getActivityTrend,
};
