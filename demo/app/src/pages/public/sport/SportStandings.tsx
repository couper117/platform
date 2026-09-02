import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { useSport } from './SportLayout';
import { getLeague } from '../../../api/endpoints/leagues';
import StandingsTable from '../../../components/match/StandingsTable';
import TopScorers from '../../../components/match/TopScorers';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import cn from '../../../components/ui/cn';
import AdSlot from '../../../components/shared/AdSlot';

/** Competition picker — the same outlined chip as FixtureFilters' Chip. */
const CompetitionChip = ({ active, children, ...props }: { active: boolean; children: React.ReactNode } & Record<string, any>) => (
  <button
    type="button"
    aria-pressed={active}
    className={cn(
      'flex h-8 shrink-0 items-center rounded-pill border px-3 text-xs font-semibold',
      'transition-colors duration-150 ease-standard',
      active
        ? 'border-brand/40 bg-brand-tint text-brand-text'
        : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

const SportStandings = () => {
  const { t } = useTranslation();
  const { sport, slug, leagues, primaryLeague } = useSport();

  // Which competition's table is showing. Defaults to primaryLeague, and stays
  // in sync when the sport changes underneath this same mounted route (e.g.
  // /sports/football/standings -> /sports/basketball/standings never remounts
  // this component, so a stale league id from the previous sport must be
  // corrected rather than left pointing at a competition that no longer applies).
  const [leagueId, setLeagueId] = useState<any>(() => primaryLeague?.id ?? null);

  useEffect(() => {
    if (leagues.length === 0) return;
    const stillValid = leagues.some((l) => String(l.id) === String(leagueId));
    if (!stillValid) {
      setLeagueId(primaryLeague?.id ?? leagues[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagues, slug]);

  // Same key FixturesPage's rail and LeagueDetailsPage use for this exact
  // request, so arriving here after either already has the table cached.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['league-details', String(leagueId)],
    queryFn: () => getLeague(leagueId),
    enabled: !!leagueId,
  });

  // No competitions exist for this sport at all — nothing to pick, nothing to
  // fetch, so the tab is a single empty state rather than an empty picker
  // sitting above an empty table.
  if (leagues.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title={t('sporthub.coming_soon', { sport: sport?.name })}
        hint={t('sporthub.coming_soon_hint', { sport: sport?.name })}
      />
    );
  }

  const league = data?.data;
  const rows = league?.standings ?? [];
  const scorers = league?.topScorers ?? [];

  return (
    <div className="flex flex-col gap-4">
      {leagues.length > 1 && (
        <div
          role="group"
          aria-label={t('sporthub.competitions')}
          className="scroll-contain -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 lg:mx-0 lg:px-0"
        >
          {leagues.map((l) => (
            <CompetitionChip key={l.id} active={String(leagueId) === String(l.id)} onClick={() => setLeagueId(l.id)}>
              {l.name}
            </CompetitionChip>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
          <StandingsTable.Skeleton />
          <TopScorers.Skeleton />
        </div>
      ) : isError ? (
        <ErrorState title={t('sporthub.error_title')} hint={t('sporthub.error_hint')} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Trophy} title={t('sporthub.standings_no_table')} hint={t('sporthub.standings_empty')} />
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
          <StandingsTable rows={rows} showForm />
          <div className="space-y-4">
            <TopScorers scorers={scorers} />
            {/* Desktop only: on a phone the rail stacks under the table and the
                sport's own banner already sits at the foot of the layout. */}
            <AdSlot position="sport-rail" variant="sidebar" className="hidden lg:block" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SportStandings;
