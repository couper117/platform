import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import useDateFormat from '../../i18n/dateLocale';
import useSportLookup from '../../hooks/useSportLookup';
import SportIcon from '../shared/SportIcon';
import ClubCrest from '../ui/ClubCrest';
import StatusPill from '../ui/StatusPill';
import Skeleton from '../ui/Skeleton';
import cn from '../ui/cn';

/**
 * Fixture card for Amashuri Games (AkcFixture model — teams belong to schools).
 *
 * Mirrors components/match/MatchTile's approved card anatomy (competition row,
 * two team rows, venue footer, same spacing/tokens) rather than inventing a
 * second card shape. It is a sibling, not a re-export of MatchTile, for two
 * reasons neither component can absorb: an AkcFixture's team carries its school
 * two levels down (`team.school.name`, not `team.name`), and this card must
 * link to `/amashuri/matches/:id`, not MatchTile's hardcoded `/matches/:id`.
 *
 * AkcFixture status enum: SCHEDULED | ONGOING | COMPLETED | POSTPONED | CANCELLED
 * — a different vocabulary from FixtureStatus's LIVE, so the live/full-time/
 * upcoming split is re-derived locally instead of importing MatchRow's matchState.
 */

const fixtureState = (fixture: any) => {
  switch (fixture.status) {
    case 'ONGOING':
      return 'live';
    case 'COMPLETED':
      return 'fulltime';
    case 'POSTPONED':
      return 'postponed';
    case 'CANCELLED':
      return 'abandoned';
    default:
      return 'upcoming';
  }
};

const TopState = ({ state, fixture, t }: { state: string; fixture: any; t: any }) => {
  if (state === 'live') {
    return <StatusPill status="ONGOING" label={fixture.statusLabel || t('match.live')} className="shrink-0" />;
  }
  if (state === 'fulltime') {
    return <span className="shrink-0 text-xs font-semibold text-tertiary">FT</span>;
  }
  if (state === 'postponed' || state === 'abandoned') {
    return <StatusPill status={fixture.status} className="shrink-0" />;
  }
  const d = fixture.matchDate ? new Date(fixture.matchDate) : null;
  return (
    <time
      dateTime={d ? d.toISOString() : undefined}
      className="shrink-0 text-xs font-semibold tabular-nums text-secondary"
    >
      {d ? format(d, 'HH:mm') : t('common.tbd')}
    </time>
  );
};

const SchoolRow = ({ team, score, showScore, bold, dim, t }: { team: any; score: any; showScore: boolean; bold: boolean; dim: boolean; t: any }) => {
  const school = team?.school;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ClubCrest team={school} size="md" />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-base',
          dim ? 'text-secondary' : 'text-primary',
          bold && 'font-semibold'
        )}
      >
        {school?.name || t('amashuri.school')}
      </span>
      {showScore && (
        <span
          data-numeric
          className={cn(
            'min-w-[1.5rem] shrink-0 text-right text-base tabular-nums',
            bold ? 'font-semibold text-primary' : dim ? 'text-secondary' : 'text-primary'
          )}
        >
          {score ?? 0}
        </span>
      )}
    </div>
  );
};

const AmashuriFixtureCard = ({ fixture, className = '' }: { fixture: any; className?: string }) => {
  const { t } = useTranslation();
  const { forFixture } = useSportLookup();
  const state = fixtureState(fixture);
  const showScore = state === 'live' || state === 'fulltime';
  const off = state === 'postponed' || state === 'abandoned';
  const finished = state === 'fulltime';
  const sport = forFixture(fixture);

  const hs = fixture.homeScore;
  const as = fixture.awayScore;
  const homeLeads = finished && (hs ?? 0) > (as ?? 0);
  const awayLeads = finished && (as ?? 0) > (hs ?? 0);

  const homeName = fixture.homeTeam?.school?.name;
  const awayName = fixture.awayTeam?.school?.name;
  const label = [homeName, showScore ? `${hs ?? 0}–${as ?? 0}` : 'versus', awayName, state === 'live' ? 'live now' : state]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      to={`/amashuri/matches/${fixture.id}`}
      aria-label={label}
      className={cn(
        'flex h-full flex-col gap-2 rounded-card border border-hairline bg-surface p-3',
        'transition-colors duration-150 ease-standard hover:bg-surface-2',
        off && 'opacity-60',
        className
      )}
    >
      <div className="flex h-5 items-center justify-between gap-2">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs text-tertiary">
          {sport && <SportIcon slug={sport.slug} size={11} className="shrink-0" />}
          <span className="truncate">
            {fixture.competition?.name || t('amashuri.schools_championship')}
          </span>
        </span>
        <TopState state={state} fixture={fixture} t={t} />
      </div>

      <div className="flex flex-col gap-1.5">
        <SchoolRow team={fixture.homeTeam} score={hs} showScore={showScore} bold={homeLeads} dim={off} t={t} />
        <SchoolRow team={fixture.awayTeam} score={as} showScore={showScore} bold={awayLeads} dim={off} t={t} />
      </div>

      {fixture.venue && (
        <p className="flex items-center gap-1 text-xs text-tertiary">
          <MapPin size={11} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{fixture.venue}</span>
        </p>
      )}
    </Link>
  );
};

/** Skeleton lives here, next to the card, and reuses its exact metrics. */
AmashuriFixtureCard.Skeleton = function AmashuriFixtureCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-card border border-hairline bg-surface p-3">
      <div className="flex h-5 items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className={cn('h-3 flex-1', i ? 'max-w-[60%]' : 'max-w-[80%]')} />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3 w-28" />
    </div>
  );
};

export default AmashuriFixtureCard;
