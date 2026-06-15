import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriHero from '../../components/amashuri/AmashuriHero';
import AmashuriStandingsTable from '../../components/amashuri/AmashuriStandingsTable';
import Card from '../../components/ui/Card';
import { getAkcStandings, getChampionships } from '../../api/endpoints/amashuri';

const AkcStandingsPage = () => {
  const { t } = useTranslation();
  const [competitionId, setCompetitionId] = useState('');

  const { data: comps } = useQuery({
    queryKey: ['amashuri-comps-for-standings'],
    queryFn: () => getChampionships(),
    retry: false,
  });

  const competitions = comps?.data || [];

  // Default to the first championship once loaded.
  useEffect(() => {
    if (!competitionId && competitions.length) setCompetitionId(String(competitions[0].id));
  }, [competitions, competitionId]);

  const { data: standings, isLoading } = useQuery({
    queryKey: ['amashuri-standings', competitionId],
    queryFn: () => getAkcStandings(competitionId ? { competitionId } : {}),
    retry: false,
  });

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="Standings — Amashuri Games" description="Competitive rankings across Rwanda's inter-school championships." />

      <AmashuriHero
        title={t('amashuri.standings.title')}
        accent={t('amashuri.standings.accent')}
        subtitle={t('amashuri.standings.subtitle')}
        compact
      />

      <ResponsiveWrapper className="mt-12">
        <Card className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-display uppercase tracking-tight">{t('amashuri.standings.leaderboards')}</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t('amashuri.standings.select_hint')}</p>
            </div>

            <div className="flex items-center gap-4">
              <label htmlFor="comp-select" className="sr-only">{t('amashuri.championships')}</label>
              <select
                id="comp-select"
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 text-[11px] font-bold uppercase tracking-widest rounded-xl px-4 py-3 focus:ring-2 focus:ring-rwanda-blue focus:outline-none cursor-pointer"
              >
                {competitions.length === 0 && <option value="">{t('amashuri.standings.no_championships')}</option>}
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <Skeleton type="card" count={1} />
          ) : (
            <AmashuriStandingsTable standings={standings?.data || []} />
          )}
        </Card>
      </ResponsiveWrapper>
    </div>
  );
};

export default AkcStandingsPage;
