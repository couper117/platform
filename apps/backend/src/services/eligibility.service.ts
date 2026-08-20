const prisma = require('../config/db');
// Pure decision logic lives in its own dependency-free module so it can be
// unit-tested without a database.
const { isForeign, ageCap, seasonRefYear, playerLeagueIssues } = require('./eligibility.rules');

// Government federation rules. Defaults apply until a super admin overrides them
// in Settings (grp = 'rules'). All values are integers.
const DEFAULTS = {
  'rules.squadMin': 7,          // min registered players to enter a league
  'rules.squadMax': 30,         // max players on a team roster
  'rules.maxForeign': 5,        // max non-Rwandan players per team
  'rules.yellowAccumBan': 4,    // yellow cards accumulated → 1-match ban
  'rules.redBanMatches': 1,     // matches banned per straight red card
  'rules.pointsWin': 3,
  'rules.pointsDraw': 1,
  'rules.pointsLoss': 0,
};

const RULE_LABELS = {
  'rules.squadMin': 'Minimum squad size to enter a league',
  'rules.squadMax': 'Maximum players per team',
  'rules.maxForeign': 'Maximum foreign players per team',
  'rules.yellowAccumBan': 'Yellow cards before a 1-match ban',
  'rules.redBanMatches': 'Matches banned per red card',
  'rules.pointsWin': 'Points for a win',
  'rules.pointsDraw': 'Points for a draw',
  'rules.pointsLoss': 'Points for a loss',
};

// Load the current rule set, merging DB overrides over the defaults.
const getRules = async () => {
  const rows = await prisma.setting.findMany({ where: { skey: { in: Object.keys(DEFAULTS) } } });
  const out = { ...DEFAULTS };
  for (const r of rows) {
    const n = parseInt(r.sval, 10);
    if (!Number.isNaN(n)) out[r.skey] = n;
  }
  return out;
};

// Ensure the rule rows exist so they show up (and are editable) in the admin
// Settings page. Idempotent — safe to call on boot.
const ensureRuleSettings = async () => {
  await prisma.$transaction(
    Object.entries(DEFAULTS).map(([skey, val]) =>
      prisma.setting.upsert({
        where: { skey },
        update: {},
        create: { skey, sval: String(val), label: RULE_LABELS[skey], grp: 'rules', isPublic: false },
      })
    )
  );
};

// Validate a player create/update within a team (no league context).
// opts: { excludePlayerId } when updating.
const validatePlayerInTeam = async (teamId, data, rules, opts: any = {}) => {
  const issues = [];
  const active = await prisma.player.findMany({
    where: { teamId, active: true, ...(opts.excludePlayerId ? { id: { not: opts.excludePlayerId } } : {}) },
    select: { id: true, jerseyNumber: true, nationality: true },
  });

  // Squad max
  if (active.length + 1 > rules['rules.squadMax']) {
    issues.push(`Squad is full — maximum ${rules['rules.squadMax']} players per team`);
  }

  // Jersey uniqueness
  if (data.jerseyNumber) {
    const jn = parseInt(data.jerseyNumber, 10);
    if (active.some((p) => p.jerseyNumber === jn)) {
      issues.push(`Jersey number ${jn} is already taken in this team`);
    }
  }

  // Foreign quota
  if (isForeign(data.nationality)) {
    const foreignCount = active.filter((p) => isForeign(p.nationality)).length;
    if (foreignCount + 1 > rules['rules.maxForeign']) {
      issues.push(`Foreign-player limit reached — maximum ${rules['rules.maxForeign']} per team`);
    }
  }

  return issues;
};

// Validate a whole team before it enters a league.
const validateTeamForLeague = async (team, league, rules) => {
  const issues = [];
  if (team.status !== 'VERIFIED') issues.push('Team must be verified by the federation before it can enter a competition');

  const players = await prisma.player.findMany({
    where: { teamId: team.id, active: true },
    select: { fullName: true, gender: true, dateOfBirth: true, nationality: true },
  });

  if (players.length < rules['rules.squadMin']) {
    issues.push(`Team needs at least ${rules['rules.squadMin']} registered players (has ${players.length})`);
  }

  const foreign = players.filter((p) => isForeign(p.nationality)).length;
  if (foreign > rules['rules.maxForeign']) {
    issues.push(`Team exceeds the foreign-player limit (${foreign}/${rules['rules.maxForeign']})`);
  }

  const refYear = seasonRefYear(league);
  for (const p of players) issues.push(...playerLeagueIssues(p, league, refYear));

  return issues;
};

module.exports = {
  DEFAULTS,
  RULE_LABELS,
  getRules,
  ensureRuleSettings,
  isForeign,
  seasonRefYear,
  playerLeagueIssues,
  validatePlayerInTeam,
  validateTeamForLeague,
};
