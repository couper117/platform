/**
 * Telling followers what happened.
 *
 * Addressed to a signed-in user OR an anonymous browser token, because
 * following a team never required an account and being told about it must not
 * either — a notification only the registered half of the audience could
 * receive would make the anonymous follow pointless.
 *
 * Every emitter here is best-effort: a match result is the record, and failing
 * to announce it must never roll back the thing being announced.
 */

const prisma = require('../config/db');

/** How many notifications one event may generate before it is capped. */
const MAX_FANOUT = 5000;

/**
 * Everyone following either side of a fixture, de-duplicated.
 *
 * Someone following both clubs in a derby is one person, and gets one
 * notification rather than two.
 */
const followersOfTeams = async (teamIds) => {
  const ids = (teamIds || []).filter((id) => id != null);
  if (!ids.length) return [];

  const rows = await prisma.favorite.findMany({
    where: { teamId: { in: ids } },
    select: { userId: true, anonToken: true },
    take: MAX_FANOUT,
  });

  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const key = r.userId ? `u:${r.userId}` : `a:${r.anonToken}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ userId: r.userId ?? null, anonToken: r.anonToken ?? null });
  }
  return out;
};

/**
 * Send one notification to every follower of these teams.
 *
 * `subjectType`/`subjectId` say what it is about, so a later change to the same
 * thing — a postponement, say — can withdraw the messages it makes obsolete
 * instead of leaving a follower holding two that contradict each other.
 */
const notifyFollowers = async ({ teamIds, kind, title, body = null, link = null, subjectType = null, subjectId = null, replace = false }: any) => {
  try {
    const recipients = await followersOfTeams(teamIds);
    if (!recipients.length) return { sent: 0 };

    if (replace && subjectType && subjectId != null) {
      // Only the unread ones. Someone who has already read "kick-off in an hour"
      // keeps it; someone who has not should not now be told two different things.
      await prisma.notification.deleteMany({ where: { subjectType, subjectId, readAt: null } });
    }

    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        ...r,
        kind,
        title,
        body: body ?? null,
        link: link ?? null,
        subjectType: subjectType ?? null,
        subjectId: subjectId ?? null,
      })),
    });

    return { sent: recipients.length };
  } catch (error) {
    // Never let announcing a thing break the thing.
    console.log(`Notification fan-out skipped (${kind}): ${error.message}`);
    return { sent: 0, error: error.message };
  }
};

const matchLine = (f) => `${f.homeTeam?.name ?? 'Home'} v ${f.awayTeam?.name ?? 'Away'}`;
const scoreLine = (f) =>
  `${f.homeTeam?.name ?? 'Home'} ${f.homeScore ?? 0}-${f.awayScore ?? 0} ${f.awayTeam?.name ?? 'Away'}`;

/** A match has kicked off. */
const notifyKickOff = (fixture) =>
  notifyFollowers({
    teamIds: [fixture.homeTeamId, fixture.awayTeamId],
    kind: 'MATCH_STARTING',
    title: `${matchLine(fixture)} is under way`,
    body: fixture.venue || null,
    link: `/matches/${fixture.id}`,
    subjectType: 'fixture',
    subjectId: fixture.id,
  });

/** A match has finished. */
const notifyResult = (fixture) =>
  notifyFollowers({
    teamIds: [fixture.homeTeamId, fixture.awayTeamId],
    kind: 'MATCH_RESULT',
    title: `Full time: ${scoreLine(fixture)}`,
    link: `/matches/${fixture.id}`,
    subjectType: 'fixture',
    subjectId: fixture.id,
    // The result supersedes "is under way" for anyone who never read it.
    replace: true,
  });

/** A match has been moved or called off. */
const notifyStatusChange = (fixture, status) => {
  const kinds = { POSTPONED: 'MATCH_POSTPONED', CANCELLED: 'MATCH_CANCELLED', RESCHEDULED: 'MATCH_UPDATE' };
  const kind = kinds[status];
  if (!kind) return Promise.resolve({ sent: 0 });
  return notifyFollowers({
    teamIds: [fixture.homeTeamId, fixture.awayTeamId],
    kind,
    title: `${matchLine(fixture)} — ${String(status).toLowerCase()}`,
    link: `/matches/${fixture.id}`,
    subjectType: 'fixture',
    subjectId: fixture.id,
    replace: true,
  });
};

/** A team sheet has been published. */
const notifyLineup = (fixture, teamName) =>
  notifyFollowers({
    teamIds: [fixture.homeTeamId, fixture.awayTeamId],
    kind: 'LINEUP_PUBLISHED',
    title: `${teamName} have named their side`,
    body: matchLine(fixture),
    link: `/matches/${fixture.id}`,
    subjectType: 'fixture',
    subjectId: fixture.id,
  });

module.exports = {
  MAX_FANOUT,
  followersOfTeams,
  notifyFollowers,
  notifyKickOff,
  notifyResult,
  notifyStatusChange,
  notifyLineup,
};
