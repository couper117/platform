import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyTeam, getMyFixtures } from '../api/endpoints/team';
import {
  ACTIVE_STATUSES, bySoonest, byNewest, isToday, isWithinDays,
} from '../lib/coachMatch';

/**
 * The coach's club, and the club's whole season, fetched once each.
 *
 * The mirror of useReporterFixtures. Five screens ask the same two questions —
 * "which club am I?" and "what are we playing?" — and sharing one query key each
 * means they agree, one refetch updates all of them, and a coach on a phone pays
 * for it once.
 *
 * `/teams/my` already returns the squad, the officials and the league standings,
 * so a page that needs the roster does NOT need its own request. The buckets are
 * derived here because the definition of "this week" is a decision rather than a
 * detail.
 */
export const useMyTeam = () =>
  useQuery({
    queryKey: ['team-my'],
    queryFn: getMyTeam,
    // The squad and the crest change rarely; a page switch should not refetch.
    staleTime: 60 * 1000,
  });

export const useTeamFixtures = (teamId?: number | null) => {
  const query = useQuery({
    queryKey: ['team-fixtures', teamId],
    queryFn: () => getMyFixtures(teamId!),
    enabled: !!teamId,
    // A league admin can schedule or move a match while the coach is looking at
    // the list; a minute is soon enough to notice without hammering a mobile link.
    refetchInterval: 60000,
  });

  const buckets = useMemo(() => {
    const all = query.data || [];
    const live = all.filter((f: any) => f.status === 'LIVE').sort(bySoonest);
    const scheduled = all.filter((f: any) => f.status === 'SCHEDULED').sort(bySoonest);
    const active = all.filter((f: any) => ACTIVE_STATUSES.includes(f.status)).sort(bySoonest);
    return {
      all,
      live,
      scheduled,
      active,
      today: active.filter((f: any) => isToday(f.matchDate)),
      week: scheduled.filter((f: any) => isWithinDays(f.matchDate, 7)),
      completed: all.filter((f: any) => f.status === 'COMPLETED').sort(byNewest),
      closed: all.filter((f: any) => !ACTIVE_STATUSES.includes(f.status)).sort(byNewest),
      /** Live now, else the next kick-off — the match the club is thinking about. */
      focus: live[0] || scheduled[0] || null,
    };
  }, [query.data]);

  return { ...query, ...buckets };
};

export default useMyTeam;
