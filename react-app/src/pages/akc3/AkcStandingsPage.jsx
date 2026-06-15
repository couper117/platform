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