import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy, Calendar, MapPin, Layers, ChevronRight, Medal } from 'lucide-react';
import { format } from 'date-fns';
import { getChampionships, getSchools } from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import Seo from '../../components/shared/Seo';
import AmashuriStats from '../../components/amashuri/AmashuriStats';
import { EmptyState, ErrorState, SectionHeading, Skeleton, SkeletonList, StatusPill } from '../../components/ui';

const ChampionshipCard = ({ c, t, enumLabel }: { c: any; t: any; enumLabel: any }) => (
  <Link
    to="/amashuri/standings"
    className="group flex h-full flex-col gap-4 rounded-card border border-hairline bg-surface p-4 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2 sm:p-5"
  >
    <div className="flex items-start justify-between gap-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary transition-colors duration-150 ease-standard group-hover:bg-brand-tint group-hover:text-brand-text">
        <Trophy size={18} aria-hidden="true" />
      </span>
      <StatusPill status={c.status || 'UPCOMING'} label={enumLabel('championship_status', c.status || 'UPCOMING')} />
    </div>

    <div className="min-w-0 flex-1 space-y-1">
      <h3 className="truncate font-display text-lg font-semibold text-primary">{c.name}</h3>
      {c.edition && <p className="text-xs text-tertiary">{c.edition}</p>}
    </div>

    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
      <span className="flex items-center gap-1.5">
        <Layers size={12} className="shrink-0 text-tertiary" aria-hidden="true" />
        {c.level ? enumLabel('level', c.level) : t('amashuri.level.national')}
      </span>
      {c.venue && (
        <span className="flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-tertiary" aria-hidden="true" /> {c.venue}
        </span>
      )}
      {c.startDate && (
        <span className="flex items-center gap-1.5">
          <Calendar size={12} className="shrink-0 text-tertiary" aria-hidden="true" /> {format(new Date(c.startDate), 'dd MMM yyyy')}
        </span>
      )}
    </div>

    <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3 text-xs">
      <span className="text-secondary">
        {t('amashuri.championships_page.fixtures_teams', { fixtures: c._count?.fixtures ?? 0, teams: c._count?.standings ?? 0 })}
      </span>
      <span className="flex items-center gap-1 font-semibold text-secondary transition-colors duration-150 ease-standard group-hover:text-brand-text">
        {t('amashuri.championships_page.standings')} <ChevronRight size={14} aria-hidden="true" />
      </span>
    </div>
  </Link>
);

const ChampionshipCardSkeleton = () => (
  <div className="h-full rounded-card border border-hairline bg-surface p-4 sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-2">
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-5 w-16" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="mt-2 h-3 w-1/2" />
    <div className="mt-4 border-t border-hairline pt-3">
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5';

const ChampionshipsPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();

  const { data: comps, isLoading, isError, refetch } = useQuery({
    queryKey: ['amashuri-championships'],
    queryFn: () => getChampionships(),
    retry: false,
  });
  const { data: schools } = useQuery({
    queryKey: ['amashuri-schools-all'],
    queryFn: () => getSchools(),
    retry: false,
  });

  const championships = comps?.data || [];

  return (
    <>
      <Seo title={t('seo.amashuri_championships_title')} description={t('seo.amashuri_championships_desc')} />

      {/* NO H1 HERE. The tab bar in AmashuriLayout already names this
          page, and a title repeating it pushed the content another
          80px down for nothing. */}
      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <p className="text-sm text-secondary">{t('amashuri.championships_page.subtitle')}</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 pb-10 lg:max-w-6xl lg:px-6 lg:pb-14">
        <section>
          <SectionHeading
            eyebrow={t('amashuri.championships_page.umbrella')}
            title={t('amashuri.championships_page.all')}
            accent={t('amashuri.championships_page.all_accent')}
            className="mb-4"
          />
          {isLoading ? (
            <div className={GRID}>
              <SkeletonList count={6}>
                <ChampionshipCardSkeleton />
              </SkeletonList>
            </div>
          ) : isError ? (
            <ErrorState title={t('amashuri.championships_page.error_title')} hint={t('amashuri.championships_page.error_hint')} onRetry={refetch} />
          ) : championships.length > 0 ? (
            <div className={GRID}>
              {championships.map((c: any) => <ChampionshipCard key={c.id} c={c} t={t} enumLabel={enumLabel} />)}
            </div>
          ) : (
            <EmptyState icon={Medal} title={t('amashuri.championships_page.none')} hint={t('amashuri.championships_page.none_hint')} />
          )}
        </section>

        <section>
          <SectionHeading
            eyebrow={t('amashuri.championships_page.insights')}
            title={t('amashuri.championships_page.numbers')}
            accent={t('amashuri.championships_page.numbers_accent')}
            className="mb-4"
          />
          <AmashuriStats schools={schools?.data || []} championships={championships} />
        </section>
      </div>
    </>
  );
};

export default ChampionshipsPage;
