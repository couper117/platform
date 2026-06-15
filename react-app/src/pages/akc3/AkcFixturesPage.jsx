import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriHero from '../../components/amashuri/AmashuriHero';
import AmashuriFixtureCard from '../../components/amashuri/AmashuriFixtureCard';
import EmptyState from '../../components/ui/EmptyState';
import { getAkcFixtures } from '../../api/endpoints/amashuri';

// AkcFixture status enum: SCHEDULED | ONGOING | COMPLETED | POSTPONED | CANCELLED
const TABS = [
  { status: 'SCHEDULED', labelKey: 'amashuri.schedule.upcoming' },
  { status: 'ONGOING', labelKey: 'amashuri.schedule.live' },
  { status: 'COMPLETED', labelKey: 'amashuri.schedule.results' },
];

const AkcFixturesPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('SCHEDULED');

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['amashuri-fixtures', status],
    queryFn: () => getAkcFixtures({ status }),
    retry: false,
  });

  const list = fixtures?.data || [];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="Schedule — Amashuri Games" description="Fixtures, live matches and results across Rwanda's inter-school championships." />

      <AmashuriHero
        eyebrow={t('amashuri.schedule.eyebrow')}
        title={t('amashuri.schedule.title')}
        accent={t('amashuri.schedule.accent')}
        subtitle={t('amashuri.schedule.subtitle')}
        compact
      />