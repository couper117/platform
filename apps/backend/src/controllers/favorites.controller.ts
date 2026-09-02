/**
 * Following a team.
 *
 * Deliberately works without an account. Most people who follow a club will
 * never sign up, and requiring registration before someone can say "tell me
 * about Rayon Sports" loses exactly the audience the platform is for. A visitor
 * is identified by an opaque token their own browser generates and stores; the
 * server never derives it from an IP address, a fingerprint, or anything else
 * that identifies a person (Law 058/2021 art. 3).
 *
 * A row is owned by a signed-in user OR an anonymous token, never both. The two
 * unique constraints on the model are what keep a follower count honest when a
 * flaky connection retries the same request.
 */

const prisma = require('../config/db');

/**
 * The anonymous follower, if there is one.
 *
 * Read from a header the client sets, not from anything about the connection.
 * Constrained in shape so the column cannot be used as free storage, and so a
 * caller cannot pass something meaningful — an email, say — as their "token".
 */
const ANON_TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

const anonTokenOf = (req) => {
  const raw = String(req.headers['x-anon-id'] || '').trim();
  return ANON_TOKEN.test(raw) ? raw : null;
};

/**
 * Who is doing the following. Returns { userId } or { anonToken }, or null when
 * the caller has offered neither — which is a request we cannot attribute and
 * therefore cannot honour.
 */
const followerOf = (req) => {
  if (req.user?.id) return { userId: req.user.id, anonToken: null };
  const anonToken = anonTokenOf(req);
  return anonToken ? { userId: null, anonToken } : null;
};

const TEAM_SELECT = {
  id: true, name: true, shortName: true, logo: true, slug: true,
  sportId: true, city: true, primaryColor: true,
};

// @desc    Follow a team
// @route   POST /api/v1/favorites
// @access  Public (signed in, or with an anonymous token)
const addFavorite = async (req, res, next) => {
  try {
    const who = followerOf(req);
    if (!who) {
      return res.status(400).json({
        success: false,
        message: 'Send an X-Anon-Id header or sign in to follow a team.',
      });
    }

    const teamId = parseInt(req.body?.teamId);
    if (!Number.isFinite(teamId)) {
      return res.status(400).json({ success: false, message: 'teamId is required' });
    }
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: TEAM_SELECT });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Following twice is not an error — it is the same intent arriving again,
    // usually because a tap was repeated on a slow connection. Upsert so the
    // second one is a no-op rather than a duplicate or a 409 the UI must handle.
    const where = who.userId
      ? { teamId_userId: { teamId, userId: who.userId } }
      : { teamId_anonToken: { teamId, anonToken: who.anonToken } };

    await prisma.favorite.upsert({
      where,
      update: {},
      create: { teamId, ...who },
    });

    const followers = await prisma.favorite.count({ where: { teamId } });
    res.status(201).json({ success: true, data: { team, following: true, followers } });
  } catch (error) {
    next(error);
  }
};

// @desc    Stop following a team
// @route   DELETE /api/v1/favorites/:teamId
// @access  Public (signed in, or with an anonymous token)
const removeFavorite = async (req, res, next) => {
  try {
    const who = followerOf(req);
    if (!who) return res.status(400).json({ success: false, message: 'Nothing to unfollow.' });

    const teamId = parseInt(req.params.teamId);
    if (!Number.isFinite(teamId)) {
      return res.status(400).json({ success: false, message: 'teamId is required' });
    }

    // deleteMany rather than delete: unfollowing something you do not follow is
    // the state the caller asked for, not a 404 to explain.
    await prisma.favorite.deleteMany({
      where: { teamId, ...(who.userId ? { userId: who.userId } : { anonToken: who.anonToken }) },
    });

    const followers = await prisma.favorite.count({ where: { teamId } });
    res.status(200).json({ success: true, data: { following: false, followers } });
  } catch (error) {
    next(error);
  }
};

// @desc    The teams you follow, with what is next for each
// @route   GET /api/v1/favorites
// @access  Public (signed in, or with an anonymous token)
const getFavorites = async (req, res, next) => {
  try {
    const who = followerOf(req);
    if (!who) return res.status(200).json({ success: true, count: 0, data: [] });

    const rows = await prisma.favorite.findMany({
      where: who.userId ? { userId: who.userId } : { anonToken: who.anonToken },
      include: { team: { select: TEAM_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const teamIds = rows.map((r) => r.teamId);
    if (!teamIds.length) return res.status(200).json({ success: true, count: 0, data: [] });

    // The next match and the last result for each team, in two queries rather
    // than two per team — this list is the home screen for a follower, so it
    // must not scale with how many clubs they care about.
    const teamFilter = { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] };
    const fixtureShape = {
      id: true, matchDate: true, status: true, homeScore: true, awayScore: true,
      homeTeam: { select: { id: true, name: true, logo: true } },
      awayTeam: { select: { id: true, name: true, logo: true } },
    };

    const [upcoming, recent] = await Promise.all([
      prisma.fixture.findMany({
        where: { ...teamFilter, status: { in: ['SCHEDULED', 'CONFIRMED', 'LIVE'] } },
        select: fixtureShape,
        orderBy: { matchDate: 'asc' },
        take: 200,
      }),
      prisma.fixture.findMany({
        where: { ...teamFilter, status: 'COMPLETED' },
        select: fixtureShape,
        orderBy: { matchDate: 'desc' },
        take: 200,
      }),
    ]);

    const firstFor = (list, teamId) =>
      list.find((f) => f.homeTeam?.id === teamId || f.awayTeam?.id === teamId) || null;

    const followerCounts = await prisma.favorite.groupBy({
      by: ['teamId'],
      where: { teamId: { in: teamIds } },
      _count: { teamId: true },
    });
    const followersBy = new Map(followerCounts.map((c) => [c.teamId, c._count.teamId]));

    const data = rows.map((r) => ({
      teamId: r.teamId,
      team: r.team,
      followedAt: r.createdAt,
      followers: followersBy.get(r.teamId) ?? 0,
      nextFixture: firstFor(upcoming, r.teamId),
      lastResult: firstFor(recent, r.teamId),
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Teams worth following next.
 *
 * Derived, not predicted: clubs in the sports you already follow, ranked by how
 * many people follow them, with the rest of the platform's most-followed filling
 * any gap. Calling that a recommendation engine would be dressing up a sort —
 * but it is honest, it needs no profile of anybody, and it answers the question
 * a new visitor actually has, which is "who else is there?".
 */
// @desc    Teams you might want to follow
// @route   GET /api/v1/favorites/suggestions
// @access  Public
const getSuggestions = async (req, res, next) => {
  try {
    const who = followerOf(req);
    const mine = who
      ? await prisma.favorite.findMany({
          where: who.userId ? { userId: who.userId } : { anonToken: who.anonToken },
          include: { team: { select: { sportId: true } } },
        })
      : [];

    const followedIds = mine.map((f) => f.teamId);
    const sports = [...new Set(mine.map((f) => f.team?.sportId).filter((s) => s != null))];

    const popularity = await prisma.favorite.groupBy({
      by: ['teamId'],
      _count: { teamId: true },
    });
    const followersBy = new Map(popularity.map((p) => [p.teamId, p._count.teamId]));

    const candidates = await prisma.team.findMany({
      where: {
        id: { notIn: followedIds.length ? followedIds : [0] },
        active: true,
        status: 'VERIFIED',
        ...(sports.length ? { sportId: { in: sports } } : {}),
      },
      select: TEAM_SELECT,
      take: 100,
    });

    // If following one sport leaves too little to suggest, widen rather than
    // return a near-empty list.
    let pool = candidates;
    if (pool.length < 6 && sports.length) {
      const wider = await prisma.team.findMany({
        where: { id: { notIn: [...followedIds, ...pool.map((t) => t.id)] }, active: true, status: 'VERIFIED' },
        select: TEAM_SELECT,
        take: 50,
      });
      pool = [...pool, ...wider];
    }

    const data = pool
      .map((t) => ({ ...t, followers: followersBy.get(t.id) ?? 0 }))
      .sort((a, b) => b.followers - a.followers || a.name.localeCompare(b.name))
      .slice(0, 12);

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    How many people follow a team
// @route   GET /api/v1/favorites/count/:teamId
// @access  Public
const getFollowerCount = async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.teamId);
    if (!Number.isFinite(teamId)) {
      return res.status(400).json({ success: false, message: 'teamId is required' });
    }
    const who = followerOf(req);
    const [followers, mine] = await Promise.all([
      prisma.favorite.count({ where: { teamId } }),
      who
        ? prisma.favorite.count({
            where: { teamId, ...(who.userId ? { userId: who.userId } : { anonToken: who.anonToken }) },
          })
        : 0,
    ]);
    res.status(200).json({ success: true, data: { teamId, followers, following: mine > 0 } });
  } catch (error) {
    next(error);
  }
};

/**
 * Adopt this browser's follows into the account that just signed in.
 *
 * Somebody follows three clubs, then creates an account, and their follows are
 * suddenly gone — they belong to the browser, and the server prefers the
 * account. Signing up would cost them the thing they came for. This moves them
 * across once, at the moment they sign in.
 *
 * A team already followed by the account is dropped rather than duplicated, and
 * the anonymous rows are removed either way: leaving them behind would double
 * the club's follower count for one person.
 */
// @desc    Move this browser's follows onto the signed-in account
// @route   POST /api/v1/favorites/claim
// @access  Private
const claimFavorites = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Sign in first.' });
    }
    const anonToken = anonTokenOf(req);
    if (!anonToken) return res.status(200).json({ success: true, data: { claimed: 0 } });

    const [anon, existing] = await Promise.all([
      prisma.favorite.findMany({ where: { anonToken }, select: { teamId: true } }),
      prisma.favorite.findMany({ where: { userId: req.user.id }, select: { teamId: true } }),
    ]);
    if (!anon.length) return res.status(200).json({ success: true, data: { claimed: 0 } });

    const already = new Set(existing.map((f) => f.teamId));
    const toAdd = anon.map((f) => f.teamId).filter((id) => !already.has(id));

    await prisma.$transaction([
      ...(toAdd.length
        ? [prisma.favorite.createMany({ data: toAdd.map((teamId) => ({ teamId, userId: req.user.id })) })]
        : []),
      prisma.favorite.deleteMany({ where: { anonToken } }),
    ]);

    res.status(200).json({ success: true, data: { claimed: toAdd.length, alreadyHad: anon.length - toAdd.length } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFavorite, removeFavorite, getFavorites, getSuggestions, getFollowerCount, claimFavorites, ANON_TOKEN,
};
