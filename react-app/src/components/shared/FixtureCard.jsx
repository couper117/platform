import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const FixtureCard = ({ fixture, showLeague = true }) => {
  const isLive = fixture.status === 'LIVE';
  const isCompleted = fixture.status === 'COMPLETED';
  
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Link 
      to={`/matches/${fixture.id}`}
      className="block group bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-red-glow hover:-translate-y-1"
    >
      {/* League Header */}
      {showLeague && (
        <div className="px-4 py-2 bg-surface-2 dark:bg-white/5 border-b border-surface-3 dark:border-white/5 flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-surface-dark/40 dark:text-white/40">
            {fixture.league?.name || 'National League'}
          </span>
          {isLive && (
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse shadow-sm shadow-red" />
              <span className="text-[10px] font-bold text-red uppercase tracking-tighter italic">Live</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6 flex flex-col items-center">
        {/* Teams & Score */}
        <div className="w-full flex items-center justify-between space-x-2 sm:space-x-4">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-red/20 transition-all">
              {fixture.homeTeam.logo ? (
                <img src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-xl sm:text-2xl opacity-40">{getInitials(fixture.homeTeam.name)}</span>
              )}
            </div>
            <h3 className="font-display text-xs sm:text-sm uppercase tracking-tight line-clamp-1">{fixture.homeTeam.name}</h3>
          </div>

          {/* Score / Time */}
          <div className="flex flex-col items-center justify-center min-w-[80px] sm:min-w-[120px]">
            {isLive || isCompleted ? (
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className={`text-3xl sm:text-5xl font-display ${fixture.homeScore > fixture.awayScore ? 'text-red' : ''}`}>
                    {fixture.homeScore ?? 0}