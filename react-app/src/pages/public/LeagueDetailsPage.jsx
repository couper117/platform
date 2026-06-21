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