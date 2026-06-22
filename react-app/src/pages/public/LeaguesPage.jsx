import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, Calendar, Filter, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLeagues } from '../../api/endpoints/leagues';
import { getSports } from '../../api/endpoints/sports';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';

const LeagueCard = ({ league }) => (
  <Link 
    to={`/leagues/${league.id}`}
    className="group bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 p-6 transition-all hover:shadow-2xl hover:-translate-y-1"
  >
    <div className="flex items-start justify-between mb-6">
      <div className="p-3 bg-red/5 rounded-xl border border-red/10 text-red group-hover:bg-red group-hover:text-white transition-all">
        <Trophy size={24} />
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
        league.status === 'ACTIVE' ? 'bg-green/5 text-green border-green/10' : 'bg-gold/5 text-gold border-gold/10'
      }`}>
        {league.status}
      </span>
    </div>

    <div className="space-y-2">
      <h3 className="text-2xl font-display uppercase tracking-tight line-clamp-1">{league.name}</h3>
      <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest opacity-40">
        <span>{league.sport?.name}</span>
        <span>•</span>
        <span>Season {league.season}</span>
      </div>
    </div>

    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-surface-3 dark:border-white/5 pt-6">
      <div className="flex items-center space-x-2">
        <Users size={14} className="text-red opacity-60" />
        <span className="text-xs font-bold opacity-60">{league._count?.teams || 0} Teams</span>
      </div>
      <div className="flex items-center space-x-2">
        <Calendar size={14} className="text-red opacity-60" />
        <span className="text-xs font-bold opacity-60">{league.gender}</span>
      </div>
    </div>

    <div className="mt-6 flex items-center justify-between group-hover:text-red transition-colors">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">View Standings</span>
      <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

const LeaguesPage = () => {
  const [filters, setFilters] = useState({ sportId: '', gender: '', level: '' });
  
  const { data: sports } = useQuery({
    queryKey: ['sports-list'],
    queryFn: getSports,
  });

  const { data: leagues, isLoading } = useQuery({
    queryKey: ['leagues-list', filters],
    queryFn: () => getLeagues(filters),
  });

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      {/* Header */}
      <section className="bg-surface-dark py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20" />
        <ResponsiveWrapper className="relative z-10 text-center space-y-4">
          <h1 className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter">National <span className="text-red">Leagues</span></h1>
          <p className="text-white/40 max-w-xl mx-auto uppercase tracking-[0.3em] text-[10px] font-bold">Discover & Track Every Competition</p>
        </ResponsiveWrapper>
      </section>

      {/* Filters Bar */}
      <div className="sticky top-[68px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5 shadow-sm">
        <ResponsiveWrapper>
          <div className="flex overflow-x-auto scrollbar-hide py-4 space-x-4 items-center no-wrap">
            <div className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 border-r border-surface-3 dark:border-white/10 mr-2">
              <Filter size={14} className="text-red" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Filter</span>
            </div>
            
            <select 
              className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer"
              value={filters.sportId}
              onChange={(e) => setFilters(prev => ({ ...prev, sportId: e.target.value }))}
            >
              <option value="">All Sports</option>
              {sports?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select 
              className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer"
              value={filters.gender}
              onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="MIXED">Mixed</option>
            </select>