import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getLeagues, getLeague } from '../../api/endpoints/leagues';
import { getSports } from '../../api/endpoints/sports';
import useFavouriteSport from '../../hooks/useFavouriteSport';
import MatchRow, { pickFeatured } from '../../components/match/MatchRow';
import FixtureFilters from '../../components/match/FixtureFilters';
import StandingsTable from '../../components/match/StandingsTable';
import TopScorers from '../../components/match/TopScorers';
import MatchCard from '../../components/match/MatchCard';
import {
  MatchdayDivider,
  CompetitionHeader,
  groupFixtures,
  groupByCompetition,
} from '../../components/match/MatchGroup';
import AdSlot from '../../components/shared/AdSlot';
import Seo from '../../components/shared/Seo';
import { Button, EmptyState, ErrorState, SectionHeading, SkeletonList } from '../../components/ui';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useMotionSafe, listStack } from '../../lib/motion';

/**
 * Matches.
 *
 * TWO LAYOUTS, NOT ONE STRETCHED
 *   < lg  a single column of 68px rows, grouped by DATE. 44px header, 80px of
 *         filters, then nothing but matches — six above the fold.
 *   >= lg a two-column grid of cards, grouped by COMPETITION, plus a 320px rail
 *         carrying the table and top scorers.
 *
 * The grouping differs on purpose. A phone user is asking "what is on today", so
 * date leads. Someone scanning a twelve-card grid is reading one competition at a
 * time, and a date divider every one or two cards would shred the grid into
 * unusable slivers.
 *
 * Desktop is not the phone layout with wider margins. It has room to answer the
 * follow-up questions ("who's top?", "who's scoring?") in the same view, so it
 * does. Mobile deliberately refuses to, because on 360px every one of those
 * panels would push matches off the screen — and the list is the reason you came.
 *
 * The screen this replaced spent 486px of a 360x800 viewport on a navbar, a
 * centred 72px hero and a filter bar, then rendered one 194px card.
 */
const FixturesPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const isResultsPage = location.pathname === '/results';
  const isLivePage = location.pathname === '/live';
  // The route sets which status this screen opens on: /live → LIVE, /results →
  // COMPLETED, /fixtures → SCHEDULED. The filter chips still switch freely after.
  const defaultStatus = isLivePage ? 'LIVE' : isResultsPage ? 'COMPLETED' : 'SCHEDULED';
  const isDesktop = useIsDesktop();
  const safe = useMotionSafe();

  /**
   * WHICH SPORT THIS SCREEN IS SHOWING, and it is remembered.
   *
   * Matches, Live and Results used to pour every sport into one list — a football
   * fixture, a basketball quarter and a volleyball set stacked together, which is
   * not how anyone follows sport. The rail scopes the screen to one sport, and
   * "Make this my sport" stores it, so the next visit opens where you left off.
   *
   * It reuses `useFavouriteSport` — the same preference the rest of the app already
   * keeps — rather than inventing a second, competing memory of the same fact.
   */
  const { slug: favouriteSlug, choose, skip } = useFavouriteSport();
  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const sports = sportsRes?.data ?? [];
  const [sportSlug, setSportSlug] = useState(favouriteSlug || '');
  const activeSport = sports.find((s) => s.slug === sportSlug) ?? null;

  const [filters, setFilters] = useState({
    status: defaultStatus,
    leagueId: '',
    from: '',
    to: '',
  });

  const { data: leagues } = useQuery({
    queryKey: ['leagues-list-fixtures'],
    queryFn: () => getLeagues(),
  });

  /**
   * A LIVE LIST THAT DOES NOT UPDATE IS NOT A LIVE LIST.
   *
   * This screen previously fetched once and then sat there — open `/live` during a
   * match and the score you saw was the score when the page loaded. Every scores
   * product polls; 30s is the interval LiveScore-class sites settle on, fast enough
   * that a goal appears while you are still looking and slow enough not to punish a
   * Rwandan mobile connection.
   *
   * Polling ONLY while the live filter is showing, and `refetchIntervalInBackground`
   * left at its default so a backgrounded tab stops asking.
   */
  const isLiveList = filters.status === 'LIVE';
  const { data: fixtures, isLoading, isError, refetch } = useQuery({
    // The sport is part of the key, so switching sport refetches rather than
    // showing the previous sport's list under the new heading.
    queryKey: ['fixtures-list', filters, activeSport?.id ?? 'all'],
    queryFn: () => getFixtures(activeSport ? { ...filters, sportId: activeSport.id } : filters),
    refetchInterval: isLiveList ? 30000 : false,
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, status: defaultStatus }));
  }, [defaultStatus]);

  const list = fixtures?.data ?? [];
  const featured = pickFeatured(list);

  const groups = groupFixtures(list); // mobile: by date
  const compGroups = groupByCompetition(list); // desktop: by competition

  // The rail needs a league: the filtered one, else whichever league the lead
  // match belongs to. `getLeague` already returns sorted, ranked standings and
  // topScorers, so the rail costs one request rather than two.
  const railLeagueId = filters.leagueId || featured?.leagueId;
  const { data: railLeague, isLoading: railLoading } = useQuery({
    queryKey: ['league-details', String(railLeagueId)],
    queryFn: () => getLeague(railLeagueId),
    enabled: isDesktop && !!railLeagueId,
  });

  // Put the single in-list ad after the first group that completes six fixtures,
  // not after the first group. Days often hold one match, so "after group one"
  // would drop a banner under the very first row and cost the screen its density.
  const adAfterGroup = (() => {
    let seen = 0;
    for (let i = 0; i < groups.length; i += 1) {
      seen += groups[i].competitions.reduce((n, c) => n + c.fixtures.length, 0);
      if (seen >= 6) return i;
    }
    return groups.length - 1;
  })();

  const emptyCopy = {
    SCHEDULED: [t('fixtures.empty_scheduled'), t('fixtures.empty_scheduled_hint')],
    LIVE: [t('fixtures.empty_live'), t('fixtures.empty_live_hint')],
    COMPLETED: [t('fixtures.empty_completed'), t('fixtures.empty_completed_hint')],
  }[filters.status] ?? [t('fixtures.none'), t('fixtures.empty_generic_hint')];

  const rail = railLeague?.data;

  // Which of the four states is showing. Doubles as the AnimatePresence key, so
  // every transition between them cross-fades — including loading → list.
  const phase = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : list.length === 0
        ? 'empty'
        : `list-${filters.status}-${filters.leagueId}`;

  /**
   * ONE AnimatePresence AROUND ALL FOUR STATES.
   *
   * Each state used to be its own branch with only the list inside a presence.
   * Changing a filter flips React Query to loading, which unmounted the whole
   * AnimatePresence — and remounting it with `initial={false}` suppressed the
   * entrance, so the stagger silently never ran at all. Keeping one presence
   * mounted and keying it on the phase fixes that, and cross-fades the
   * loading → list transition for free.
   */
  const listBody = (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        variants={listStack(safe)}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {isLoading ? (
          // Placeholders in the shape the real content will take — rows on mobile,
          // cards on desktop — so nothing moves when the data lands.
          isDesktop ? (
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              <SkeletonList count={8}>
                <MatchCard.Skeleton />
              </SkeletonList>
            </div>
          ) : (
            <SkeletonList count={8}>
              <MatchRow.Skeleton />
            </SkeletonList>
          )
        ) : isError ? (
          <ErrorState
            title={t('fixtures.error_title')}
            hint={t('fixtures.error_hint')}
            onRetry={refetch}
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={emptyCopy[0]}
            hint={emptyCopy[1]}
            action={
              filters.leagueId ? (
                <Button
                  variant="secondary"
                  onClick={() => setFilters((prev) => ({ ...prev, leagueId: '' }))}
                >
                  {t('fixtures.show_all_leagues')}
                </Button>
              ) : null
            }
          />
        ) : isDesktop ? (
          /* DESKTOP: competition heading, then a two-column grid of cards.
             Grouped by league rather than date — see groupByCompetition. */
          compGroups.map((comp) => (
            <section key={comp.name} className="mb-5 last:mb-0">
              <SectionHeading title={comp.name} className="mb-2" />
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                {comp.fixtures.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </section>
          ))
        ) : (
          groups.map((group, gi) => {
          // One competition that day → its name rides in the divider and saves a
          // 20px row. With real data most days have a single match per league.
          const solo = group.competitions.length === 1;
          return (
            <section key={group.date ?? `tbd-${gi}`} className="mb-4 last:mb-0">
              {/* ONE CARD PER MATCHDAY.
                  The list used to be an edge-to-edge run of rows with a 24px grey
                  strip between days — dense, but it read as a spreadsheet and gave
                  the eye nothing to hold on to. A card per day gives each matchday
                  a boundary, and the divider becomes its header rather than a rule
                  floating in the middle of the page. */}
              <div className="overflow-hidden rounded-card border border-hairline bg-surface">
                <MatchdayDivider
                  date={group.date}
                  competition={solo ? group.competitions[0].name : undefined}
                  className="h-8 border-y-0 border-b border-hairline px-4"
                />
                {group.competitions.map((comp) => (
                  <div key={comp.name}>
                    {!solo && (
                      <CompetitionHeader
                        name={comp.name}
                        meta={comp.fixtures.length > 1 ? `${comp.fixtures.length}` : undefined}
                        className="h-7 bg-surface-2 px-4"
                      />
                    )}
                    {comp.fixtures.map((fixture) => (
                      <MatchRow key={fixture.id} fixture={fixture} />
                    ))}
                  </div>
                ))}
              </div>
              {/* Mobile only: desktop carries its inventory in the leaderboard and
                  the rail, so the list itself stays uninterrupted. */}
              {gi === adAfterGroup && <AdSlot position="fixtures" className="lg:hidden" />}
            </section>
            );
          })
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      <Seo
        title={isResultsPage ? t('nav.results') : t('nav.fixtures')}
        description={t('fixtures.seo_description')}
      />

      <FixtureFilters
        sports={sports}
        sportSlug={sportSlug}
        onSport={(slug) => {
          setSportSlug(slug);
          // Changing which sport you are LOOKING at is not the same as changing
          // which sport you follow, so the stored preference is left alone here.
          setFilters((prev) => ({ ...prev, leagueId: '' }));
        }}
        isFavourite={!!sportSlug && sportSlug === favouriteSlug}
        onPin={() => (sportSlug === favouriteSlug ? skip() : sportSlug && choose(sportSlug))}
        title={isLivePage ? t('nav.live') : isResultsPage ? t('nav.results') : t('nav.matches')}
        status={filters.status}
        leagueId={filters.leagueId}
        leagues={leagues?.data ?? []}
        onStatus={(status) => setFilters((prev) => ({ ...prev, status }))}
        onLeague={(leagueId) => setFilters((prev) => ({ ...prev, leagueId }))}
      />

      <div className="mx-auto max-w-3xl lg:max-w-6xl lg:px-6 lg:py-4">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
          {/* ─── list column ─── */}
          <div className="lg:space-y-3">
            <AdSlot position="fixtures-leaderboard" variant="leaderboard" className="hidden lg:block" />

            {/* Way through to the month view. This list answers "what is on";
                the calendar answers "is it still on" — which is the question
                once Umuganda has moved something. Nothing else on this page
                points there, and the home-page card that does hides itself on a
                month with no Umuganda in it. */}
            <div className="flex justify-end px-4 py-2 lg:px-0">
              <Link
                to="/calendar"
                className="inline-flex min-h-tap items-center gap-1.5 rounded-pill px-3 text-sm font-semibold text-brand-text transition-colors duration-150 ease-standard hover:bg-brand/10"
              >
                <CalendarDays size={15} aria-hidden="true" />
                {t('nav.calendar')}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            {/* Deliberately an unstyled wrapper. Rows and cards both carry their own
                borders, so a bordered container would double the frame — and
                `overflow-hidden` here would turn this into a sticky containing block
                and park any sticky child on top of the first row. */}
            <div className="px-4 pb-6 pt-3 lg:px-0">{listBody}</div>
          </div>

          {/* ─── rail ─── */}
          <aside className="hidden space-y-4 lg:sticky lg:top-[calc(theme(spacing.tap)+1rem)] lg:block">
            {railLoading ? (
              <>
                <StandingsTable.Skeleton />
                <TopScorers.Skeleton />
              </>
            ) : (
              <>
                {rail?.standings?.length > 0 && <StandingsTable rows={rail.standings} />}
                {rail?.topScorers?.length > 0 && <TopScorers scorers={rail.topScorers} />}
              </>
            )}
            <AdSlot position="fixtures-sidebar" variant="sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
};

export default FixturesPage;
