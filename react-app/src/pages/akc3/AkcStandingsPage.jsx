import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Filter, Search, School } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import StandingsTable from '../../components/shared/StandingsTable';
import Skeleton from '../../components/shared/Skeleton';
import apiClient from '../../api/client';

const AkcStandingsPage = () => {
  const [competitionId, setCompetitionId] = useState('');

  const { data: competitions } = useQuery({
    queryKey: ['akc-competitions-list'],
    queryFn: async () => {
      // In a real app, you'd have an endpoint for this
      return { data: [] }; 
    },
  });

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <section className="bg-rwanda-blue py-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
        <ResponsiveWrapper className="relative z-10 space-y-4">
          <h1 className="text-5xl sm:text-6xl font-display uppercase tracking-tighter">School <span className="text-rwanda-yellow">Standings</span></h1>
          <p className="text-white/60 uppercase tracking-[0.3em] text-[10px] font-bold">Kagame Cup Competitive Rankings</p>
        </ResponsiveWrapper>
      </section>

      <ResponsiveWrapper className="mt-12">
        <div className="bg-white dark:bg-surface-dark2 p-8 rounded-3xl border border-surface-3 dark:border-white/5 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-display uppercase tracking-tight">Leaderboards</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Filtered by administrative level and category</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select className="bg-surface-2 dark:bg-white/5 border-none text-[11px] font-bold uppercase tracking-widest rounded-xl px-4 py-3 focus:ring-rwanda-blue">
                <option>National Level</option>
                <option>Province Level</option>
                <option>District Level</option>
              </select>
            </div>
          </div>

          <StandingsTable standings={[]} />
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

export default AkcStandingsPage;
