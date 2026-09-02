import { useQuery } from '@tanstack/react-query';
import { getSports } from '../api/endpoints/sports';

/**
 * Resolve an Amashuri `sportId` to the sport itself.
 *
 * WHY THIS EXISTS AT ALL
 * `AkcTeam.sportId` and `AkcCompetition.sportId` are plain Int columns in the Prisma
 * schema with NO relation to `Sport`. The backend therefore cannot `include` the
 * sport on an Amashuri fixture — there is nothing to join — so the sport name has
 * never reached the client. That is why a school match rendered as
 * "Lycée de Kigali 1 : 1 IPRC Kigali" with no indication of whether it was football,
 * volleyball or basketball.
 *
 * The ID *is* in the payload (Prisma returns scalar columns by default), so this
 * closes the gap on the client using the sports list the app already caches under
 * `nav-sports` — no extra request, no schema change, no migration. Adding the missing
 * relation is the proper long-term fix and belongs in a backend migration; this makes
 * the screens correct today without touching a database that already has drift.
 */

export type Sport = {
  id: number;
  name: string;
  slug?: string;
  icon?: string;
  type?: string;
};

export default function useSportLookup() {
  // Same key as the header, so this is almost always already in cache.
  const { data } = useQuery({
    queryKey: ['nav-sports'],
    queryFn: getSports,
    staleTime: 300000,
  });

  const sports: Sport[] = (data as any)?.data ?? [];

  /**
   * Accepts anything that might carry a sport: a competition, a team, or a raw id.
   * Prefers the COMPETITION's sport when given a fixture — that is the authoritative
   * one for the match — and falls back to the home team's, since a team always has a
   * sportId while a competition's is nullable.
   */
  const bySportId = (sportId?: number | string | null): Sport | undefined => {
    if (sportId == null) return undefined;
    return sports.find((s) => String(s.id) === String(sportId));
  };

  const forFixture = (fixture: any): Sport | undefined =>
    bySportId(fixture?.competition?.sportId) ??
    bySportId(fixture?.homeTeam?.sportId) ??
    bySportId(fixture?.awayTeam?.sportId);

  return { sports, bySportId, forFixture };
}
