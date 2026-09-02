import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLeagues } from '../../api/endpoints/leagues';
import { getSports } from '../../api/endpoints/sports';
import { useEnumLabel } from '../../i18n/enums';
import Seo from '../../components/shared/Seo';
import LeagueCard from '../../components/league/LeagueCard';
import { Button, EmptyState, ErrorState, SectionHeading, Select as SelectField, SkeletonList } from '../../components/ui';
import cn from '../../components/ui/cn';

// `Select` is a plain .jsx primitive with an untyped forwardRef signature, so a
// .tsx caller passing named props (label/value/onChange/...) fails the JSX
// attribute check even though every other page using it from .jsx is fine —
// checkJs is off, so only .tsx call sites see this. Cast once here rather than
// touching the shared primitive, which is out of scope for this pass.
const Select = SelectField as any;

/**
 * Sport filter chip — same spec as FixtureFilters' Chip (`h-8 px-3 text-xs
 * font-semibold rounded-pill border`), not imported from there because it is
 * that page's own private control, same reasoning FixtureFilters gives for
 * not sharing its Tab.
 */
const Chip = ({ active, children, ...props }: { active: boolean; children: React.ReactNode } & Record<string, any>) => (
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

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5';

const LeaguesPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const [filters, setFilters] = useState({ sportId: '', gender: '', level: '' });

  const { data: sports } = useQuery({
    queryKey: ['sports-list'],
    queryFn: getSports,
  });
  const sportsList = sports?.data ?? [];

  const { data: leagues, isLoading, isError, refetch } = useQuery({
    queryKey: ['leagues-list', filters],
    queryFn: () => getLeagues(filters),
  });

  const list = leagues?.data ?? [];

  /**
   * SORTED by sport, not GROUPED by it.
   *
   * Grouping put a heading over every sport, and since most sports run a single
   * competition that produced six rows with one card in them and two empty
   * columns beside it — a page mostly made of white space. Each card already
   * carries its sport on the photo band, so the heading was repeating what the
   * card says while costing the grid its density. Sorting keeps every sport's
   * leagues together and fills the rows.
   */
  const grouped = useMemo(() => {
    if (filters.sportId || list.length === 0) return null;
    const bySport = new Map<string, { sport: any; leagues: any[] }>();
    list.forEach((league: any) => {
      const key = String(league.sport?.id ?? league.sport?.slug ?? 'other');
      if (!bySport.has(key)) bySport.set(key, { sport: league.sport, leagues: [] });
      bySport.get(key)!.leagues.push(league);
    });
    const order = sportsList.map((s: any) => String(s.id));
    return [...bySport.values()].sort((a, b) => {
      const ia = order.indexOf(String(a.sport?.id));
      const ib = order.indexOf(String(b.sport?.id));
      return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    });
  }, [list, filters.sportId, sportsList]);

  /** Every league in one grid, sports kept together. */
  const ordered = useMemo(
    () => (grouped ? grouped.flatMap((g: any) => g.leagues) : list),
    [grouped, list]
  );

  return (
    <div className="min-h-screen bg-page">
      <Seo title={`${t('leagues.title')} ${t('leagues.title_accent')}`} description={t('leagues.subtitle')} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {t('leagues.title')} {t('leagues.title_accent')}
        </h1>
        <p className="mb-4 text-sm text-secondary sm:mb-6">{t('leagues.subtitle')}</p>

        {/* Sport — chips, not a dropdown: a fan recognises a sport faster by
            name/icon than by opening a picker, and this is what the grid
            below groups by. */}
        {sportsList.length > 0 && (
          <nav
            aria-label={t('leagues.filter_sport')}
            className="scroll-contain -mx-4 mb-3 flex items-center gap-2 overflow-x-auto px-4 pb-1"
          >
            <Chip active={!filters.sportId} onClick={() => setFilters((prev) => ({ ...prev, sportId: '' }))}>
              {t('leagues.all_sports')}
            </Chip>
            {sportsList.map((s: any) => (
              <Chip
                key={s.id}
                active={String(filters.sportId) === String(s.id)}
                onClick={() => setFilters((prev) => ({ ...prev, sportId: String(s.id) }))}
              >
                {enumLabel('sport', s.name)}
              </Chip>
            ))}
          </nav>
        )}

        {/* Gender / level — secondary filters, dense selects in a
            horizontally-scrolling row so they never force a 360px screen to
            overflow. */}
        <div className="scroll-contain -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mb-6">
          <Select
            label={t('leagues.filter_gender')}
            value={filters.gender}
            onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
            placeholder={t('leagues.all_genders')}
            options={[
              { value: 'MALE', label: t('enums.gender.MALE') },
              { value: 'FEMALE', label: t('enums.gender.FEMALE') },
              { value: 'MIXED', label: t('enums.gender.MIXED') },
            ]}
          />
          <Select
            label={t('leagues.filter_level')}
            value={filters.level}
            onChange={(e) => setFilters((prev) => ({ ...prev, level: e.target.value }))}
            placeholder={t('leagues.all_levels')}
            options={[
              { value: 'NATIONAL', label: t('enums.level.NATIONAL') },
              { value: 'REGIONAL', label: t('enums.level.REGIONAL') },
              { value: 'SCHOOL', label: t('enums.level.SCHOOL') },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 lg:max-w-6xl lg:px-6 lg:pb-14">
        {isLoading ? (
          <div className={GRID}>
            <SkeletonList count={6}>
              <LeagueCard.Skeleton />
            </SkeletonList>
          </div>
        ) : isError ? (
          <ErrorState title={t('leagues.error_title')} hint={t('leagues.error_hint')} onRetry={refetch} />
        ) : list.length > 0 ? (
          <div className={GRID}>
            {ordered.map((league: any) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title={t('leagues.none')}
            hint={t('leagues.none_hint')}
            action={
              <Button
                variant="secondary"
                onClick={() => setFilters({ sportId: '', gender: '', level: '' })}
              >
                {t('common.clear_filters')}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default LeaguesPage;
