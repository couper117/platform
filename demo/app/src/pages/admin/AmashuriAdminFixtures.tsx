import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import { getAkcFixtures } from '../../api/endpoints/amashuri';
import AkcFixtureTable from '../../components/admin/AkcFixtureTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** Amashuri Admin → Fixtures: all school matches. */
const AmashuriAdminFixtures = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-fixtures'], queryFn: () => getAkcFixtures() });
  const fixtures = data?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.fixtures_title')} <span className="text-red">{t('aadmin.fixtures_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.fixtures_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : fixtures.length === 0 ? <EmptyState icon={Activity} title={t('aadmin.none_fixtures')} hint={t('aadmin.none_fixtures_hint')} />
        : <AkcFixtureTable fixtures={fixtures} />}
    </div>
  );
};

export default AmashuriAdminFixtures;
