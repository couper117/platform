import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ClubCrest, Skeleton, cn } from '../ui';
import { FormStrip } from '../match/StandingsTable';

/**
 * The club, and where its season stands. The first thing on the coach's screen.
 *
 * WHY IT REPLACED A PAGE HEADER. The dashboard opened with "Today" and a date —
 * the reporter's question, because the reporter's screen is what it was built
 * from. A coach does not open this asking what day it is. They open it asking
 * where we are, and that answer was nowhere on the page even though `/teams/my`
 * has returned the full league table all along.
 *
 * So the identity IS the header: crest, club, competition, position, points and
 * form on one band, with the season's record under it. On a Tuesday with no
 * match in sight this is still worth the trip; the old header was not.
 *
 * IT SHOWS NOTHING IT CANNOT PROVE. A club with no standings row yet — a new
 * league, a pre-season, a club just admitted — gets the identity and an honest
 * line saying the table has not started, never a hopeful "1st, 0 pts" that would
 * be true of every club at once.
 */

const ordinal = (n: number) => {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
};

/** One number from the season's record. */
const Stat = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
  <div className={cn('min-w-0', className)}>
    <p className="text-[11px] uppercase tracking-wide text-tertiary">{label}</p>
    <p className="font-display text-base font-bold tabular-nums leading-tight text-primary">{value}</p>
  </div>
);

export const SeasonStripSkeleton = () => (
  <section className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
    <div className="flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-card" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <Skeleton className="mt-4 h-10 w-full" />
  </section>
);

const SeasonStrip = ({
  team,
  league,
  standing,
  rankOf,
  leagues = [],
  activeLeagueId,
  onSelectLeague,
}: {
  team: any;
  league: any;
  /** This club's row from the league table, already ranked by the server. */
  standing: any;
  rankOf: number | null;
  /** Every competition the club is in — a selector appears only past one. */
  leagues?: Array<{ id: number; name: string }>;
  activeLeagueId?: number | null;
  onSelectLeague?: (id: number) => void;
}) => {
  const played = standing?.played ?? 0;
  const gf = standing?.goalsFor ?? 0;
  const ga = standing?.goalsAgainst ?? 0;
  const gd = gf - ga;

  return (
    <section className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-4">
        <ClubCrest team={team} size="lg" className="h-14 w-14 shrink-0" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold tracking-[-0.01em] text-primary sm:text-2xl">
            {team?.name || 'Your club'}
          </h1>

          {league ? (
            <Link
              to={`/leagues/${league.id}`}
              className="group mt-0.5 inline-flex items-center gap-1 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
            >
              {league.name}
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : (
            <p className="mt-0.5 text-sm text-tertiary">Not entered in a competition yet</p>
          )}
        </div>

        {/* Position and points, the two figures a coach reads first, set large
            enough to be read at a glance and kept together so they are read as
            one fact rather than two. */}
        {standing && rankOf != null && (
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <p className="font-display text-3xl font-bold leading-none text-primary">{ordinal(rankOf)}</p>
              <p className="mt-1 text-xs text-tertiary">in the table</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold tabular-nums leading-none text-brand-text">
                {standing.points ?? 0}
              </p>
              <p className="mt-1 text-xs text-tertiary">points</p>
            </div>
          </div>
        )}
      </div>

      {/* More than one competition is rare but real — a club in a league and a
          cup. The selector only exists when it has something to select. */}
      {leagues.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {leagues.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelectLeague?.(l.id)}
              aria-pressed={l.id === activeLeagueId}
              className={cn(
                'min-h-9 rounded-pill border px-3 text-sm font-semibold transition-colors duration-150 ease-standard',
                l.id === activeLeagueId
                  ? 'border-brand bg-brand-tint text-brand-text'
                  : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      {standing ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-hairline pt-3">
          <Stat label="Played" value={played} />
          <Stat label="W" value={standing.won ?? 0} />
          <Stat label="D" value={standing.drawn ?? 0} />
          <Stat label="L" value={standing.lost ?? 0} />
          <Stat label="GF" value={gf} />
          <Stat label="GA" value={ga} />
          <Stat label="GD" value={gd > 0 ? `+${gd}` : gd} />

          {/* Reused from the public league table rather than drawn again here, so
              a W means the same to the eye in both places. Most recent last. */}
          {standing.form ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-tertiary">Form</span>
              <FormStrip form={standing.form} />
            </div>
          ) : null}
        </div>
      ) : (
        league && (
          <p className="mt-4 border-t border-hairline pt-3 text-sm text-tertiary">
            The table has not started for this competition yet.
          </p>
        )
      )}
    </section>
  );
};

export default SeasonStrip;
