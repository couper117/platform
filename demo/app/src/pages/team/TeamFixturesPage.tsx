import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import apiClient from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import FixtureCard from '../../components/shared/FixtureCard';

const TeamFixturesPage = () => {
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team-dashboard-data'],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams/my');
      return data.data;
    },
  });

  const teamId = team?.id;

  const { data: fixtures, isLoading: fixturesLoading, isError } = useQuery({
    queryKey: ['team-fixtures-all', teamId],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures', { params: { teamId } });
      return data.data;
    },
    enabled: !!teamId,
  });

  const isLoading = teamLoading || (!!teamId && fixturesLoading);
  const upcoming = (fixtures || []).filter(f => f.status === 'SCHEDULED' || f.status === 'LIVE');
  const past = (fixtures || []).filter(f => f.status === 'COMPLETED');

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">Match <span className="text-red">Schedule</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Your team's fixtures and results</p>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : isError ? (
        <EmptyState icon={Activity} title="Couldn't load fixtures" hint="Something went wrong. Try refreshing the page." />
      ) : !fixtures?.length ? (
        <EmptyState icon={Activity} title="No fixtures yet" hint="Matches will appear here once your team is placed in a league schedule." />
      ) : (
        <div className="space-y-12">
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-2">Upcoming</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(f => <FixtureCard key={f.id} fixture={f} showLeague />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-2">Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.map(f => <FixtureCard key={f.id} fixture={f} showLeague />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamFixturesPage;
