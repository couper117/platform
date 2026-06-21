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