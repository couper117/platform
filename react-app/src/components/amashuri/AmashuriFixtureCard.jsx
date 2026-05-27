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
        </div>
      )}

      <div className="p-4 sm:p-6 flex flex-col items-center">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
          <SchoolSide team={fixture.homeTeam} />

          <div className="flex flex-col items-center justify-center min-w-[80px] sm:min-w-[110px]">
            {isLive || isCompleted ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className={`text-3xl sm:text-5xl font-display ${fixture.homeScore > fixture.awayScore ? 'text-rwanda-blue' : ''}`}>{fixture.homeScore ?? 0}</span>
                  <span className="text-xl font-display opacity-20">—</span>
                  <span className={`text-3xl sm:text-5xl font-display ${fixture.awayScore > fixture.homeScore ? 'text-rwanda-blue' : ''}`}>{fixture.awayScore ?? 0}</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-30">{isCompleted ? 'Full Time' : 'Live'}</span>
              </div>
            ) : (
              <div className="bg-surface-2 dark:bg-white/5 px-4 py-2 rounded-xl border border-surface-3 dark:border-white/10 flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-display text-rwanda-blue leading-none">
                  {fixture.matchDate ? format(new Date(fixture.matchDate), 'HH:mm') : 'TBD'}
                </span>
                <span className="text-[8px] uppercase font-bold tracking-widest opacity-40 mt-1">Kick-off</span>
              </div>
            )}
          </div>

          <SchoolSide team={fixture.awayTeam} />
        </div>

        <div className="mt-6 w-full pt-4 border-t border-surface-3 dark:border-white/5 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest opacity-50">
          <div className="flex items-center gap-1">
            <Calendar size={12} className="text-rwanda-blue" />
            <span>{fixture.matchDate ? format(new Date(fixture.matchDate), 'dd MMM') : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={12} className="text-rwanda-blue" />
            <span className="line-clamp-1">{fixture.venue || 'TBD'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AmashuriFixtureCard;
