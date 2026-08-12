import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { getAkcFixtures } from '../../api/endpoints/amashuri';
import AkcFixtureTable from '../../components/admin/AkcFixtureTable';
import { Skeleton, EmptyState } from '../../components/ui';

/** Amashuri Admin → Results: completed school matches with scores. */
const AmashuriAdminResults = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['aa-results'], queryFn: () => getAkcFixtures() });
  const results = (data?.data || []).filter((f) => f.status === 'COMPLETED');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('aadmin.results_title')} <span className="text-red">{t('aadmin.results_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('aadmin.results_sub')}</p>
      </div>
      {isLoading ? <Skeleton type="card" count={3} />
        : results.length === 0 ? <EmptyState icon={FileText} title={t('aadmin.none_results')} hint={t('aadmin.none_results_hint')} />
        : <AkcFixtureTable fixtures={results} showScore />}
    </div>
  );
};

export default AmashuriAdminResults;
