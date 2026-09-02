import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, Info, ChevronLeft, Trophy, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEnumLabel } from '../../i18n/enums';
import { getLeague } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import { SPORT_PHOTOS } from '../../config/heroMedia';
import { SPORT_THEMES } from '../../config/sportThemes';
import StandingsTable from '../../components/match/StandingsTable';
import MatchRow from '../../components/match/MatchRow';
import LeagueStats from '../../components/shared/LeagueStats';
import Seo from '../../components/shared/Seo';
import SportIcon from '../../components/shared/SportIcon';
import ClubCrest from '../../components/ui/ClubCrest';
import StatusPill from '../../components/ui/StatusPill';
import { EmptyState, ErrorState, SectionHeading, Skeleton, SkeletonList } from '../../components/ui';
import cn from '../../components/ui/cn';

/**
 * Underline tab, copied from FixtureFilters — the reference for every tab strip
 * in the product. Not extracted into a shared primitive because it is a page
 * header concern, same as FixtureFilters' own private Tab.
 */
const Tab = ({ active, children, ...props }: { active: boolean; children: React.ReactNode } & Record<string, any>) => (
  <button
    type="button"
    aria-current={active ? 'page' : undefined}
    className={cn(
      'relative -mb-px flex min-h-tap shrink-0 items-center whitespace-nowrap px-0.5 text-sm font-semibold',
      'transition-colors duration-150 ease-standard',
      'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[""]',
      active
        ? 'text-primary after:bg-brand'
        : 'text-secondary after:bg-transparent hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

// Most leagues on the platform are in a sport with a real photograph (see
// SPORT_PHOTOS), so the skeleton assumes the band — the rare sport without one
// just resolves to a shorter header than its placeholder promised, same
// trade-off SportLayout's own loading state makes.
const HeaderSkeleton = () => (
  <div>
    <Skeleton className="h-[180px] w-full sm:h-[220px] lg:h-[240px]" />
    <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
      <Skeleton className="h-4 w-40" />
      <div className="mt-5 flex gap-6 border-b border-hairline pb-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

/** Sport photograph for the header band — a real one where it exists, else the
 * curated backdrop `sportThemes.ts` already uses on `/sports/:slug`, else no
 * band at all (never a grey box standing in for a photograph). */
const heroPhoto = (slug?: string | null): string | null => {
  if (!slug) return null;
  if (SPORT_PHOTOS.has(slug)) return `/hero/${slug}.jpg`;
  const bg = (SPORT_THEMES as Record<string, { bg?: string }>)[slug]?.bg;
  return bg ? `${bg}&w=1200` : null;
};

const LeagueDetailsPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('standings');

  const {
    data: league,
    isLoading: leagueLoading,
    isError: leagueIsError,
    refetch: refetchLeague,
  } = useQuery({
    queryKey: ['league-details', id],
    queryFn: () => getLeague(id),
  });

  const {
    data: fixtures,
    isLoading: fixturesLoading,
    isError: fixturesIsError,
    refetch: refetchFixtures,
  } = useQuery({
    queryKey: ['league-fixtures', id],
    queryFn: () => getFixtures({ leagueId: id }),
    enabled: !!id,
  });

  const tabs = [
    { id: 'standings', label: t('league.tab_standings') },
    { id: 'stats', label: t('league.tab_stats') },
    { id: 'fixtures', label: t('nav.fixtures') },
    { id: 'teams', label: t('nav.teams') },
  ];

  if (leagueLoading) {
    return (
      <div className="min-h-screen bg-page">
        <HeaderSkeleton />
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 lg:max-w-6xl lg:px-6 lg:pb-14">
          <SkeletonList count={6}>
            <div className="mb-2 flex items-center gap-2 border-b border-hairline px-3 py-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-3 flex-1" />
            </div>
          </SkeletonList>
        </div>
      </div>
    );
  }

  if (leagueIsError) {
    return (
      <div className="min-h-screen bg-page">
        <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
          <Link
            to="/leagues"
            className="inline-flex min-h-tap items-center gap-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-primary"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            {t('league.back_to_leagues')}
          </Link>
        </div>
        <ErrorState title={t('league.error_title')} hint={t('league.error_hint')} onRetry={refetchLeague} />
      </div>
    );
  }

  const leagueData = league?.data;
  const standingsRows = leagueData?.standings ?? [];
  const fixturesList = fixtures?.data ?? [];
  const teamEntries = (leagueData?.teams ?? []).filter(({ team }: any) => team);
  const slug = leagueData?.sport?.slug;
  const heroImg = heroPhoto(slug);

  return (
    <div className="min-h-screen bg-page pb-10 lg:pb-14">
      <Seo
        title={leagueData?.name}
        description={t('leagues.season', { season: leagueData?.season })}
      />

      {/* Identity — a photograph of the league's sport as a compact band where
          one exists (same idiom as SportLayout's hub header, just shorter),
          the back link and league name riding on it in white; the plain
          in-column header otherwise. */}
      {heroImg ? (
        <div className="relative h-[180px] overflow-hidden sm:h-[220px] lg:h-[240px]">
          <img
            src={heroImg}
            alt=""
            fetchpriority="high"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-4 lg:max-w-6xl lg:px-6 lg:pb-5">
            <Link
              to="/leagues"
              className="mb-auto mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-white/80 transition-colors duration-150 ease-standard hover:text-white"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              {t('league.back_to_leagues')}
            </Link>
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-pill border border-white/25 bg-white/15 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              <SportIcon slug={slug} size={12} />
              {enumLabel('sport', leagueData?.sport?.name)}
            </span>
            <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl lg:text-4xl">
              {leagueData?.name}
            </h1>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        {!heroImg && (
          <>
            <Link
              to="/leagues"
              className="inline-flex min-h-tap items-center gap-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-primary"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              {t('league.back_to_leagues')}
            </Link>

            <h1 className="mb-3 mt-1 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
              {leagueData?.name}
            </h1>
          </>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-secondary sm:mb-6">
          <StatusPill status={leagueData?.status} label={enumLabel('league_status', leagueData?.status)} />
          {!heroImg && (
            <span className="flex items-center gap-1.5">
              <Trophy size={14} className="text-tertiary" aria-hidden="true" />
              {enumLabel('sport', leagueData?.sport?.name)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-tertiary" aria-hidden="true" />
            {t('leagues.season', { season: leagueData?.season })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-tertiary" aria-hidden="true" />
            {t('league.participant_count', { count: leagueData?.teams?.length || 0 })}
          </span>
          <span className="flex items-center gap-1.5">
            <Info size={14} className="text-tertiary" aria-hidden="true" />
            {t('league.level_label', { level: enumLabel('level', leagueData?.level) })}
          </span>
        </div>

        {/* Tabs — underline style, exactly FixtureFilters' Tab. */}
        <nav
          aria-label={t('league.tabs_label', 'League sections')}
          className="scroll-contain flex items-stretch gap-6 overflow-x-auto border-b border-hairline"
        >
          {tabs.map((tab) => (
            <Tab key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </Tab>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        {activeTab === 'standings' && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionHeading title={t('league.current_standings')} />
              <span className="shrink-0 text-xs text-tertiary">{t('league.last_updated_today')}</span>
            </div>
            {standingsRows.length > 0 ? (
              <StandingsTable rows={standingsRows} />
            ) : (
              <EmptyState icon={Trophy} title={t('standings.empty')} />
            )}
          </section>
        )}

        {activeTab === 'stats' && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionHeading title={t('league.season_statistics')} />
              <span className="shrink-0 text-xs text-tertiary">{t('league.visual_insights')}</span>
            </div>
            <LeagueStats standings={standingsRows} topScorers={leagueData?.topScorers || []} />
          </section>
        )}

        {activeTab === 'fixtures' && (
          <section>
            <SectionHeading title={t('league.fixtures_and_results')} className="mb-3" />
            {fixturesLoading ? (
              <div className="overflow-hidden rounded-card border border-hairline bg-surface">
                <SkeletonList count={5}>
                  <MatchRow.Skeleton />
                </SkeletonList>
              </div>
            ) : fixturesIsError ? (
              <ErrorState
                title={t('league.fixtures_error_title')}
                hint={t('league.fixtures_error_hint')}
                onRetry={refetchFixtures}
              />
            ) : fixturesList.length > 0 ? (
              <div className="overflow-hidden rounded-card border border-hairline bg-surface">
                {fixturesList.map((f: any) => (
                  <MatchRow key={f.id} fixture={f} showDate />
                ))}
              </div>
            ) : (
              <EmptyState icon={CalendarDays} title={t('league.no_fixtures')} />
            )}
          </section>
        )}

        {activeTab === 'teams' && (
          <section>
            <SectionHeading title={t('league.participating_teams')} className="mb-3" />
            {teamEntries.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {teamEntries.map(({ team }: any) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="flex flex-col items-center gap-2 rounded-card border border-hairline bg-surface p-4 text-center transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
                  >
                    <ClubCrest team={team} size="lg" />
                    <span className="line-clamp-2 text-xs font-semibold leading-tight text-primary">
                      {team.name}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title={t('league.no_teams')} hint={t('league.no_teams_hint')} />
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default LeagueDetailsPage;
