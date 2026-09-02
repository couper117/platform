import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio } from 'lucide-react';
import { getAkcFixtures } from '../../api/endpoints/amashuri';
import AkcFixtureTable from '../../components/admin/AkcFixtureTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** Amashuri Admin → Live Matches: school matches currently in progress. */
const AmashuriAdminLive = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-live'], queryFn: () => getAkcFixtures(), refetchInterval: 20000 });
  const live = (data?.data || []).filter((f) => f.status === 'ONGOING');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.live_title')} <span className="text-red">{t('aadmin.live_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.live_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : live.length === 0 ? <EmptyState icon={Radio} title={t('aadmin.none_live')} hint={t('aadmin.none_live_hint')} />
        : <AkcFixtureTable fixtures={live} showScore />}
    </div>
  );
};

export default AmashuriAdminLive;
