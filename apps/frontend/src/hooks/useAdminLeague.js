import { useQuery } from '@tanstack/react-query';
import { getLeagues } from '../api/endpoints/leagues';
import useAuthStore from '../store/authStore';

/**
 * The league a League Admin operates on.
 *
 * `user.leagues` comes from /auth/me and holds exactly the competitions this
 * account was assigned to. It used to fall through to `leagues[0]` — the first
 * league the API happened to return — so a league admin's portal quietly showed
 * another competition's standings, reporters and match reports, and every write
 * they attempted from those pages was against a league they do not administer.
 *
 * For a super admin, who administers no league in particular but may act on any,
 * the first league remains a reasonable default.
 */
export default function useAdminLeague() {
  const { user } = useAuthStore();
  const { data } = useQuery({ queryKey: ['admin-leagues'], queryFn: () => getLeagues() });
  const all = data?.data || [];

  const assigned = user?.leagues || [];
  const scoped = user?.role === 'LEAGUE_ADMIN';

  // A league admin sees only their own competitions in any league picker.
  const leagues = scoped ? assigned : all;
  const leagueId = user?.leagueId ?? (scoped ? assigned[0]?.id ?? null : all[0]?.id ?? null);
  const league = [...leagues, ...all].find((l) => l.id === leagueId) || null;

  return {
    leagueId,
    league,
    leagues,
    /** True when a league admin has been given no league to run. */
    unassigned: scoped && assigned.length === 0,
  };
}
