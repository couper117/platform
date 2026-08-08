import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getLeagues, getLeague } from '../../api/endpoints/leagues';
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
  const location = useLocation();
  const isResultsPage = location.pathname === '/results';
  const isDesktop = useIsDesktop();
  const safe = useMotionSafe();

  const [filters, setFilters] = useState({
    status: isResultsPage ? 'COMPLETED' : 'SCHEDULED',
    leagueId: '',
    from: '',
    to: '',
  });

  const { data: leagues } = useQuery({
    queryKey: ['leagues-list-fixtures'],
    queryFn: () => getLeagues(),
  });

  const { data: fixtures, isLoading, isError, refetch } = useQuery({
    queryKey: ['fixtures-list', filters],
    queryFn: () => getFixtures(filters),
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, status: isResultsPage ? 'COMPLETED' : 'SCHEDULED' }));
  }, [isResultsPage]);

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
    SCHEDULED: ['No matches scheduled', 'Fixtures appear here once a league publishes its schedule.'],
    LIVE: ['Nothing live right now', 'Kick-offs show up here the moment a match starts.'],
    COMPLETED: ['No results yet', 'Final scores appear here as matches finish.'],
  }[filters.status] ?? ['No matches found', 'Try a different competition.'];

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
            title="Could not load matches"
            hint="Check your connection and try again."
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
                  Show all leagues
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
            <section key={group.date ?? `tbd-${gi}`}>
              <MatchdayDivider
                date={group.date}
                competition={solo ? group.competitions[0].name : undefined}
              />
              {group.competitions.map((comp) => (
                <div key={comp.name}>
                  {!solo && (
                    <CompetitionHeader
                      name={comp.name}
                      meta={comp.fixtures.length > 1 ? `${comp.fixtures.length}` : undefined}
                    />
                  )}
                  {comp.fixtures.map((fixture) => (
                    <MatchRow key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              ))}
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
        title={isResultsPage ? 'Results' : 'Matches'}
        description="Fixtures, live scores and results across Rwandan sport."
      />

      <FixtureFilters
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

            {/* Deliberately an unstyled wrapper. Rows and cards both carry their own
                borders, so a bordered container would double the frame — and
                `overflow-hidden` here would turn this into a sticky containing block
                and park any sticky child on top of the first row. */}
            <div>{listBody}</div>
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
