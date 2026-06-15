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

      {/* Status tabs */}
      <div className="sticky top-[68px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5 shadow-sm">
        <ResponsiveWrapper>
          <div className="flex overflow-x-auto scrollbar-hide py-4 gap-8 items-center">
            {TABS.map((tab) => (
              <button
                key={tab.status}
                onClick={() => setStatus(tab.status)}
                className={`text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  status === tab.status
                    ? 'text-rwanda-blue underline underline-offset-8 decoration-2'
                    : 'opacity-40 hover:opacity-100'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </ResponsiveWrapper>
      </div>

      <ResponsiveWrapper className="mt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><Skeleton type="card" count={4} /></div>
        ) : list.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {list.map((fixture) => (
              <AmashuriFixtureCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Activity} title={t('amashuri.schedule.empty')} hint={t('amashuri.schedule.empty_hint')} />
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default AkcFixturesPage;
