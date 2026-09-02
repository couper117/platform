import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import Seo from '../../components/shared/Seo';
import AmashuriFixtureCard from '../../components/amashuri/AmashuriFixtureCard';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui';
import cn from '../../components/ui/cn';
import { getAkcFixtures } from '../../api/endpoints/amashuri';

// AkcFixture status enum: SCHEDULED | ONGOING | COMPLETED | POSTPONED | CANCELLED.
// Tab labels reuse the app-wide fixtures.tab_* strings rather than duplicating
// "Upcoming/Live/Results" under amashuri — same words, one translation source.
const TABS: [string, string][] = [
  ['SCHEDULED', 'fixtures.tab_upcoming'],
  ['ONGOING', 'fixtures.tab_live'],
  ['COMPLETED', 'fixtures.tab_results'],
];

const Tab = ({ active, children, ...props }: any) => (
  <button
    type="button"
    aria-current={active ? 'page' : undefined}
    className={cn(
      'relative flex min-h-tap shrink-0 items-center whitespace-nowrap px-0.5 text-sm font-semibold',
      'transition-colors duration-150 ease-standard',
      'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[""]',
      active ? 'text-primary after:bg-brand' : 'text-secondary after:bg-transparent hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

const AkcFixturesPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  // The route sets which status this screen opens on, same idiom as
  // FixturesPage/:isResultsPage. The tabs still switch freely after.
  const isResultsPage = location.pathname === '/amashuri/results';
  const defaultStatus = isResultsPage ? 'COMPLETED' : 'SCHEDULED';
  const [status, setStatus] = useState(defaultStatus);

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  const { data: fixtures, isLoading, isError, refetch } = useQuery({
    queryKey: ['amashuri-fixtures', status],
    queryFn: () => getAkcFixtures({ status }),
    retry: false,
  });

  const list = fixtures?.data || [];

  return (
    <>
      <Seo title={t('seo.amashuri_fixtures_title')} description={t('seo.amashuri_fixtures_desc')} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        {/* NO H1. The tab bar in AmashuriLayout already names this page. */}
        <nav aria-label={t('fixtures.filter_state', 'State')} className="flex items-stretch gap-6 border-b border-hairline">
          {TABS.map(([value, labelKey]) => (
            <Tab key={value} active={status === value} onClick={() => setStatus(value)}>
              {value === 'ONGOING' && status !== 'ONGOING' && (
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block h-1.5 w-1.5 animate-live-pulse rounded-pill bg-live align-middle"
                />
              )}
              {t(labelKey)}
            </Tab>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 lg:max-w-6xl lg:px-6 lg:pb-14">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonList count={6}>
              <AmashuriFixtureCard.Skeleton />
            </SkeletonList>
          </div>
        ) : isError ? (
          <ErrorState title={t('amashuri.schedule.error_title')} hint={t('amashuri.schedule.error_hint')} onRetry={refetch} />
        ) : list.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((fixture: any) => (
              <AmashuriFixtureCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Activity} title={t('amashuri.schedule.empty')} hint={t('amashuri.schedule.empty_hint')} />
        )}
      </div>
    </>
  );
};

export default AkcFixturesPage;
