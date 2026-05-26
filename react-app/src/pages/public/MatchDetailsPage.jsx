import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Clock, MapPin, ChevronLeft, Calendar, User, Users, Play, Award } from 'lucide-react';
import { format } from 'date-fns';
import { getFixture } from '../../api/endpoints/fixtures';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';

const MatchDetailsPage = () => {
  const { id } = useParams();

  const { data: fixture, isLoading } = useQuery({
    queryKey: ['match-details', id],
    queryFn: () => getFixture(id),
  });

  if (isLoading) return <div className="py-20"><ResponsiveWrapper><Skeleton type="card" /></ResponsiveWrapper></div>;

  const m = fixture?.data;
  const isLive = m?.status === 'LIVE';

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      {/* Header / Breadcrumb */}
      <div className="bg-surface-dark border-b border-white/5 py-4">
        <ResponsiveWrapper>
          <Link to="/fixtures" className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-red transition-colors">
            <ChevronLeft size={14} />
            <span>Back to Schedule</span>
          </Link>
        </ResponsiveWrapper>
      </div>

      {/* Scoreboard Section */}
      <section className="bg-surface-dark py-12 sm:py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red/10 via-transparent to-rwanda-blue/5 opacity-50" />
        
        <ResponsiveWrapper className="relative z-10">
          <div className="flex flex-col items-center space-y-12">
            {/* Status & League */}
            <div className="flex flex-col items-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">{m?.league?.name}</span>
              {isLive ? (
                <div className="flex items-center space-x-2 bg-red/10 border border-red/20 px-4 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-red rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-red uppercase tracking-widest italic">Live Match • {m?.minute}'</span>
                </div>
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">{m?.status}</span>
              )}
            </div>

            {/* Score Display */}
            <div className="w-full flex items-center justify-between max-w-4xl px-4 sm:px-0">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center p-4">
                  {m?.homeTeam?.logo ? <img src={m.homeTeam.logo} className="w-full h-full object-contain" /> : <Trophy size={48} className="opacity-10" />}
                </div>
                <h2 className="text-xl sm:text-3xl font-display uppercase tracking-tight">{m?.homeTeam?.name}</h2>
              </div>

              {/* Big Score */}
              <div className="flex items-center space-x-6 sm:space-x-12 px-8 sm:px-16">
                <span className="text-6xl sm:text-9xl font-display text-white">{m?.homeScore ?? 0}</span>
                <span className="text-3xl sm:text-5xl font-display opacity-20">:</span>
                <span className="text-6xl sm:text-9xl font-display text-white">{m?.awayScore ?? 0}</span>
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center p-4">
                  {m?.awayTeam?.logo ? <img src={m.awayTeam.logo} className="w-full h-full object-contain" /> : <Trophy size={48} className="opacity-10" />}
                </div>
                <h2 className="text-xl sm:text-3xl font-display uppercase tracking-tight">{m?.awayTeam?.name}</h2>
              </div>
            </div>

            {/* Match Info Bar */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/50 border-t border-white/5 pt-8 w-full">
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-red" />
                <span>{m?.matchDate ? format(new Date(m.matchDate), 'dd MMMM yyyy') : 'TBD'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-red" />
                <span>{m?.matchDate ? format(new Date(m.matchDate), 'HH:mm') : 'TBD'} CAT</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-red" />
                <span>{m?.venue || 'TBD'}</span>
              </div>
              {m?.referee && (
                <div className="flex items-center space-x-2">
                  <Award size={14} className="text-red" />
                  <span>REF: {m.referee}</span>
                </div>
              )}
            </div>
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Details Grid */}
      <ResponsiveWrapper className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Match Timeline / Events */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-3xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-4">Match <span className="text-red">Timeline</span></h3>
            
            <div className="space-y-4">
              {m?.events?.length > 0 ? m.events.map((event, i) => (
                <div key={i} className="flex items-center space-x-6 p-4 bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 group hover:border-red/20 transition-all">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center font-display text-lg text-red bg-red/5 rounded-lg border border-red/10">
                    {event.minute}'
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-widest">{event.eventType.replace('_', ' ')}</span>
                      {event.eventType === 'GOAL' && <Play size={12} className="text-green fill-green" />}
                    </div>
                    <p className="text-sm font-bold uppercase tracking-tight">{event.player?.fullName}</p>
                    {event.description && <p className="text-[10px] opacity-40 uppercase tracking-widest">{event.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest italic">{event.teamId === m.homeTeamId ? 'Home' : 'Away'}</span>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-20 border-2 border-dashed border-surface-3 dark:border-white/5 rounded-3xl">
                  <Clock size={32} className="mx-auto mb-2" />
                  <p className="font-display text-xl uppercase tracking-widest">Awaiting Kick-off</p>
                </div>
              )}
            </div>
          </div>

          {/* Lineups / Stats Sidebar */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-2xl font-display uppercase tracking-tight border-b border-surface-3 dark:border-white/5 pb-4">Match <span className="text-red">Status</span></h3>
              <div className="bg-white dark:bg-surface-dark2 p-6 rounded-3xl border border-surface-3 dark:border-white/5 space-y-6">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
                  <span>Matchday {m?.matchday}</span>
                  <span className="text-red">{m?.status}</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button className="w-full bg-surface-2 dark:bg-white/5 py-4 rounded-xl font-display text-sm uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-white/10 transition-all">
                    <Users size={16} />
                    <span>View Lineups</span>
                  </button>
                  {m?.streamActive && (
                    <a href={m.streamUrl} target="_blank" className="w-full bg-red text-white py-4 rounded-xl font-display text-sm uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-red-dark transition-all shadow-lg shadow-red/20">
                      <Play size={16} fill="currentColor" />
                      <span>Watch Live</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

export default MatchDetailsPage;
