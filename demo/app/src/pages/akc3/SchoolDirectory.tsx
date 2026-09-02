import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, Search, ChevronRight } from 'lucide-react';
import { getSchools } from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import Seo from '../../components/shared/Seo';
import { Badge, EmptyState, ErrorState, Input as InputField, Skeleton, SkeletonList } from '../../components/ui';
import cn from '../../components/ui/cn';

// Input is a forwardRef .jsx primitive with an untyped signature, so a .tsx
// caller fails the JSX attribute check even though every .jsx call site is
// fine — checkJs is off, so only .tsx sees this (same gap LeaguesPage
// documents for Select). Cast once here rather than touching the primitive.
const Input = InputField as any;

const CATEGORY_CHIPS: [string, string][] = [
  ['', 'amashuri.directory.all_categories'],
  ['PRIMARY', 'amashuri.directory.primary'],
  ['SECONDARY', 'amashuri.directory.secondary'],
  ['TVET', 'amashuri.directory.tvet'],
];

const CategoryChip = ({ active, children, ...props }: any) => (
  <button
    type="button"
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

const SchoolCard = ({ school, t, enumLabel }: { school: any; t: any; enumLabel: any }) => (
  <Link
    to={`/amashuri/schools/${school.id}`}
    className="group flex h-full flex-col gap-4 rounded-card border border-hairline bg-surface p-4 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2 sm:p-5"
  >
    <div className="flex items-start justify-between gap-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary transition-colors duration-150 ease-standard group-hover:bg-brand-tint group-hover:text-brand-text">
        <School size={18} aria-hidden="true" />
      </span>
      <Badge>{enumLabel('school_category', school.category)}</Badge>
    </div>

    <div className="min-w-0 flex-1 space-y-1">
      <h3 className="truncate font-display text-lg font-semibold text-primary">{school.name}</h3>
      <p className="flex items-center gap-1.5 truncate text-xs text-tertiary">
        {school.code && (
          <>
            <span>{t('amashuri.directory.code', { code: school.code })}</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span className="truncate">{school.sector || t('amashuri.level.national')}</span>
      </p>
    </div>

    <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard group-hover:text-brand-text">
      <span>{t('amashuri.directory.view_teams')}</span>
      <ChevronRight size={15} aria-hidden="true" />
    </div>
  </Link>
);

const SchoolCardSkeleton = () => (
  <div className="h-full rounded-card border border-hairline bg-surface p-4 sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-2">
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-5 w-16" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="mt-2 h-3 w-1/2" />
    <div className="mt-4 border-t border-hairline pt-3">
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
);

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5';

const SchoolDirectory = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const [filters, setFilters] = useState({ category: '', search: '' });

  const { data: schools, isLoading, isError, refetch } = useQuery({
    queryKey: ['amashuri-schools-directory', filters],
    queryFn: () => getSchools(filters),
    retry: false,
  });

  const list = schools?.data || [];

  return (
    <div className="min-h-screen bg-page">
      <Seo title={t('seo.amashuri_directory_title')} description={t('seo.amashuri_directory_desc')} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {t('amashuri.directory.title')} {t('amashuri.directory.accent')}
        </h1>
        <p className="mb-4 text-sm text-secondary sm:mb-6">{t('amashuri.directory.subtitle')}</p>

        <label htmlFor="school-search" className="sr-only">{t('common.search')}</label>
        <div className="relative mb-4">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" aria-hidden="true" />
          <Input
            id="school-search"
            type="text"
            placeholder={t('amashuri.directory.search_placeholder')}
            className="pl-11"
            value={filters.search}
            onChange={(e: any) => setFilters((p) => ({ ...p, search: e.target.value }))}
          />
        </div>

        <div role="group" aria-label={t('amashuri.categories')} className="scroll-contain -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {CATEGORY_CHIPS.map(([value, labelKey]) => (
            <CategoryChip key={value || 'all'} active={filters.category === value} onClick={() => setFilters((p) => ({ ...p, category: value }))}>
              {t(labelKey)}
            </CategoryChip>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 lg:max-w-6xl lg:px-6 lg:pb-14">
        {isLoading ? (
          <div className={GRID}>
            <SkeletonList count={6}>
              <SchoolCardSkeleton />
            </SkeletonList>
          </div>
        ) : isError ? (
          <ErrorState title={t('amashuri.directory.error_title')} hint={t('amashuri.directory.error_hint')} onRetry={refetch} />
        ) : list.length > 0 ? (
          <div className={GRID}>
            {list.map((school: any) => <SchoolCard key={school.id} school={school} t={t} enumLabel={enumLabel} />)}
          </div>
        ) : (
          <EmptyState icon={School} title={t('amashuri.directory.not_found')} hint={t('amashuri.directory.not_found_hint')} />
        )}
      </div>
    </div>
  );
};

export default SchoolDirectory;
