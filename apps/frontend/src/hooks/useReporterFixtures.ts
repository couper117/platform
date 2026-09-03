import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyFixtures } from '../api/endpoints/reporter';
import useAuthStore from '../store/authStore';
import { ACTIVE_STATUSES, bySoonest, byNewest, isToday, isWithinDays } from '../lib/reporterMatch';

/**
 * The reporter's whole workload, fetched once.
 *
 * WHY ONE QUERY AND NOT FOUR. Today's screen, the match list, the sidebar footer
 * and the console's picker all ask the same question — "what am I assigned to?" —
 * and the answer is a single call the server already supports
 * (`GET /fixtures?reporterId=`). Sharing one query key means four screens agree,
 * one refetch updates all of them, and a reporter on a district ground's 3G pays
 * for it once.
 *
 * The buckets are derived here rather than in each screen because the definition
 * of "today" is a decision, not a detail: a match at 22:00 is still today's work,
 * and a 06:00 kick-off tomorrow is not.
 */
const useReporterFixtures = () => {
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: ['reporter-assignments', user?.id],
    queryFn: () => getMyFixtures(user!.id),
    enabled: !!user?.id,
    // A league admin can assign a match while the reporter is looking at the
    // list; a minute is soon enough to notice without hammering a mobile link.
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
      // Anything not still to be played: completed, abandoned, postponed. The
      // reporter's archive, and the only place their finished work is visible.
      closed: all.filter((f: any) => !ACTIVE_STATUSES.includes(f.status)).sort(byNewest),
      completed: all.filter((f: any) => f.status === 'COMPLETED').sort(byNewest),
      /** The one a reporter almost certainly wants: live now, else the next kick-off. */
      focus: live[0] || scheduled[0] || null,
    };
  }, [query.data]);

  return { ...query, ...buckets };
};

export default useReporterFixtures;
