/**
 * Pure federation eligibility rules — no database, no IO, no imports.
 *
 * Extracted from eligibility.service so the decision logic can be unit-tested in
 * isolation (see test/unit/eligibility.test.ts). eligibility.service composes
 * these with Prisma queries; nothing here touches the database.
 */

// A player is "foreign" for quota purposes unless their nationality reads as
// Rwandan. Unknown/blank is treated as local, not foreign — never penalise a
// team for missing data.
const isForeign = (nationality: any) => {
  if (!nationality) return false;
  return !/rwand/i.test(String(nationality));
};

// "Under-N" cap for a league age category (null = no age restriction).
const ageCap = (category: any) =>
  ({ U13: 13, U15: 15, U17: 17, U20: 20, JUNIOR: 20 } as any)[category] || null;

// Reference year for age checks: the season's end year (e.g. "2025/2026" → 2026),
// else the start-date year, else the created year.
const seasonRefYear = (league: any) => {
  const m = String(league.season || '').match(/(\d{4})\D*(\d{4})?/);
  if (m) return parseInt(m[2] || m[1], 10);
  if (league.startDate) return new Date(league.startDate).getFullYear();
  return new Date(league.createdAt || Date.now()).getFullYear();
};

// Per-player eligibility against a specific league. Returns [] when eligible.
const playerLeagueIssues = (player: any, league: any, refYear: any) => {
  const issues: string[] = [];
  const pg = player.gender; // MALE | FEMALE
  if (league.gender === 'MALE' && pg !== 'MALE') issues.push(`${player.fullName}: league is men-only`);
  if (league.gender === 'FEMALE' && pg !== 'FEMALE') issues.push(`${player.fullName}: league is women-only`);

  const cap = ageCap(league.ageCategory);
  if (cap) {
    if (!player.dateOfBirth) {
      issues.push(`${player.fullName}: date of birth required for ${league.ageCategory}`);
    } else {
      const age = refYear - new Date(player.dateOfBirth).getFullYear();
      if (age >= cap) issues.push(`${player.fullName}: too old for ${league.ageCategory} (age ~${age})`);
    }
  }
  return issues;
};

module.exports = { isForeign, ageCap, seasonRefYear, playerLeagueIssues };
