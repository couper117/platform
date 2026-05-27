import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, School } from 'lucide-react';
import { format } from 'date-fns';
import { LiveBadge } from '../ui/Badge';

const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

const SchoolSide = ({ team }) => {
  const school = team?.school;
  return (
    <div className="flex-1 flex flex-col items-center text-center gap-2">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-rwanda-blue/30 transition-all">
        {school?.logo ? (
          <img src={school.logo} alt={school.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-lg sm:text-xl opacity-40">{initials(school?.name || 'SC')}</span>
        )}
      </div>
      <h3 className="font-display text-xs sm:text-sm uppercase tracking-tight line-clamp-1">
        {school?.name || 'School'}
      </h3>
      <span className="text-[9px] uppercase tracking-widest opacity-40">{team?.ageCategory} · {team?.gender}</span>
    </div>
  );
};

/**
 * Fixture card for Amashuri Games (AkcFixture model — teams belong to schools).
 * Blue-accented sibling of RwaSport's FixtureCard.
 */
const AmashuriFixtureCard = ({ fixture, showCompetition = true }) => {
  const isLive = fixture.status === 'ONGOING';
  const isCompleted = fixture.status === 'COMPLETED';

  return (
    <Link
      to={`/amashuri/matches/${fixture.id}`}
      className="block group bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-rwanda-blue/10 hover:-translate-y-1"
    >
      {showCompetition && (
        <div className="px-4 py-2 bg-surface-2 dark:bg-white/5 border-b border-surface-3 dark:border-white/5 flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-rwanda-blue line-clamp-1">
            <School size={11} className="inline mr-1 -mt-0.5" />
            {fixture.competition?.name || fixture.stage?.replace(/_/g, ' ') || 'Schools Championship'}
          </span>
          {isLive && <LiveBadge />}