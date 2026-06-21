import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Calendar, Users, Info, ChevronLeft } from 'lucide-react';
import { getLeague } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import StandingsTable from '../../components/shared/StandingsTable';
import LeagueStats from '../../components/shared/LeagueStats';
import FixtureCard from '../../components/shared/FixtureCard';
import Skeleton from '../../components/shared/Skeleton';

const LeagueDetailsPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('standings');

  const { data: league, isLoading: leagueLoading } = useQuery({
    queryKey: ['league-details', id],
    queryFn: () => getLeague(id),
  });

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['league-fixtures', id],
    queryFn: () => getFixtures({ leagueId: id }),
    enabled: !!id,
  });

  const tabs = [
    { id: 'standings', label: 'Standings' },
    { id: 'stats', label: 'Stats' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'teams', label: 'Teams' },
  ];

  if (leagueLoading) return (
    <div className="py-20">
      <ResponsiveWrapper><Skeleton type="stat" count={3} className="mb-8" /><Skeleton type="card" count={1} /></ResponsiveWrapper>
    </div>
  );

  const leagueData = league?.data;

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      {/* Breadcrumbs */}
      <div className="bg-surface-dark border-b border-white/5 py-4">
        <ResponsiveWrapper>
          <Link to="/leagues" className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-red transition-colors">
            <ChevronLeft size={14} />
            <span>Back to all leagues</span>
          </Link>
        </ResponsiveWrapper>
      </div>

      {/* Header */}
      <section className="bg-surface-dark py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red/10 to-transparent opacity-50" />
        <ResponsiveWrapper className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-red rounded-2xl shadow-2xl shadow-red/20">
                  <Trophy size={40} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-red mb-1">
                    <span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse" />
                    <span>{leagueData?.sport?.name}</span>
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-display text-white uppercase tracking-tighter leading-none">
                    {leagueData?.name}
                  </h1>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/50">
                <div className="flex items-center space-x-2">
                  <Calendar size={14} className="text-red" />
                  <span>Season {leagueData?.season}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={14} className="text-red" />
                  <span>{leagueData?.teams?.length || 0} Participants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Info size={14} className="text-red" />
                  <span>{leagueData?.level} Level</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
               {/* Could add a league logo or stats here */}
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Tabs */}
      <div className="sticky top-[68px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5">
        <ResponsiveWrapper>
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-[11px] font-bold uppercase tracking-[0.2em] relative transition-all ${
                  activeTab === tab.id ? 'text-red' : 'text-surface-dark/40 dark:text-white/40 hover:text-surface-dark dark:hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red animate-in fade-in slide-in-from-bottom-1" />
                )}
              </button>
            ))}
          </div>
        </ResponsiveWrapper>
      </div>

      {/* Content */}
      <ResponsiveWrapper className="mt-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'standings' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display uppercase tracking-tight">Current Standings</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">Last updated: Today</span>
              </div>
              <StandingsTable standings={leagueData?.standings || []} />