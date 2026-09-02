import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Users } from 'lucide-react';
import apiClient from '../../api/client';
import { getSports } from '../../api/endpoints/sports';
import { useEnumLabel } from '../../i18n/enums';
import Seo from '../../components/shared/Seo';
import TeamCard from '../../components/team/TeamCard';
import { Button, EmptyState, ErrorState, SkeletonList } from '../../components/ui';
import cn from '../../components/ui/cn';
import PageAd from '../../components/shared/PageAd';

/**
 * Public teams directory — a discovery entry point for the "Teams" nav item.
 * Reads the real /teams endpoint and reuses <ClubCrest> (via TeamCard); a
 * team card links to its own public profile at /teams/:id.
 *
 * THREE DEFECTS THIS REPLACES (client: "please redo /teams UI")
 *  1. Search used to share one flex row with 13 sport chips — on any screen
 *     narrow enough for the chips to need their scroll room, the search box
 *     lost the flex fight and got crushed to a ~40px circle with its
 *     placeholder clipped. It now gets its own row, capped at `max-w-sm` so
 *     nothing below it can ever squeeze it again.
 *  2. Every card used to hide the club's sport unless it had no city — so
 *     "APR FC" / "APR BBC" / "APR VC" / "APR Handball" were indistinguishable
 *     at a glance. TeamCard now always shows the sport, as a scannable badge
 *     next to the crest and again in the meta line.
 *  3. The grid was a flat, repetitive column of low identical rows. Cards are
 *     now taller (crest/name/meta/footer, same shell as LeagueCard), and when
 *     "All sports" is active the grid is sorted so each sport's clubs sit
 *     together — not grouped under headings, which on /leagues left rows with
 *     one card and two empty columns beside it.
 */

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

// Two across even at 360: this is a directory of 36 crests, not a feature grid.
const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-4';

const TeamsIndexPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const [search, setSearch] = useState('');
  const [sportId, setSportId] = useState('');

  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const sports = sportsRes?.data || [];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teams-index'],
    queryFn: async () => (await apiClient.get('/teams')).data,
  });
  const all = data?.data || [];
  const teams = all.filter((tm: any) => {
    const okSport = !sportId || String(tm.sportId ?? tm.sport?.id) === String(sportId);
    const okText = tm.name.toLowerCase().includes(search.trim().toLowerCase());
    return okSport && okText;
  });

  /**
   * SORTED by sport, not GROUPED by it.
   *
   * A heading per sport (tried on /leagues) left rows with a single card and
   * empty columns beside it — most sports here run far fewer clubs than
   * football. Sorting keeps every sport's clubs together in one dense grid;
   * each card's own sport badge carries the identity a heading would have.
   */
  const grouped = useMemo(() => {
    if (sportId || teams.length === 0) return null;
    const bySport = new Map<string, { sport: any; teams: any[] }>();
    teams.forEach((tm: any) => {
      const key = String(tm.sportId ?? tm.sport?.id ?? 'other');
      if (!bySport.has(key)) bySport.set(key, { sport: tm.sport, teams: [] });
      bySport.get(key)!.teams.push(tm);
    });
    const order = sports.map((s: any) => String(s.id));
    return [...bySport.values()].sort((a, b) => {
      const ia = order.indexOf(String(a.sport?.id));
      const ib = order.indexOf(String(b.sport?.id));
      return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    });
  }, [teams, sportId, sports]);

  /** Every club in one grid, sports kept together when "All sports" is active. */
  const ordered = useMemo(() => (grouped ? grouped.flatMap((g) => g.teams) : teams), [grouped, teams]);

  const hasFilters = Boolean(search || sportId);
  const clearFilters = () => {
    setSearch('');
    setSportId('');
  };

  return (
    <div className="min-h-screen bg-page">
      <Seo title={t('teams.title')} description={t('teams.seo_description')} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {t('teams.title')}
        </h1>
        <p className="mb-4 text-sm text-secondary sm:mb-6">{t('teams.subtitle')}</p>

        {/* Search — its own row, capped at max-w-sm, so the sport chip row
            below (13 chips, scrolling) can never share flex space with it
            and crush it down to an unreadable circle. */}
        <label className="mb-3 flex min-h-tap max-w-sm items-center gap-2.5 rounded-pill border border-hairline bg-surface px-4 transition-colors duration-150 ease-standard focus-within:border-brand">
          <Search size={17} aria-hidden="true" className="shrink-0 text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('teams.search_placeholder')}
            aria-label={t('teams.search_placeholder')}
            className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
          />
        </label>

        {sports.length > 0 && (
          <nav
            aria-label={t('teams.filter_sport')}
            className="scroll-contain -mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mb-6"
          >
            <Chip active={!sportId} onClick={() => setSportId('')}>
              {t('teams.all_sports')}
            </Chip>
            {sports.map((s: any) => (
              <Chip key={s.id} active={String(sportId) === String(s.id)} onClick={() => setSportId(String(s.id))}>
                {enumLabel('sport', s.name)}
              </Chip>
            ))}
          </nav>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 lg:max-w-6xl lg:px-6 lg:pb-14">
        {isLoading ? (
          <div className={GRID}>
            <SkeletonList count={6}>
              <TeamCard.Skeleton />
            </SkeletonList>
          </div>
        ) : isError ? (
          <ErrorState title={t('teams.error_title')} hint={t('teams.error_hint')} onRetry={refetch} />
        ) : ordered.length > 0 ? (
          <div className={GRID}>
            {ordered.map((tm: any) => (
              <TeamCard key={tm.id} team={tm} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={t('teams.none_title')}
            hint={t('teams.none_hint')}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  {t('common.clear_filters')}
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
      {/* Advertising sits at the FOOT of the page, after the content, never
          spliced into it. An advert dropped between two fixtures or two
          paragraphs interrupts the thing the reader came for; down here it is
          the last item on the screen and costs the page nothing. AdSlot
          collapses to nothing when the position has no inventory. */}
      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="teams" />
      </div>
    </div>
  );
};

export default TeamsIndexPage;
