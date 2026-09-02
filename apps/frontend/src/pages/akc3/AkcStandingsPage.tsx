import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import Seo from '../../components/shared/Seo';
import AmashuriStandingsTable from '../../components/amashuri/AmashuriStandingsTable';
import { EmptyState, ErrorState } from '../../components/ui';
import cn from '../../components/ui/cn';
import { getAkcStandings, getChampionships } from '../../api/endpoints/amashuri';

/** Competition picker — the same outlined chip as FixtureFilters'/SportStandings'. */
const CompetitionChip = ({ active, children, ...props }: any) => (
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

const AkcStandingsPage = () => {
  const { t } = useTranslation();
  const [competitionId, setCompetitionId] = useState('');

  const { data: comps, isError: compsError, refetch: refetchComps } = useQuery({
    queryKey: ['amashuri-comps-for-standings'],
    queryFn: () => getChampionships(),
    retry: false,
  });

  const competitions = comps?.data || [];

  // Default to the first championship once loaded.
  useEffect(() => {
    if (!competitionId && competitions.length) setCompetitionId(String(competitions[0].id));
  }, [competitions, competitionId]);

  const { data: standings, isLoading, isError, refetch } = useQuery({
    queryKey: ['amashuri-standings', competitionId],
    queryFn: () => getAkcStandings(competitionId ? { competitionId } : {}),
    retry: false,
  });

  const rows = standings?.data || [];

  return (
    <>
      <Seo title={t('seo.amashuri_standings_title')} description={t('seo.amashuri_standings_desc')} />

      {/* NO H1 HERE. The tab bar in AmashuriLayout already names this
          page, and a title repeating it pushed the content another
          80px down for nothing. */}
      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <p className="text-sm text-secondary">{t('amashuri.standings.subtitle')}</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 lg:max-w-6xl lg:px-6 lg:pb-14">
        {compsError ? (
          <ErrorState title={t('amashuri.standings.error_title')} hint={t('amashuri.standings.error_hint')} onRetry={refetchComps} />
        ) : (
          <div className="flex flex-col gap-4">
            {competitions.length > 1 && (
              <div
                role="group"
                aria-label={t('amashuri.championships')}
                className="scroll-contain -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 lg:mx-0 lg:px-0"
              >
                {competitions.map((c: any) => (
                  <CompetitionChip key={c.id} active={String(competitionId) === String(c.id)} onClick={() => setCompetitionId(String(c.id))}>
                    {c.name}
                  </CompetitionChip>
                ))}
              </div>
            )}

            {isLoading ? (
              <AmashuriStandingsTable.Skeleton />
            ) : isError ? (
              <ErrorState title={t('amashuri.standings.error_title')} hint={t('amashuri.standings.error_hint')} onRetry={refetch} />
            ) : competitions.length === 0 ? (
              <EmptyState icon={Trophy} title={t('amashuri.standings.no_championships')} hint={t('amashuri.standings.empty_hint')} />
            ) : rows.length === 0 ? (
              <EmptyState icon={Trophy} title={t('amashuri.standings.empty')} hint={t('amashuri.standings.empty_hint')} />
            ) : (
              <AmashuriStandingsTable standings={rows} />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AkcStandingsPage;
