import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Search, Filter, Activity } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import Skeleton from '../../components/shared/Skeleton';
import apiClient from '../../api/client';

const AkcFixturesPage = () => {
  const [filters, setFilters] = useState({ status: 'SCHEDULED', competitionId: '', schoolId: '' });

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['akc-fixtures', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/akc3/fixtures', { params: filters });
      return data;
    },
  });

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <section className="bg-rwanda-blue py-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
        <ResponsiveWrapper className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-4 py-1 rounded-full mb-2">
            <GraduationCap size={12} className="text-rwanda-yellow" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Interschool Match Center</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-display uppercase tracking-tighter">AKC3 <span className="text-rwanda-yellow">Schedule</span></h1>
        </ResponsiveWrapper>
      </section>

      <div className="sticky top-[68px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5 shadow-sm">
        <ResponsiveWrapper>
          <div className="flex overflow-x-auto scrollbar-hide py-4 space-x-8 items-center no-wrap">
            {['SCHEDULED', 'LIVE', 'COMPLETED'].map(status => (
              <button 
                key={status}
                onClick={() => setFilters(prev => ({ ...prev, status }))}
                className={`text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filters.status === status ? 'text-rwanda-blue underline underline-offset-8 decoration-2' : 'opacity-40 hover:opacity-100'}`}
              >
                {status === 'SCHEDULED' ? 'Upcoming' : status === 'LIVE' ? 'Live Matches' : 'Results'}
              </button>
            ))}
          </div>
        </ResponsiveWrapper>
      </div>

      <ResponsiveWrapper className="mt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton type="card" count={4} />
          </div>
        ) : fixtures?.data?.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {fixtures.data.map(fixture => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        ) : (
          <div className="py-40 text-center space-y-4 opacity-20">
            <Activity size={64} className="mx-auto" />
            <h3 className="text-3xl font-display uppercase tracking-widest">No Matches Scheduled</h3>
          </div>
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default AkcFixturesPage;
