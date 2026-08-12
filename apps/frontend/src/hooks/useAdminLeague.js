import { useQuery } from '@tanstack/react-query';
import { getLeagues } from '../api/endpoints/leagues';
import useAuthStore from '../store/authStore';

/**
 * Resolves the league a League Admin operates on: their assigned leagueId when
 * present, else the first available league. Shared by every /admin/league/* page
 * so they all scope to the same competition.
 */
export default function useAdminLeague() {
  const { user } = useAuthStore();
  const { data } = useQuery({ queryKey: ['admin-leagues'], queryFn: () => getLeagues() });
  const leagues = data?.data || [];
  const leagueId = user?.leagueId ?? leagues[0]?.id ?? null;
  const league = leagues.find((l) => l.id === leagueId) || null;
  return { leagueId, league, leagues };
}
