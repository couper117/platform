import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Search, Filter, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getLeagues } from '../../api/endpoints/leagues';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import Skeleton from '../../components/shared/Skeleton';
import { format, addDays, subDays } from 'date-fns';

const FixturesPage = () => {
  const location = useLocation();
  const isResultsPage = location.pathname === '/results';
  
  const [filters, setFilters] = useState({
    status: isResultsPage ? 'COMPLETED' : 'SCHEDULED',
    leagueId: '',
    from: '',
    to: '',
  });

  const { data: leagues } = useQuery({
    queryKey: ['leagues-list-fixtures'],
    queryFn: () => getLeagues(),
  });

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['fixtures-list', filters],
    queryFn: () => getFixtures(filters),
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, status: isResultsPage ? 'COMPLETED' : 'SCHEDULED' }));
  }, [isResultsPage]);

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      {/* Header */}
      <section className="bg-surface-dark py-16 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <ResponsiveWrapper className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-red/10 border border-red/20 px-4 py-1 rounded-full mb-2">
            <Activity size={12} className="text-red animate-pulse" />
            <span className="text-[10px] font-bold text-red uppercase tracking-widest">Live Match Center</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter">
            {isResultsPage ? 'Match' : 'Upcoming'} <span className="text-red">{isResultsPage ? 'Results' : 'Fixtures'}</span>
          </h1>
          <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">Every match, every goal, every moment</p>
        </ResponsiveWrapper>
      </section>

      {/* Control Bar */}
      <div className="sticky top-[68px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5 shadow-sm">
        <ResponsiveWrapper>
          <div className="flex overflow-x-auto scrollbar-hide py-4 space-x-6 items-center no-wrap">
            {/* League Filter */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Filter size={14} className="text-red" />
              <select 
                className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer p-0"
                value={filters.leagueId}
                onChange={(e) => setFilters(prev => ({ ...prev, leagueId: e.target.value }))}
              >
                <option value="">All Leagues</option>
                {leagues?.data?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div className="h-4 w-px bg-surface-3 dark:bg-white/10" />

            {/* Status Quick Toggle */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: 'SCHEDULED' }))}
                className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${filters.status === 'SCHEDULED' ? 'text-red underline underline-offset-8 decoration-2' : 'opacity-40 hover:opacity-100'}`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: 'LIVE' }))}
                className={`text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center space-x-1 ${filters.status === 'LIVE' ? 'text-red underline underline-offset-8 decoration-2' : 'opacity-40 hover:opacity-100'}`}
              >
                {filters.status === 'LIVE' && <span className="w-1 h-1 bg-red rounded-full animate-pulse" />}
                <span>Live</span>
              </button>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: 'COMPLETED' }))}
                className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${filters.status === 'COMPLETED' ? 'text-red underline underline-offset-8 decoration-2' : 'opacity-40 hover:opacity-100'}`}
              >
                Results
              </button>
            </div>

            <div className="h-4 w-px bg-surface-3 dark:bg-white/10" />
